import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { GroupOutlined, LockReset, PersonAddAlt1, PersonOff, Search } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { changeUserRole, createUser, deleteUser, getUsers, resetUserPassword, setUserAccess } from '../../api/services';
import { ROLE_LABELS, USER_ROLES, roleSatisfies, type UserRole } from '../../utils/roles';

export interface AdminUser {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  usertype: UserRole;
  accessEnabled?: boolean;
  createdAt?: string;
}

const rowsPerPage = 12;
const EMPTY_USERS: AdminUser[] = [];

const ROLE_COLORS: Record<UserRole, 'default' | 'primary' | 'info' | 'warning' | 'success' | 'error' | 'secondary'> = {
  super_admin: 'error',
  admin: 'warning',
  hr: 'info',
  account: 'primary',
  finance: 'secondary',
  sales: 'success',
  marketing: 'info',
  employee: 'success',
  customer: 'default',
};

/** Roles the signed-in account is allowed to hand out, mirroring the backend rule. */
const assignableRoles = (actorRole: unknown): UserRole[] =>
  USER_ROLES.filter((role) => role !== 'super_admin' || roleSatisfies(actorRole, 'super_admin'));

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

const errorMessage = (error: any): string =>
  error?.response?.data?.message ?? 'Something went wrong. Please try again.';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  usertype: 'customer' as UserRole,
  userimage: '',
};

/** Mirrors the backend DTO so the form fails fast instead of posting invalid data. */
const PHONE_PATTERN = /^[6-9][0-9]{9}$/;

const signedInUserId = (): string | null => {
  const token = Cookies.get('access_token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.sub === 'string' ? json.sub : null;
  } catch {
    return null;
  }
};

const hasAccess = (user: AdminUser) => user.accessEnabled !== false;

const isValidForm = (form: typeof EMPTY_FORM) =>
  form.name.trim().length > 0 &&
  /^\S+@\S+\.\S+$/.test(form.email.trim()) &&
  PHONE_PATTERN.test(form.phone.trim()) &&
  form.password.length >= 6;

const Users: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState<string[]>([]);
  const [passwordFor, setPasswordFor] = useState<AdminUser | null>(null);
  const [nextPassword, setNextPassword] = useState('');
  const [confirm, setConfirm] = useState<null | { kind: 'delete' | 'remove' | 'restore'; ids: string[] }>(null);
  const queryClient = useQueryClient();
  const selfId = signedInUserId();

  // Drives which roles this account may assign. The backend re-checks this on every
  // request, so a stale cookie only ever widens the menu, never the permissions.
  const actorRole = Cookies.get('user_type');
  const allowedRoles = useMemo(() => assignableRoles(actorRole), [actorRole]);

  const { data, isPending, error } = useQuery<AdminUser[], Error>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, usertype }: { userId: string; usertype: UserRole }) =>
      changeUserRole(userId, usertype),
    onSuccess: (response: any) => {
      toast.success(response?.data?.message ?? 'Role updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const refreshUsers = () => {
    setSelected([]);
    setConfirm(null);
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const accessMutation = useMutation({
    mutationFn: ({ ids, enabled }: { ids: string[]; enabled: boolean }) =>
      Promise.all(ids.map((id) => setUserAccess(id, enabled))),
    onSuccess: (_result, variables) => {
      toast.success(variables.enabled ? 'Access restored' : 'Access removed');
      refreshUsers();
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => deleteUser(id))),
    onSuccess: () => {
      toast.success('Account deleted');
      refreshUsers();
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      resetUserPassword(userId, password),
    onSuccess: (response: any) => {
      toast.success(response?.data?.message ?? 'Password updated');
      setPasswordFor(null);
      setNextPassword('');
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (response: any) => {
      toast.success(response?.data?.message ?? 'User created');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const submitCreate = () => {
    const payload: {
      name: string;
      email: string;
      phone: string;
      password: string;
      usertype: UserRole;
      userimage?: string;
    } = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      usertype: form.usertype,
    };
    // Omit the key entirely rather than sending an empty string. @IsOptional() only
    // skips validation for null/undefined, so a blank value would still be validated.
    const userimage = form.userimage.trim();
    if (userimage) {
      payload.userimage = userimage;
    }
    createMutation.mutate(payload);
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, usertype: allowedRoles[0] ?? 'customer' });
    setCreateOpen(true);
  };

  const updateField = (field: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const users = data ?? EMPTY_USERS;

  const filteredUsers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phone, user.usertype].some((value) =>
        value?.toLowerCase().includes(query),
      ),
    );
  }, [users, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = (user: AdminUser, usertype: UserRole) => {
    roleMutation.mutate({ userId: user._id, usertype });
  };

  const selectableIds = visibleUsers.filter((user) => user._id !== selfId).map((user) => user._id);
  const allVisibleSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id));

  const toggleOne = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleVisible = () => {
    setSelected((current) =>
      allVisibleSelected
        ? current.filter((id) => !selectableIds.includes(id))
        : Array.from(new Set([...current, ...selectableIds])),
    );
  };

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === 'delete') {
      deleteMutation.mutate(confirm.ids);
      return;
    }
    accessMutation.mutate({ ids: confirm.ids, enabled: confirm.kind === 'restore' });
  };

  const busy = accessMutation.isPending || deleteMutation.isPending;

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography color="error">Unable to load users. Please try again.</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            People and access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Give each person one seat, a username, and a password. Removing access keeps the account and stops sign-in. Deleting removes the account.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip
            icon={<GroupOutlined />}
            label={`${users.length} total`}
            sx={{ bgcolor: '#e7f1f7', color: '#0f63a5', fontWeight: 600 }}
          />
          <Button
            onClick={openCreate}
            startIcon={<PersonAddAlt1 />}
            variant="contained"
            sx={{ borderRadius: 1.5, bgcolor: '#0f63a5', fontWeight: 600, '&:hover': { bgcolor: '#0b4f83' } }}
          >
            Add user
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 99, 165, 0.08)' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            value={searchText}
            onChange={handleSearch}
            placeholder="Search name, email, phone or role"
            size="small"
            sx={{ width: { xs: '100%', sm: 380 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <Search fontSize="small" /> }}
          />
          <Typography variant="caption" color="text.secondary">
            {filteredUsers.length} matching users
          </Typography>
        </Box>
        <Divider />
        {selected.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2, py: 1.5, bgcolor: '#f4f8fb' }} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
              {selected.length} selected
            </Typography>
            <Button size="small" disabled={busy} onClick={() => setConfirm({ kind: 'remove', ids: selected })}>
              Remove access
            </Button>
            <Button size="small" disabled={busy} onClick={() => setConfirm({ kind: 'restore', ids: selected })}>
              Restore access
            </Button>
            <Button size="small" color="error" disabled={busy} onClick={() => setConfirm({ kind: 'delete', ids: selected })}>
              Delete
            </Button>
          </Stack>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={allVisibleSelected}
                    indeterminate={selected.length > 0 && !allVisibleSelected}
                    onChange={toggleVisible}
                    inputProps={{ 'aria-label': 'Select everyone on this page' }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Access</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      No users match that search.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visibleUsers.map((user) => {
                  const isSelf = user._id === selfId;
                  const active = hasAccess(user);
                  return (
                    <TableRow key={user._id} hover selected={selected.includes(user._id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selected.includes(user._id)}
                          disabled={isSelf}
                          onChange={() => toggleOne(user._id)}
                          inputProps={{ 'aria-label': `Select ${user.name ?? user.email ?? 'user'}` }}
                        />
                      </TableCell>
                      <TableCell>
                        {user.name ?? '-'}
                        {isSelf && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Signed in
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{user.email ?? '-'}</TableCell>
                      <TableCell>{user.phone ?? '-'}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Chip size="small" label={ROLE_LABELS[user.usertype] ?? user.usertype} color={ROLE_COLORS[user.usertype] ?? 'default'} />
                          <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel id={`role-label-${user._id}`}>Role</InputLabel>
                            <Select
                              labelId={`role-label-${user._id}`}
                              label="Role"
                              value={user.usertype}
                              disabled={roleMutation.isPending || isSelf}
                              onChange={(event) => handleRoleChange(user, event.target.value as UserRole)}
                              renderValue={(value) => ROLE_LABELS[value as UserRole] ?? value}
                              sx={{ borderRadius: 2 }}
                            >
                              {allowedRoles.map((role) => (
                                <MenuItem key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={active ? 'Can sign in' : 'Access removed'} color={active ? 'success' : 'default'} />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                          Joined {formatDate(user.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          <Tooltip title="Set a new password">
                            <span>
                              <Button
                                size="small"
                                startIcon={<LockReset />}
                                disabled={isSelf}
                                onClick={() => {
                                  setPasswordFor(user);
                                  setNextPassword('');
                                }}
                              >
                                Password
                              </Button>
                            </span>
                          </Tooltip>
                          <Button
                            size="small"
                            startIcon={<PersonOff />}
                            disabled={isSelf || busy}
                            onClick={() => setConfirm({ kind: active ? 'remove' : 'restore', ids: [user._id] })}
                          >
                            {active ? 'Remove access' : 'Restore'}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            disabled={isSelf || busy}
                            onClick={() => setConfirm({ kind: 'delete', ids: [user._id] })}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(_event, page) => setCurrentPage(page)}
          color="primary"
        />
      </Stack>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Full name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
              fullWidth
              size="small"
              helperText="10-digit Indian mobile number, starting 6-9"
              error={form.phone.length > 0 && !PHONE_PATTERN.test(form.phone)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Temporary password"
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              fullWidth
              size="small"
              helperText="Minimum 6 characters. Share it with the user to be changed at first login."
              error={form.password.length > 0 && form.password.length < 6}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel id="create-role-label">Role</InputLabel>
              <Select
                labelId="create-role-label"
                label="Role"
                value={form.usertype}
                onChange={(e) => updateField('usertype', e.target.value)}
                renderValue={(value) => ROLE_LABELS[value as UserRole] ?? value}
                sx={{ borderRadius: 2 }}
              >
                {allowedRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                HR sees Applications and Employees. Accounts and Finance see Payments. Sales sees Leads.
              </Typography>
            </FormControl>
            <TextField
              label="Profile image URL (optional)"
              value={form.userimage}
              onChange={(e) => updateField('userimage', e.target.value)}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ borderRadius: 1.5 }}>
            Cancel
          </Button>
          <Button
            onClick={submitCreate}
            disabled={!isValidForm(form) || createMutation.isPending}
            variant="contained"
            sx={{ borderRadius: 1.5, bgcolor: '#0f63a5', fontWeight: 600, '&:hover': { bgcolor: '#0b4f83' } }}
          >
            {createMutation.isPending ? 'Creating...' : 'Create user'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(passwordFor)} onClose={() => setPasswordFor(null)} fullWidth maxWidth="xs">
        <DialogTitle>Set password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This becomes the password for {passwordFor?.email}. Share it with them directly.
          </Typography>
          <TextField
            label="New password"
            type="password"
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
            fullWidth
            size="small"
            helperText="Minimum 6 characters"
            error={nextPassword.length > 0 && nextPassword.length < 6}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordFor(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={nextPassword.length < 6 || passwordMutation.isPending || !passwordFor}
            onClick={() => passwordFor && passwordMutation.mutate({ userId: passwordFor._id, password: nextPassword })}
            sx={{ bgcolor: '#0f63a5', '&:hover': { bgcolor: '#0b4f83' } }}
          >
            {passwordMutation.isPending ? 'Saving...' : 'Save password'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {confirm?.kind === 'delete' ? 'Delete accounts' : confirm?.kind === 'restore' ? 'Restore access' : 'Remove access'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirm?.kind === 'delete'
              ? `${confirm.ids.length} account${confirm.ids.length === 1 ? '' : 's'} will be deleted. This cannot be undone.`
              : confirm?.kind === 'restore'
                ? `${confirm.ids.length} ${confirm.ids.length === 1 ? 'person' : 'people'} will be able to sign in with their username and password.`
                : `${confirm?.ids.length ?? 0} ${confirm?.ids.length === 1 ? 'person' : 'people'} will stay on file, but their username and password will stop working.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirm?.kind === 'delete' ? 'error' : 'primary'}
            disabled={busy}
            onClick={runConfirm}
          >
            {busy ? 'Working...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;

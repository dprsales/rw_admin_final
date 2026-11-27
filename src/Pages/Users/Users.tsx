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
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
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
  Typography,
} from '@mui/material';
import {
  DeleteOutline,
  GroupOutlined,
  LockReset,
  MoreVert,
  PersonAddAlt1,
  PersonOff,
  Search,
  Tune,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { createUser, deleteUser, getUsers, resetUserPassword, setUserAccess } from '../../api/services';
import {
  DEPARTMENT_LABELS,
  ROLE_LABELS,
  USER_DEPARTMENTS,
  USER_ROLES,
  defaultDepartmentForRole,
  defaultDeskAccessForRole,
  roleSatisfies,
  type UserDepartment,
  type UserRole,
} from '../../utils/roles';
import PageHeader from '../../Components/PageHeader';
import EmptyState from '../../Components/EmptyState';
import ConfirmDialog from '../../Components/ConfirmDialog';
import { useTableSort, SortableHeadCell } from '../../Components/TableSort';
import { tokens } from '../../Theme/tokens';
import UserManageModal from './UserManageModal';

export interface AdminUser {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  usertype: UserRole;
  department?: string | null;
  menuAccess?: string[] | null;
  deskAccess?: string[] | null;
  accessEnabled?: boolean;
  createdAt?: string;
}

function deskChips(user: AdminUser): string[] {
  const desks =
    Array.isArray(user.deskAccess) && user.deskAccess.length
      ? user.deskAccess
      : defaultDeskAccessForRole(user.usertype);
  return desks.map((d) => (d === 'crm' ? 'CRM' : 'Admin'));
}

const rowsPerPage = 12;
const EMPTY_USERS: AdminUser[] = [];

const ROLE_COLORS: Record<UserRole, 'default' | 'primary' | 'info' | 'warning' | 'success' | 'error' | 'secondary'> = {
  super_admin: 'error',
  admin: 'warning',
  ceo: 'secondary',
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
  department: '' as string,
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

/** Only columns backed by real user fields are sortable. "Last active" is not stored. */
const USER_SORT = {
  name: (row: AdminUser) => row.name,
  email: (row: AdminUser) => row.email,
  role: (row: AdminUser) => row.usertype,
  department: (row: AdminUser) => row.department || '',
  status: (row: AdminUser) => (hasAccess(row) ? 'Can sign in' : 'Access removed'),
};

const isValidForm = (form: typeof EMPTY_FORM) =>
  form.name.trim().length > 0 &&
  /^\S+@\S+\.\S+$/.test(form.email.trim()) &&
  PHONE_PATTERN.test(form.phone.trim()) &&
  form.password.length >= 6;

const Users: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [accessFilter, setAccessFilter] = useState<'all' | 'active' | 'removed'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState<string[]>([]);
  const [passwordFor, setPasswordFor] = useState<AdminUser | null>(null);
  const [nextPassword, setNextPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [manageFor, setManageFor] = useState<AdminUser | null>(null);
  const [rowMenu, setRowMenu] = useState<{ anchor: HTMLElement; user: AdminUser } | null>(null);
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
    onError: (error: any) => {
      setConfirm(null);
      toast.error(errorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => deleteUser(id))),
    onSuccess: () => {
      toast.success('Account deleted');
      refreshUsers();
    },
    onError: (error: any) => {
      setConfirm(null);
      toast.error(errorMessage(error));
    },
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
      department?: string;
      userimage?: string;
    } = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      usertype: form.usertype,
      ...(form.department ? { department: form.department } : {}),
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
    const usertype = allowedRoles[0] ?? 'customer';
    setForm({
      ...EMPTY_FORM,
      usertype,
      department: defaultDepartmentForRole(usertype),
    });
    setShowCreatePassword(false);
    setCreateOpen(true);
  };

  const updateField = (field: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => {
      if (field === 'usertype') {
        return {
          ...prev,
          usertype: value as UserRole,
          department: defaultDepartmentForRole(value) || prev.department,
        };
      }
      return { ...prev, [field]: value };
    });

  const nameInvalid = form.name.length > 0 && form.name.trim().length === 0;
  const emailInvalid = form.email.length > 0 && !/^\S+@\S+\.\S+$/.test(form.email.trim());

  const users = data ?? EMPTY_USERS;

  const filteredUsers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return users.filter((user) => {
      if (accessFilter === 'active' && !hasAccess(user)) return false;
      if (accessFilter === 'removed' && hasAccess(user)) return false;
      if (deptFilter === 'unset' && user.department) return false;
      if (
        deptFilter !== 'all' &&
        deptFilter !== 'unset' &&
        (user.department || '') !== deptFilter
      ) {
        return false;
      }
      if (!query) return true;
      return [user.name, user.email, user.phone, user.usertype, user.department].some((value) =>
        value?.toLowerCase().includes(query),
      );
    });
  }, [users, searchText, accessFilter, deptFilter]);

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((user) => {
      const key = user.department || 'unset';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [users]);

  const { sorted: sortedUsers, order, orderBy, toggle: toggleSort } = useTableSort(filteredUsers, USER_SORT);
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / rowsPerPage));
  const visibleUsers = sortedUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    setCurrentPage(1);
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
      <PageHeader
        title="People and access"
        description="Manage seats, departments, Admin vs CRM desk login, and screen menus. Click a person or use More for the full manage panel. Passwords cannot be viewed; set a temporary one instead."
        crumbs={[{ label: 'Users' }]}
        actions={
          <>
            <Chip
              icon={<GroupOutlined />}
              label={`${users.length} total`}
              sx={{ bgcolor: tokens.goldSoft, color: tokens.goldText, fontWeight: 600 }}
            />
            <Button onClick={openCreate} startIcon={<PersonAddAlt1 />} variant="contained">
              Add user
            </Button>
          </>
        }
      />

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: tokens.shadowSoft }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            value={searchText}
            onChange={handleSearch}
            placeholder="Search name, email, phone, role or department"
            size="small"
            sx={{ width: { xs: '100%', sm: 380 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <Search fontSize="small" /> }}
          />
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="dept-filter-label">Department</InputLabel>
              <Select
                labelId="dept-filter-label"
                label="Department"
                value={deptFilter}
                onChange={(event) => {
                  setDeptFilter(String(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <MenuItem value="all">All departments</MenuItem>
                {USER_DEPARTMENTS.map((value) => (
                  <MenuItem key={value} value={value}>
                    {DEPARTMENT_LABELS[value]}
                    {deptCounts[value] ? ` (${deptCounts[value]})` : ''}
                  </MenuItem>
                ))}
                <MenuItem value="unset">
                  Unset{deptCounts.unset ? ` (${deptCounts.unset})` : ''}
                </MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="access-filter-label">Access</InputLabel>
              <Select
                labelId="access-filter-label"
                label="Access"
                value={accessFilter}
                onChange={(event) => {
                  setAccessFilter(event.target.value as 'all' | 'active' | 'removed');
                  setCurrentPage(1);
                }}
              >
                <MenuItem value="all">All access</MenuItem>
                <MenuItem value="active">Can sign in</MenuItem>
                <MenuItem value="removed">Access removed</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              {filteredUsers.length} matching users
            </Typography>
          </Stack>
        </Box>
        <Divider />
        {selected.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2, py: 1.5, bgcolor: tokens.surfaceAlt }} flexWrap="wrap" useFlexGap>
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

        {visibleUsers.length === 0 ? (
          <EmptyState
            icon={GroupOutlined}
            title="No users found"
            description="Try a different search or access filter."
          />
        ) : (
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
                  <SortableHeadCell label="Person" sortKey="name" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                  <SortableHeadCell label="Role" sortKey="role" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <SortableHeadCell label="Department / desks" sortKey="department" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <SortableHeadCell label="Sign-in" sortKey="status" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    More
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleUsers.map((user) => {
                  const isSelf = user._id === selfId;
                  const active = hasAccess(user);
                  const desks = deskChips(user);
                  return (
                    <TableRow
                      key={user._id}
                      hover
                      selected={selected.includes(user._id)}
                      onClick={() => setManageFor(user)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell
                        padding="checkbox"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Checkbox
                          size="small"
                          checked={selected.includes(user._id)}
                          disabled={isSelf}
                          onChange={() => toggleOne(user._id)}
                          inputProps={{ 'aria-label': `Select ${user.name ?? user.email ?? 'user'}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {user.name ?? '-'}
                        </Typography>
                        {isSelf && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Signed in
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block">
                          {user.email ?? '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.phone ?? '-'}</TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <Chip
                          size="small"
                          label={ROLE_LABELS[user.usertype] ?? user.usertype}
                          color={ROLE_COLORS[user.usertype] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.department
                            ? DEPARTMENT_LABELS[user.department as UserDepartment] || user.department
                            : '-'}
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                          {desks.map((label) => (
                            <Chip
                              key={label}
                              size="small"
                              label={label}
                              variant="outlined"
                              sx={{ height: 20, fontSize: 10 }}
                            />
                          ))}
                          {Array.isArray(user.menuAccess) && (
                            <Chip
                              size="small"
                              label="Custom menus"
                              sx={{ height: 20, fontSize: 10 }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={active ? 'Can sign in' : 'Blocked'}
                          color={active ? 'success' : 'default'}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                          Joined {formatDate(user.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <IconButton
                          size="small"
                          aria-label={`More actions for ${user.name || user.email}`}
                          onClick={(event) =>
                            setRowMenu({ anchor: event.currentTarget, user })
                          }
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
              error={nameInvalid}
              helperText={nameInvalid ? 'Enter a full name' : undefined}
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
              error={emailInvalid}
              helperText={emailInvalid ? 'Enter a valid email address' : undefined}
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
            <Box>
              <Typography
                component="label"
                htmlFor="create-temp-password"
                variant="body2"
                sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}
              >
                Temporary password
              </Typography>
              <TextField
                id="create-temp-password"
                type={showCreatePassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                fullWidth
                size="small"
                placeholder="At least 6 characters"
                helperText="Minimum 6 characters. Share it with the user to be changed at first login."
                error={form.password.length > 0 && form.password.length < 6}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowCreatePassword((v) => !v)}
                      >
                        {showCreatePassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  '& input': {
                    WebkitTextFillColor: 'inherit',
                    boxShadow: '0 0 0 1000px transparent inset',
                  },
                }}
              />
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel id="create-role-label">Role (seat)</InputLabel>
              <Select
                labelId="create-role-label"
                label="Role (seat)"
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
                Role sets API rights and default menus. Open Manage on the row to set desks and screens.
              </Typography>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel id="create-dept-label">Department</InputLabel>
              <Select
                labelId="create-dept-label"
                label="Department"
                value={form.department}
                onChange={(e) => updateField('department', e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {USER_DEPARTMENTS.map((value) => (
                  <MenuItem key={value} value={value}>
                    {DEPARTMENT_LABELS[value]}
                  </MenuItem>
                ))}
              </Select>
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
            sx={{ borderRadius: 1.5, bgcolor: tokens.gold, color: tokens.black, fontWeight: 600, '&:hover': { bgcolor: tokens.goldDark } }}
          >
            {createMutation.isPending ? 'Creating...' : 'Create user'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(passwordFor)}
        onClose={() => {
          setPasswordFor(null);
          setShowPassword(false);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Set password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Current password for {passwordFor?.email} cannot be shown. Set a new one and share it with them.
          </Typography>
          <Typography
            component="label"
            htmlFor="set-new-password"
            variant="body2"
            sx={{ fontWeight: 600, display: 'block', mb: 0.75, mt: 1 }}
          >
            New password
          </Typography>
          <TextField
            id="set-new-password"
            type={showPassword ? 'text' : 'password'}
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
            fullWidth
            size="small"
            placeholder="At least 6 characters"
            helperText="Minimum 6 characters"
            error={nextPassword.length > 0 && nextPassword.length < 6}
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    size="small"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
              '& input': {
                WebkitTextFillColor: 'inherit',
                boxShadow: '0 0 0 1000px transparent inset',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setPasswordFor(null);
              setShowPassword(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={nextPassword.length < 6 || passwordMutation.isPending || !passwordFor}
            onClick={() => passwordFor && passwordMutation.mutate({ userId: passwordFor._id, password: nextPassword })}
            sx={{ bgcolor: tokens.gold, color: tokens.black, '&:hover': { bgcolor: tokens.goldDark } }}
          >
            {passwordMutation.isPending ? 'Saving...' : 'Save password'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.kind === 'delete' ? 'Delete accounts' : confirm?.kind === 'restore' ? 'Restore access' : 'Remove access'}
        description={confirm?.kind === 'delete'
          ? `${confirm?.ids.length ?? 0} account${confirm?.ids.length === 1 ? '' : 's'} will be deleted. This cannot be undone.`
          : confirm?.kind === 'restore'
            ? `${confirm?.ids.length ?? 0} ${confirm?.ids.length === 1 ? 'person' : 'people'} will be able to sign in with their email address and password.`
            : `${confirm?.ids.length ?? 0} ${confirm?.ids.length === 1 ? 'person' : 'people'} will stay on file, but their email address and password will stop working.`}
        confirmLabel={confirm?.kind === 'delete' ? 'Delete' : 'Confirm'}
        tone={confirm?.kind === 'delete' ? 'danger' : 'primary'}
        loading={busy}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
      />

      <Menu
        anchorEl={rowMenu?.anchor ?? null}
        open={Boolean(rowMenu)}
        onClose={() => setRowMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (rowMenu) setManageFor(rowMenu.user);
            setRowMenu(null);
          }}
        >
          <ListItemIcon>
            <Tune fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage access</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={rowMenu?.user._id === selfId}
          onClick={() => {
            if (!rowMenu) return;
            setPasswordFor(rowMenu.user);
            setNextPassword('');
            setShowPassword(false);
            setRowMenu(null);
          }}
        >
          <ListItemIcon>
            <LockReset fontSize="small" />
          </ListItemIcon>
          <ListItemText>Set password</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={rowMenu?.user._id === selfId || busy}
          onClick={() => {
            if (!rowMenu) return;
            const active = hasAccess(rowMenu.user);
            setConfirm({ kind: active ? 'remove' : 'restore', ids: [rowMenu.user._id] });
            setRowMenu(null);
          }}
        >
          <ListItemIcon>
            <PersonOff fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {rowMenu && hasAccess(rowMenu.user) ? 'Remove sign-in' : 'Restore sign-in'}
          </ListItemText>
        </MenuItem>
        <MenuItem
          disabled={rowMenu?.user._id === selfId || busy}
          onClick={() => {
            if (!rowMenu) return;
            setConfirm({ kind: 'delete', ids: [rowMenu.user._id] });
            setRowMenu(null);
          }}
        >
          <ListItemIcon>
            <DeleteOutline fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete account</ListItemText>
        </MenuItem>
      </Menu>

      <UserManageModal
        open={Boolean(manageFor)}
        user={manageFor}
        actorRole={actorRole}
        isSelf={Boolean(manageFor && manageFor._id === selfId)}
        onClose={() => setManageFor(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
        onRequestDelete={(user) => setConfirm({ kind: 'delete', ids: [user._id] })}
      />
    </Box>
  );
};

export default Users;

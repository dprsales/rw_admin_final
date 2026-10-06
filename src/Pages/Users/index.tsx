import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
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
import { GroupOutlined, PersonAddAlt1, Search } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { changeUserRole, createUser, getUsers } from '../../api/services';
import { USER_ROLES, roleSatisfies, type UserRole } from '../../utils/roles';

export interface AdminUser {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  usertype: UserRole;
  createdAt?: string;
}

const rowsPerPage = 12;
const EMPTY_USERS: AdminUser[] = [];

const ROLE_COLORS: Record<UserRole, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  super_admin: 'error',
  admin: 'warning',
  hr: 'info',
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
  const queryClient = useQueryClient();

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
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Every account on the platform and the role it currently holds.
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

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Change role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      No users match that search.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visibleUsers.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.name ?? '-'}</TableCell>
                    <TableCell>{user.email ?? '-'}</TableCell>
                    <TableCell>{user.phone ?? '-'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={user.usertype} color={ROLE_COLORS[user.usertype] ?? 'default'} />
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={
                          allowedRoles.includes('super_admin')
                            ? 'Applies on the user’s next request — no re-login needed'
                            : 'Only a super admin can grant super admin'
                        }
                      >
                        <span>
                          <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel id={`role-label-${user._id}`}>Role</InputLabel>
                            <Select
                              labelId={`role-label-${user._id}`}
                              label="Role"
                              value={user.usertype}
                              disabled={roleMutation.isPending}
                              onChange={(event) => handleRoleChange(user, event.target.value as UserRole)}
                              sx={{ borderRadius: 2 }}
                            >
                              {allowedRoles.map((role) => (
                                <MenuItem key={role} value={role}>
                                  {role}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                ))
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
                sx={{ borderRadius: 2 }}
              >
                {allowedRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Super admin can only be granted later by an existing super admin.
              </Typography>            </FormControl>
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
    </Box>
  );
};

export default Users;

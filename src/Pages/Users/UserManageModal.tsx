import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  resetUserPassword,
  setUserAccess,
  updateUserAccessProfile,
} from '../../api/services';
import {
  ADMIN_MENU_ROUTES,
  CRM_MENU_ROUTES,
  DEPARTMENT_LABELS,
  ROLE_LABELS,
  STAFF_MENU_LABELS,
  STAFF_MENU_ROUTES,
  USER_DEPARTMENTS,
  USER_ROLES,
  defaultDepartmentForRole,
  defaultDeskAccessForRole,
  roleDefaultRoutes,
  roleSatisfies,
  type DeskAccess,
  type UserDepartment,
  type UserRole,
} from '../../utils/roles';
import { tokens } from '../../Theme/tokens';

const ADMIN_ROUTES_LIST = [...ADMIN_MENU_ROUTES];
const CRM_ROUTES_LIST = [...CRM_MENU_ROUTES];

export type ManageUser = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  usertype: UserRole;
  department?: string | null;
  menuAccess?: string[] | null;
  deskAccess?: string[] | null;
  accessEnabled?: boolean;
};

type UserManageModalProps = {
  open: boolean;
  user: ManageUser | null;
  actorRole: string | undefined;
  isSelf: boolean;
  onClose: () => void;
  onSaved: () => void;
  onRequestDelete: (user: ManageUser) => void;
};

const assignableRoles = (actorRole: unknown): UserRole[] =>
  USER_ROLES.filter(
    (role) => role !== 'super_admin' || roleSatisfies(actorRole, 'super_admin'),
  );

const UserManageModal: React.FC<UserManageModalProps> = ({
  open,
  user,
  actorRole,
  isSelf,
  onClose,
  onSaved,
  onRequestDelete,
}) => {
  const allowedRoles = useMemo(() => assignableRoles(actorRole), [actorRole]);

  const [usertype, setUsertype] = useState<UserRole>('customer');
  const [department, setDepartment] = useState('');
  const [desks, setDesks] = useState<DeskAccess[]>([]);
  const [useCustomMenus, setUseCustomMenus] = useState(false);
  const [menus, setMenus] = useState<string[]>([]);
  const [nextPassword, setNextPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const roleDefaults = useMemo(() => roleDefaultRoutes(usertype), [usertype]);

  useEffect(() => {
    if (!open || !user) return;
    setUsertype(user.usertype);
    setDepartment(user.department || defaultDepartmentForRole(user.usertype) || '');
    const hasCustom = Array.isArray(user.menuAccess);
    setUseCustomMenus(hasCustom);
    setMenus(hasCustom ? [...user.menuAccess!] : [...(roleDefaultRoutes(user.usertype) ?? [])]);
    setDesks(
      Array.isArray(user.deskAccess) && user.deskAccess.length
        ? (user.deskAccess.filter((d) => d === 'admin' || d === 'crm') as DeskAccess[])
        : defaultDeskAccessForRole(user.usertype),
    );
    setNextPassword('');
    setShowPassword(false);
  }, [open, user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');
      if (!desks.length) throw new Error('Pick at least one desk');
      return updateUserAccessProfile(user._id, {
        usertype: usertype !== user.usertype ? usertype : undefined,
        department: department || undefined,
        deskAccess: desks,
        ...(useCustomMenus
          ? { menuAccess: menus }
          : { useRoleDefaults: true }),
      });
    },
    onSuccess: (response: any) => {
      toast.success(response?.data?.message ?? 'User access saved');
      onSaved();
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error?.message ||
          error?.response?.data?.message ||
          'Could not save access',
      );
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => {
      if (!user) return Promise.reject(new Error('No user'));
      return resetUserPassword(user._id, nextPassword);
    },
    onSuccess: (response: any) => {
      toast.success(response?.data?.message ?? 'Password updated');
      setNextPassword('');
      onSaved();
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? 'Could not set password'),
  });

  const signInMutation = useMutation({
    mutationFn: (enabled: boolean) => {
      if (!user) return Promise.reject(new Error('No user'));
      return setUserAccess(user._id, enabled);
    },
    onSuccess: (_r, enabled) => {
      toast.success(enabled ? 'Sign-in restored' : 'Sign-in removed');
      onSaved();
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? 'Could not update sign-in'),
  });

  const toggleDesk = (desk: DeskAccess) => {
    setDesks((current) =>
      current.includes(desk)
        ? current.filter((d) => d !== desk)
        : [...current, desk],
    );
  };

  const toggleMenu = (route: string) => {
    setMenus((current) =>
      current.includes(route)
        ? current.filter((r) => r !== route)
        : [...current, route],
    );
  };

  const setGroupMenus = (group: string[], selected: boolean) => {
    setMenus((current) => {
      const without = current.filter((r) => !group.includes(r));
      return selected ? [...without, ...group] : without;
    });
  };

  const loadRoleDefaultsForGroup = (group: string[]) => {
    const defaults = roleDefaultRoutes(usertype) ?? [...STAFF_MENU_ROUTES];
    const fromRole = group.filter((r) => defaults.includes(r));
    setMenus((current) => {
      const without = current.filter((r) => !group.includes(r));
      return [...without, ...fromRole];
    });
  };

  const renderMenuGroup = (title: string, blurb: string, group: string[]) => {
    const selectedCount = group.filter((r) => menus.includes(r)).length;
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          border: `1px solid ${tokens.border}`,
          bgcolor: tokens.surfaceAlt,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {blurb}
              {` · ${selectedCount}/${group.length} selected`}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Button size="small" onClick={() => loadRoleDefaultsForGroup(group)}>
              Role defaults
            </Button>
            <Button size="small" onClick={() => setGroupMenus(group, true)}>
              All
            </Button>
            <Button size="small" onClick={() => setGroupMenus(group, false)}>
              None
            </Button>
          </Stack>
        </Stack>
        <Grid container spacing={0.5}>
          {group.map((route) => (
            <Grid item xs={12} sm={6} md={4} key={route}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={menus.includes(route)}
                    onChange={() => toggleMenu(route)}
                  />
                }
                label={
                  <Typography variant="body2">
                    {STAFF_MENU_LABELS[route] || route}
                  </Typography>
                }
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  if (!user) return null;
  const active = user.accessEnabled !== false;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Manage person</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              {user.name || user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
              {user.phone ? ` · ${user.phone}` : ''}
            </Typography>
          </Box>

          <Alert severity="info" sx={{ py: 0.75 }}>
            Passwords are stored hashed and cannot be shown. Set a new temporary
            password below and share it with them securely.
          </Alert>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Seat and department
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth disabled={isSelf}>
                  <InputLabel id="manage-role">Role (seat)</InputLabel>
                  <Select
                    labelId="manage-role"
                    label="Role (seat)"
                    value={usertype}
                    onChange={(e) => {
                      const next = e.target.value as UserRole;
                      setUsertype(next);
                      setDepartment(defaultDepartmentForRole(next) || department);
                      if (!useCustomMenus) {
                        setMenus([...(roleDefaultRoutes(next) ?? [])]);
                      }
                      setDesks(defaultDeskAccessForRole(next));
                    }}
                  >
                    {allowedRoles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="manage-dept">Department</InputLabel>
                  <Select
                    labelId="manage-dept"
                    label="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {USER_DEPARTMENTS.map((value) => (
                      <MenuItem key={value} value={value}>
                        {DEPARTMENT_LABELS[value as UserDepartment]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Desk login
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Choose Admin, Sales CRM, or both. Controls which login desk they may open.
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={desks.includes('admin')}
                    onChange={() => toggleDesk('admin')}
                  />
                }
                label="Admin panel"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={desks.includes('crm')}
                    onChange={() => toggleDesk('crm')}
                  />
                }
                label="Sales CRM"
              />
            </Stack>
            {!desks.length && (
              <Typography variant="caption" color="error">
                Pick at least one desk.
              </Typography>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Screen menus
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Role sets the starting list. Turn on custom to pick Admin and CRM screens
              separately. Desk login above still controls which login they may open.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={useCustomMenus}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setUseCustomMenus(on);
                    if (!on) {
                      setMenus(
                        roleDefaults === null
                          ? [...STAFF_MENU_ROUTES]
                          : [...roleDefaults],
                      );
                    }
                  }}
                />
              }
              label="Customise screens (override role defaults)"
            />
            {!useCustomMenus ? (
              <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
                Role defaults for {ROLE_LABELS[usertype]}
                {roleDefaults === null
                  ? ': all screens'
                  : roleDefaults.length
                    ? `: ${roleDefaults.map((r) => STAFF_MENU_LABELS[r] || r).join(', ')}`
                    : ' (no staff menus)'}
              </Alert>
            ) : (
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setMenus(
                        roleDefaults === null
                          ? [...STAFF_MENU_ROUTES]
                          : [...roleDefaults],
                      )
                    }
                  >
                    Load full role defaults
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setMenus([...STAFF_MENU_ROUTES])}
                  >
                    Select every screen
                  </Button>
                  <Button size="small" onClick={() => setMenus([])}>
                    Clear all
                  </Button>
                </Stack>
                {renderMenuGroup(
                  'Admin panel',
                  'Office screens in the admin app',
                  ADMIN_ROUTES_LIST,
                )}
                {renderMenuGroup(
                  'Sales CRM',
                  'CRM desk entry (inner CRM pages follow their CRM seat for now)',
                  CRM_ROUTES_LIST,
                )}
                {!desks.includes('admin') &&
                  menus.some((r) => (ADMIN_ROUTES_LIST as string[]).includes(r)) && (
                    <Alert severity="warning" sx={{ py: 0.5 }}>
                      Admin screens are ticked, but Admin desk login is off above. They
                      will not reach those screens until Admin desk is enabled.
                    </Alert>
                  )}
                {!desks.includes('crm') && menus.includes('/crm') && (
                  <Alert severity="warning" sx={{ py: 0.5 }}>
                    Sales CRM is ticked, but CRM desk login is off above. Enable Sales
                    CRM under Desk login to let them open it.
                  </Alert>
                )}
              </Stack>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Set temporary password
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Current password cannot be shown (stored hashed). Type a new one below and share it with them.
            </Typography>
            <Typography
              component="label"
              htmlFor="manage-new-password"
              variant="body2"
              sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}
            >
              New password
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
              <TextField
                id="manage-new-password"
                size="small"
                type={showPassword ? 'text' : 'password'}
                value={nextPassword}
                onChange={(e) => setNextPassword(e.target.value)}
                placeholder="At least 6 characters"
                helperText="Minimum 6 characters. Share it with them directly."
                error={nextPassword.length > 0 && nextPassword.length < 6}
                disabled={isSelf}
                fullWidth
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                        disabled={isSelf}
                      >
                        {showPassword ? (
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
              <Button
                variant="outlined"
                disabled={isSelf || nextPassword.length < 6 || passwordMutation.isPending}
                onClick={() => passwordMutation.mutate()}
                sx={{ whiteSpace: 'nowrap', mt: { sm: 0.25 } }}
              >
                {passwordMutation.isPending ? 'Saving…' : 'Save password'}
              </Button>
            </Stack>
          </Box>

          <Divider />

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              disabled={isSelf || signInMutation.isPending}
              onClick={() => signInMutation.mutate(!active)}
            >
              {active ? 'Remove sign-in' : 'Restore sign-in'}
            </Button>
            <Button
              size="small"
              color="error"
              disabled={isSelf}
              onClick={() => {
                onClose();
                onRequestDelete(user);
              }}
            >
              Delete account
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saveMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => saveMutation.mutate()}
          disabled={
            saveMutation.isPending ||
            !desks.length ||
            (useCustomMenus && menus.length === 0)
          }
          sx={{
            bgcolor: tokens.gold,
            color: tokens.black,
            '&:hover': { bgcolor: tokens.goldDark },
          }}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserManageModal;

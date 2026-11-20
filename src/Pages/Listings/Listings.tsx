import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  ClickAwayListener,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grow,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import {
  CheckCircleOutline,
  DeleteOutline,
  HighlightOff,
  MailOutline,
  MoreVert,
  Search,
  VisibilityOutlined,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  approveAdminListing,
  bulkApproveAdminListings,
  bulkDeleteAdminListings,
  bulkDeleteAdminListingUsers,
  bulkRejectAdminListings,
  createAdminListingUser,
  deleteAdminListing,
  deleteAdminListingUser,
  getAdminListings,
  getAdminListingUsers,
  rejectAdminListing,
  resetAdminListingUserPassword,
  updateAdminListingUser,
} from '../../api/services'
import PageHeader from '../../Components/PageHeader'
import EmptyState from '../../Components/EmptyState'
import ConfirmDialog from '../../Components/ConfirmDialog'
import { TableSkeleton } from '../../Components/LoadingState'
import { tokens } from '../../Theme/tokens'

type ListingStatus = 'pending' | 'approved' | 'rejected'

interface AdminListing {
  _id: string
  title?: string
  city?: string
  locality?: string
  listingType?: string
  bhk?: string
  status: ListingStatus
  priceValue?: number
  coverImage?: string
  email?: string
  mobile?: string
  ownerName?: string
  slug?: string
  views?: number
  enquiryCount?: number
  commissionAccepted?: boolean
  commissionAcceptedAt?: string
  commissionTermsText?: string
  listingConsentsText?: string[]
  listingConsentsAcceptedAt?: string
  details?: { oneLineDescription?: string; description?: string; images?: string[] }
  createdAt?: string
  approvedAt?: string
  rejectionReason?: string
  enquiries?: { _id: string; name: string; email: string; phone?: string; message?: string; createdAt?: string }[]
}

interface ListingUserRow {
  id: string
  email: string
  name?: string
  mobile?: string
  city?: string
  listingCount?: number
  createdAt?: string
  lastLoginAt?: string
}

const STATUS_COLOR: Record<ListingStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

const formatPrice = (value?: number) => {
  if (!value || value <= 0) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function Listings() {
  const [tab, setTab] = useState(0)
  const { data: listingRows } = useQuery<AdminListing[]>({
    queryKey: ['admin-listings'],
    queryFn: () => getAdminListings(),
  })
  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <PageHeader
        title="Listings"
        description="Review owner and builder listings from the public site. Approve goes live. Delete removes media from CDN."
        crumbs={[{ label: 'Listings' }]}
        actions={
          <Chip
            label={`${listingRows?.length ?? 0} listings`}
            sx={{ bgcolor: tokens.goldSoft, color: tokens.goldText, fontWeight: 600 }}
          />
        }
      />
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Properties" />
        <Tab label="Listing accounts" />
      </Tabs>
      {tab === 0 ? <PropertiesPanel /> : <ListingUsersPanel />}
    </Box>
  )
}

function PropertiesPanel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | ListingStatus>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [rejectTarget, setRejectTarget] = useState<{ ids: string[] } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionMenu, setActionMenu] = useState<{ id: string; anchor: HTMLElement } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string } | null>(null)
  const [pendingBulkDelete, setPendingBulkDelete] = useState<string[] | null>(null)

  const { data, isPending, error } = useQuery<AdminListing[]>({
    queryKey: ['admin-listings'],
    queryFn: () => getAdminListings(),
  })

  const actionRow = useMemo(
    () => (data || []).find((row) => row._id === actionMenu?.id) || null,
    [data, actionMenu?.id],
  )

  const closeActionMenu = () => setActionMenu(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
  }

  const approveOne = useMutation({
    mutationFn: (id: string) => approveAdminListing(id),
    onSuccess: () => { toast.success('Listing approved and live'); invalidate() },
    onError: () => toast.error('Could not approve listing'),
  })

  const rejectOne = useMutation({
    mutationFn: ({ ids, reason }: { ids: string[]; reason?: string }) =>
      ids.length === 1 ? rejectAdminListing(ids[0], reason) : bulkRejectAdminListings(ids, reason),
    onSuccess: () => {
      toast.success('Listing rejected')
      setRejectTarget(null)
      setRejectReason('')
      setSelected([])
      invalidate()
    },
    onError: () => toast.error('Could not reject listing'),
  })

  const deleteOne = useMutation({
    mutationFn: (id: string) => deleteAdminListing(id),
    onSuccess: () => {
      toast.success('Listing deleted')
      invalidate()
    },
    onError: () => toast.error('Could not delete listing'),
  })

  const bulkApprove = useMutation({
    mutationFn: (ids: string[]) => bulkApproveAdminListings(ids),
    onSuccess: (res) => {
      toast.success(`Approved ${res?.updated ?? selected.length}`)
      setSelected([])
      invalidate()
    },
    onError: () => toast.error('Bulk approve failed'),
  })

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteAdminListings(ids),
    onSuccess: (res) => {
      toast.success(`Deleted ${res?.deleted ?? selected.length}`)
      setSelected([])
      invalidate()
    },
    onError: () => toast.error('Bulk delete failed'),
  })

  const rows = data || []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false
      if (!q) return true
      return [row.title, row.city, row.locality, row.email, row.ownerName, row.listingType, row.bhk]
        .some((v) => String(v || '').toLowerCase().includes(q))
    })
  }, [rows, search, status])

  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selected.includes(r._id))
  const toggleAll = () => {
    if (allVisibleSelected) setSelected((cur) => cur.filter((id) => !filtered.some((r) => r._id === id)))
    else setSelected((cur) => [...new Set([...cur, ...filtered.map((r) => r._id)])])
  }

  if (isPending) {
    return (
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableSkeleton rows={8} columns={8} />
      </Paper>
    )
  }
  if (error) {
    return (
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography color="error">Unable to load listings. Is the local API running on port 8088?</Typography>
      </Paper>
    )
  }

  return (
    <>
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: `0 8px 30px ${tokens.goldSoft}` }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, city, owner, email"
            size="small"
            sx={{ width: { xs: '100%', sm: 360 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((value) => (
              <Chip
                key={value}
                label={value === 'all' ? 'All' : value}
                onClick={() => setStatus(value)}
                color={status === value ? 'primary' : 'default'}
                variant={status === value ? 'filled' : 'outlined'}
                sx={{ textTransform: 'capitalize' }}
              />
            ))}
            <Chip label={`${rows.length} total`} sx={{ bgcolor: tokens.goldSoft, color: tokens.goldText, fontWeight: 600 }} />
          </Stack>
        </Box>

        {selected.length > 0 && (
          <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`${selected.length} selected`} color="primary" variant="outlined" />
            <Button size="small" variant="contained" color="success" disabled={bulkApprove.isPending}
              onClick={() => bulkApprove.mutate(selected)}>Approve</Button>
            <Button size="small" variant="outlined" color="warning"
              onClick={() => { setRejectReason(''); setRejectTarget({ ids: selected }) }}>Reject</Button>
            <Button size="small" variant="contained" color="error" disabled={bulkDelete.isPending}
              onClick={() => setPendingBulkDelete(selected)}>Delete</Button>
            <Button size="small" onClick={() => setSelected([])}>Clear</Button>
          </Box>
        )}

        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allVisibleSelected}
                    indeterminate={selected.length > 0 && !allVisibleSelected}
                    onChange={toggleAll}
                    inputProps={{ 'aria-label': 'Select all visible listings' }}
                  />
                </TableCell>
                <TableCell>Property</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      title="No listings yet"
                      description={search.trim() || status !== 'all'
                        ? 'Try another search or status filter.'
                        : 'Submitted properties from the website appear here for review.'}
                    />
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((row) => (
                <TableRow key={row._id} hover selected={selected.includes(row._id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(row._id)}
                      onChange={() => setSelected((cur) =>
                        cur.includes(row._id) ? cur.filter((id) => id !== row._id) : [...cur, row._id],
                      )}
                      inputProps={{ 'aria-label': `Select ${row.title || row._id}` }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        component="img"
                        src={row.coverImage || ''}
                        alt=""
                        sx={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 1, bgcolor: tokens.panelAlt, display: row.coverImage ? 'block' : 'none' }}
                      />
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, maxWidth: 260, cursor: 'pointer', color: tokens.goldText }}
                          noWrap
                          onClick={() => navigate(`/listings/${row._id}`)}
                        >
                          {row.details?.oneLineDescription || row.title || 'Untitled'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[row.locality, row.city].filter(Boolean).join(', ')}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.ownerName || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.listingType || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.bhk || ''}</Typography>
                  </TableCell>
                  <TableCell>{formatPrice(row.priceValue)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={row.status} color={STATUS_COLOR[row.status]} sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                      <VisibilityOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption">{row.views || 0}</Typography>
                      <MailOutline sx={{ fontSize: 14, color: 'text.secondary', ml: 0.5 }} />
                      <Typography variant="caption">{row.enquiryCount || 0}</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{formatDate(row.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      aria-label="Listing actions"
                      aria-haspopup="menu"
                      aria-expanded={actionMenu?.id === row._id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setActionMenu((cur) =>
                          cur?.id === row._id ? null : { id: row._id, anchor: e.currentTarget },
                        )
                      }}
                      sx={{ minWidth: 40, minHeight: 40 }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Popper
        open={Boolean(actionMenu)}
        anchorEl={actionMenu?.anchor || null}
        placement="bottom-end"
        transition
        disablePortal={false}
        style={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'right top' }}>
            <Paper
              elevation={4}
              sx={{
                mt: 0.5,
                minWidth: 180,
                borderRadius: 2,
                bgcolor: tokens.glass,
                backdropFilter: tokens.glassBlur,
                WebkitBackdropFilter: tokens.glassBlur,
                border: '1px solid',
                borderColor: tokens.border,
                overflow: 'hidden',
              }}
            >
              <ClickAwayListener onClickAway={closeActionMenu}>
                <MenuList dense autoFocusItem={Boolean(actionMenu)} sx={{ py: 0.5 }}>
                  <MenuItem
                    onClick={() => {
                      if (!actionRow) return
                      closeActionMenu()
                      navigate(`/listings/${actionRow._id}`)
                    }}
                  >
                    <ListItemIcon><VisibilityOutlined fontSize="small" /></ListItemIcon>
                    <ListItemText>View details</ListItemText>
                  </MenuItem>
                  {actionRow && actionRow.status !== 'approved' && (
                    <MenuItem
                      onClick={() => {
                        closeActionMenu()
                        approveOne.mutate(actionRow._id)
                      }}
                      disabled={approveOne.isPending}
                    >
                      <ListItemIcon><CheckCircleOutline fontSize="small" color="success" /></ListItemIcon>
                      <ListItemText>Approve</ListItemText>
                    </MenuItem>
                  )}
                  {actionRow && actionRow.status !== 'rejected' && (
                    <MenuItem
                      onClick={() => {
                        closeActionMenu()
                        setRejectReason('')
                        setRejectTarget({ ids: [actionRow._id] })
                      }}
                    >
                      <ListItemIcon><HighlightOff fontSize="small" color="warning" /></ListItemIcon>
                      <ListItemText>Reject</ListItemText>
                    </MenuItem>
                  )}
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem
                    onClick={() => {
                      if (!actionRow) return
                      closeActionMenu()
                      setPendingDelete({ id: actionRow._id })
                    }}
                    disabled={deleteOne.isPending}
                    sx={{ color: 'error.main' }}
                  >
                    <ListItemIcon><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>

      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject listing{rejectTarget && rejectTarget.ids.length > 1 ? 's' : ''}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Reason (emailed to the owner)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button
            color="warning"
            variant="contained"
            disabled={rejectOne.isPending || !rejectTarget}
            onClick={() => rejectTarget && rejectOne.mutate({ ids: rejectTarget.ids, reason: rejectReason.trim() || undefined })}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete listing?"
        description="Delete this listing and its photos/videos from CDN permanently?"
        confirmLabel="Delete"
        tone="danger"
        loading={deleteOne.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteOne.mutate(pendingDelete.id)
          setPendingDelete(null)
        }}
        onClose={() => setPendingDelete(null)}
      />
      <ConfirmDialog
        open={pendingBulkDelete !== null}
        title="Delete listings?"
        description={`Delete ${pendingBulkDelete?.length ?? 0} listing(s)? Photos and enquiries for those listings are removed.`}
        confirmLabel="Delete"
        tone="danger"
        loading={bulkDelete.isPending}
        onConfirm={() => {
          if (!pendingBulkDelete) return
          bulkDelete.mutate(pendingBulkDelete)
          setPendingBulkDelete(null)
        }}
        onClose={() => setPendingBulkDelete(null)}
      />
    </>
  )
}

function ListingUsersPanel() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', mobile: '', city: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ email: '', name: '', mobile: '', city: '' })
  const [passwordId, setPasswordId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [pendingDelete, setPendingDelete] = useState<{ id: string } | null>(null)
  const [pendingBulkDelete, setPendingBulkDelete] = useState<string[] | null>(null)

  const { data, isPending, error } = useQuery<ListingUserRow[]>({
    queryKey: ['admin-listing-users'],
    queryFn: getAdminListingUsers,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-listing-users'] })

  const createMut = useMutation({
    mutationFn: () => createAdminListingUser(form),
    onSuccess: () => {
      toast.success('Listing account created')
      setCreateOpen(false)
      setForm({ email: '', password: '', name: '', mobile: '', city: '' })
      invalidate()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not create account'),
  })

  const updateMut = useMutation({
    mutationFn: () => updateAdminListingUser(editId!, editForm),
    onSuccess: () => {
      toast.success('Account updated')
      setEditId(null)
      invalidate()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not update account'),
  })

  const passwordMut = useMutation({
    mutationFn: () => resetAdminListingUserPassword(passwordId!, password),
    onSuccess: () => {
      toast.success('Password updated')
      setPasswordId(null)
      setPassword('')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not reset password'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminListingUser(id),
    onSuccess: () => {
      toast.success('Account and its listings deleted')
      invalidate()
    },
    onError: () => toast.error('Could not delete account'),
  })

  const bulkDeleteMut = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteAdminListingUsers(ids),
    onSuccess: (res) => {
      toast.success(`Deleted ${res?.deleted ?? selected.length}`)
      setSelected([])
      invalidate()
    },
    onError: () => toast.error('Bulk delete failed'),
  })

  const rows = data || []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => [row.email, row.name, row.mobile, row.city].some((v) => String(v || '').toLowerCase().includes(q)))
  }, [rows, search])

  if (isPending) {
    return (
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableSkeleton rows={8} columns={6} />
      </Paper>
    )
  }
  if (error) {
    return <Paper sx={{ p: 4, borderRadius: 3 }}><Typography color="error">Unable to load listing accounts.</Typography></Paper>
  }

  return (
    <>
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: `0 8px 30px ${tokens.goldSoft}` }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, name, mobile, city"
            size="small"
            sx={{ width: { xs: '100%', sm: 360 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <Stack direction="row" spacing={1}>
            {selected.length > 0 && (
              <Button color="error" variant="outlined" size="small"
                onClick={() => setPendingBulkDelete(selected)}>
                Delete selected ({selected.length})
              </Button>
            )}
            <Button variant="contained" onClick={() => setCreateOpen(true)}>Add account</Button>
          </Stack>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Account</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Listings</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      title="No listing accounts"
                      description={search.trim() ? 'Try another search.' : 'Add an account to give owners access to their listings.'}
                    />
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(row.id)}
                      onChange={() => setSelected((cur) =>
                        cur.includes(row.id) ? cur.filter((id) => id !== row.id) : [...cur, row.id],
                      )}
                      inputProps={{ 'aria-label': `Select ${row.name || row.email} account` }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.mobile || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.city || ''}</Typography>
                  </TableCell>
                  <TableCell>{row.listingCount ?? 0}</TableCell>
                  <TableCell>{formatDate(row.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => {
                      setEditId(row.id)
                      setEditForm({ email: row.email, name: row.name || '', mobile: row.mobile || '', city: row.city || '' })
                    }}>Edit</Button>
                    <Button size="small" onClick={() => { setPasswordId(row.id); setPassword('') }}>Password</Button>
                    <IconButton
                      size="small"
                      color="error"
                      aria-label={`Delete ${row.name || row.email} account`}
                      onClick={() => setPendingDelete({ id: row.id })}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add listing account</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <TextField label="Password" type="password" required helperText="At least 8 characters" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            <TextField label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <TextField label="Mobile" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
            <TextField label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={createMut.isPending || !form.email || form.password.length < 8} onClick={() => createMut.mutate()}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editId} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit listing account</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
            <TextField label="Name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            <TextField label="Mobile" value={editForm.mobile} onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
            <TextField label="City" value={editForm.city} onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" disabled={updateMut.isPending} onClick={() => updateMut.mutate()}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!passwordId} onClose={() => setPasswordId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="New password"
            helperText="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordId(null)}>Cancel</Button>
          <Button variant="contained" disabled={passwordMut.isPending || password.length < 8} onClick={() => passwordMut.mutate()}>Update</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete listing account?"
        description="Delete this listing account and every property it owns?"
        confirmLabel="Delete"
        tone="danger"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteMut.mutate(pendingDelete.id)
          setPendingDelete(null)
        }}
        onClose={() => setPendingDelete(null)}
      />
      <ConfirmDialog
        open={pendingBulkDelete !== null}
        title="Delete listing accounts?"
        description={`Delete ${pendingBulkDelete?.length ?? 0} account(s) and all their listings?`}
        confirmLabel="Delete"
        tone="danger"
        loading={bulkDeleteMut.isPending}
        onConfirm={() => {
          if (!pendingBulkDelete) return
          bulkDeleteMut.mutate(pendingBulkDelete)
          setPendingBulkDelete(null)
        }}
        onClose={() => setPendingBulkDelete(null)}
      />
    </>
  )
}

import React, { useMemo, useState } from 'react'
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
  IconButton,
  InputAdornment,
  Link,
  Paper,
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
  OpenInNew,
  Search,
  VisibilityOutlined,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  getAdminListing,
  getAdminListings,
  getAdminListingUsers,
  rejectAdminListing,
  resetAdminListingUserPassword,
  updateAdminListingUser,
} from '../../api/services'

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
  if (!value || value <= 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function Listings() {
  const [tab, setTab] = useState(0)
  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Listings</Typography>
        <Typography variant="body2" color="text.secondary">
          Review owner and builder listings from the public site. Approve goes live. Delete removes media from CDN.
        </Typography>
      </Box>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Properties" />
        <Tab label="Listing accounts" />
      </Tabs>
      {tab === 0 ? <PropertiesPanel /> : <ListingUsersPanel />}
    </Box>
  )
}

function PropertiesPanel() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | ListingStatus>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [viewId, setViewId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ ids: string[] } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isPending, error } = useQuery<AdminListing[]>({
    queryKey: ['admin-listings'],
    queryFn: () => getAdminListings(),
  })

  const { data: detail, isFetching: detailLoading } = useQuery<AdminListing>({
    queryKey: ['admin-listing', viewId],
    queryFn: () => getAdminListing(viewId!),
    enabled: !!viewId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
    if (viewId) queryClient.invalidateQueries({ queryKey: ['admin-listing', viewId] })
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
      setViewId(null)
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
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>
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
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 99, 165, 0.08)' }}>
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
            <Chip label={`${rows.length} total`} sx={{ bgcolor: '#e7f1f7', color: '#0f63a5', fontWeight: 600 }} />
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
              onClick={() => {
                if (window.confirm(`Delete ${selected.length} listing(s)? Photos and enquiries for those listings are removed.`)) {
                  bulkDelete.mutate(selected)
                }
              }}>Delete</Button>
            <Button size="small" onClick={() => setSelected([])}>Clear</Button>
          </Box>
        )}

        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox checked={allVisibleSelected} indeterminate={selected.length > 0 && !allVisibleSelected} onChange={toggleAll} />
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
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6">No listings yet</Typography>
                    <Typography variant="body2" color="text.secondary">Submitted properties from the website appear here for review.</Typography>
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
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        component="img"
                        src={row.coverImage || ''}
                        alt=""
                        sx={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 1, bgcolor: '#eee', display: row.coverImage ? 'block' : 'none' }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 260 }} noWrap>
                          {row.details?.oneLineDescription || row.title || 'Untitled'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[row.locality, row.city].filter(Boolean).join(', ')}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.ownerName || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.listingType || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.bhk || ''}</Typography>
                  </TableCell>
                  <TableCell>{formatPrice(row.priceValue)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={row.status} color={STATUS_COLOR[row.status]} sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block">👁 {row.views || 0} · ✉️ {row.enquiryCount || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDate(row.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setViewId(row._id)} title="View"><VisibilityOutlined fontSize="small" /></IconButton>
                    {row.status !== 'approved' && (
                      <IconButton size="small" color="success" onClick={() => approveOne.mutate(row._id)} title="Approve">
                        <CheckCircleOutline fontSize="small" />
                      </IconButton>
                    )}
                    {row.status !== 'rejected' && (
                      <Button size="small" color="warning" onClick={() => { setRejectReason(''); setRejectTarget({ ids: [row._id] }) }}>
                        Reject
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      title="Delete"
                      onClick={() => {
                        if (window.confirm('Delete this listing and its photos/videos from CDN permanently?')) deleteOne.mutate(row._id)
                      }}
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

      <Dialog open={!!viewId} onClose={() => setViewId(null)} maxWidth="md" fullWidth>
        <DialogTitle>Listing detail</DialogTitle>
        <DialogContent dividers>
          {detailLoading && !detail ? (
            <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
          ) : detail ? (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {detail.coverImage && (
                  <Box component="img" src={detail.coverImage} alt="" sx={{ width: { xs: '100%', sm: 220 }, height: 160, objectFit: 'cover', borderRadius: 2 }} />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{detail.details?.oneLineDescription || detail.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{detail.title}</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip size="small" label={detail.status} color={STATUS_COLOR[detail.status]} sx={{ textTransform: 'capitalize' }} />
                    <Chip size="small" variant="outlined" label={detail.listingType || '-'} />
                    {detail.bhk && <Chip size="small" variant="outlined" label={detail.bhk} />}
                    <Chip size="small" variant="outlined" label={formatPrice(detail.priceValue)} />
                  </Stack>
                </Box>
              </Stack>
              <Divider />
              <Typography variant="subtitle2">Owner</Typography>
              <Typography variant="body2">{detail.ownerName || '-'} · {detail.email} · {detail.mobile || 'no mobile'}</Typography>
              <Typography variant="subtitle2">Description</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{detail.details?.oneLineDescription || '-'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{detail.details?.description || ''}</Typography>
              <Typography variant="subtitle2">Publish permissions</Typography>
              {Array.isArray(detail.listingConsentsText) && detail.listingConsentsText.length ? (
                detail.listingConsentsText.map((line) => (
                  <Typography key={line} variant="body2">{line}</Typography>
                ))
              ) : (
                <Typography variant="body2">Not recorded</Typography>
              )}
              {detail.listingConsentsAcceptedAt && (
                <Typography variant="caption" color="text.secondary">Accepted {formatDate(detail.listingConsentsAcceptedAt)}</Typography>
              )}
              <Typography variant="subtitle2">Commission consent</Typography>
              <Typography variant="body2">
                {detail.commissionAccepted ? `Accepted ${formatDate(detail.commissionAcceptedAt)}` : 'Not recorded'}
              </Typography>
              {detail.commissionTermsText && (
                <Typography variant="body2" color="text.secondary">{detail.commissionTermsText}</Typography>
              )}
              {detail.slug && (
                <Link href={`https://www.rajivwilliams.com/realty/listings/${detail.slug}`} target="_blank" rel="noreferrer" underline="hover">
                  Open public page <OpenInNew sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle' }} />
                </Link>
              )}
              {!!detail.enquiries?.length && (
                <>
                  <Typography variant="subtitle2">Enquiries ({detail.enquiries.length})</Typography>
                  {detail.enquiries.map((e) => (
                    <Paper key={e._id} variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.name} · {e.email}{e.phone ? ` · ${e.phone}` : ''}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(e.createdAt)} · desk only, not sent to the lister</Typography>
                      {e.message && <Typography variant="body2" sx={{ mt: 0.5 }}>{e.message}</Typography>}
                    </Paper>
                  ))}
                </>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setViewId(null)}>Close</Button>
          {detail && detail.status !== 'approved' && (
            <Button color="success" variant="contained" disabled={approveOne.isPending} onClick={() => approveOne.mutate(detail._id)}>Approve</Button>
          )}
          {detail && detail.status !== 'rejected' && (
            <Button color="warning" variant="outlined" onClick={() => { setRejectReason(''); setRejectTarget({ ids: [detail._id] }) }}>Reject</Button>
          )}
          {detail && (
            <Button color="error" variant="contained" disabled={deleteOne.isPending} onClick={() => { if (window.confirm('Delete this listing and its photos/videos from CDN permanently?')) deleteOne.mutate(detail._id) }}>
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>
  }
  if (error) {
    return <Paper sx={{ p: 4, borderRadius: 3 }}><Typography color="error">Unable to load listing accounts.</Typography></Paper>
  }

  return (
    <>
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 99, 165, 0.08)' }}>
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
                onClick={() => {
                  if (window.confirm(`Delete ${selected.length} account(s) and all their listings?`)) bulkDeleteMut.mutate(selected)
                }}>
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
              {filtered.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(row.id)}
                      onChange={() => setSelected((cur) =>
                        cur.includes(row.id) ? cur.filter((id) => id !== row.id) : [...cur, row.id],
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.mobile || '—'}</Typography>
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
                      onClick={() => {
                        if (window.confirm('Delete this listing account and every property it owns?')) deleteMut.mutate(row.id)
                      }}
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
    </>
  )
}

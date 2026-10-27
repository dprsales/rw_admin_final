import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
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
  Pagination,
  Paper,
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
import {
  CancelOutlined,
  CheckCircleOutline,
  DeleteOutline,
  Replay,
  Search,
  StorefrontOutlined,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { deleteVendorPartner, getVendorPartners, updateVendorPartner } from '../../api/services';

type PartnerStatus = 'new' | 'approved' | 'rejected' | 'resubmit';
type Decision = 'approved' | 'rejected' | 'resubmit';

interface VendorPartner {
  _id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email?: string;
  city?: string;
  gstNumber?: string;
  yearOfIncorporation?: string;
  officeLocation?: string;
  industry: string;
  websiteUrl?: string;
  videoUrl?: string;
  about: string;
  profileImageUrl: string;
  brochureUrl?: string;
  status: PartnerStatus;
  vendorId?: string;
  createdAt?: string;
}

const rowsPerPage = 12;
const EMPTY: VendorPartner[] = [];

const STATUS_COLORS: Record<PartnerStatus, 'info' | 'success' | 'error' | 'warning'> = {
  new: 'info',
  approved: 'success',
  rejected: 'error',
  resubmit: 'warning',
};

const STATUS_LABELS: Record<PartnerStatus, string> = {
  new: 'New',
  approved: 'Approved',
  rejected: 'Rejected',
  resubmit: 'Resubmit',
};

const DECISIONS: { status: Decision; label: string; confirm: (row: VendorPartner) => string; toast: string }[] = [
  {
    status: 'approved',
    label: 'Approve',
    confirm: (row) => `Approve ${row.companyName}? This adds them to the vendor list and emails them if they left an address.`,
    toast: 'Approved and added to the vendor list',
  },
  {
    status: 'resubmit',
    label: 'Ask to resubmit',
    confirm: (row) => `Ask ${row.companyName} to resubmit? They will be emailed if they left an address.`,
    toast: 'Asked to resubmit',
  },
  {
    status: 'rejected',
    label: 'Reject',
    confirm: (row) => `Reject ${row.companyName}? They will stay off the vendor list.`,
    toast: 'Rejected',
  },
];

const hrefFor = (value?: string) => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const VendorPartners: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PartnerStatus>('all');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<VendorPartner | null>(null);
  const [pendingDecision, setPendingDecision] = useState<{ row: VendorPartner; decision: typeof DECISIONS[number] } | null>(null);

  const { data, isPending, error } = useQuery<VendorPartner[]>({
    queryKey: ['vendor-partners'],
    queryFn: getVendorPartners,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Decision }) => updateVendorPartner(id, { status }),
    onSuccess: (_result, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-partners'] });
      if (status === 'approved') queryClient.invalidateQueries({ queryKey: ['vendors'] });
      const decision = DECISIONS.find((item) => item.status === status);
      toast.success(decision?.toast || 'Updated');
      setPendingDecision(null);
    },
    onError: () => toast.error('Could not update this application'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteVendorPartner(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<VendorPartner[]>(['vendor-partners'], (current) => (current || []).filter((item) => item._id !== id));
      setPending(null);
      toast.success('Application removed');
    },
    onError: () => toast.error('Could not remove this application'),
  });

  const rows = data || EMPTY;
  const filtered = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!query) return true;
      return [row.companyName, row.contactName, row.phone, row.email, row.city, row.gstNumber, row.yearOfIncorporation, row.officeLocation, row.industry, row.about]
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [rows, searchText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const visible = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  if (isPending) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Paper sx={{ p: 4, borderRadius: 3 }}><Typography color="error">Unable to load listed vendors.</Typography></Paper>;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Listed Vendors</Typography>
        <Typography variant="body2" color="text.secondary">
          People who listed themselves on rajivwilliams.com/vendorpartner. Approve moves them to the vendor list.
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 99, 165, 0.08)' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            value={searchText}
            onChange={(event) => { setSearchText(event.target.value); setPage(1); }}
            placeholder="Search company, contact, phone, or industry"
            size="small"
            sx={{ width: { xs: '100%', sm: 420 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
            {(['all', 'new', 'approved', 'resubmit', 'rejected'] as const).map((value) => (
              <Chip
                key={value}
                label={value === 'all' ? 'All' : STATUS_LABELS[value]}
                onClick={() => { setStatusFilter(value); setPage(1); }}
                color={statusFilter === value ? 'primary' : 'default'}
                variant={statusFilter === value ? 'filled' : 'outlined'}
              />
            ))}
            <Chip icon={<StorefrontOutlined />} label={`${rows.length} received`} sx={{ bgcolor: '#e7f1f7', color: '#0f63a5', fontWeight: 600 }} />
          </Stack>
        </Box>
        <Divider />
        {visible.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>No applications yet</Typography>
            <Typography variant="body2" color="text.secondary">They appear here after someone submits the public form.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Business</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Links</TableCell>
                  <TableCell align="right">Decide</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Avatar src={row.profileImageUrl} alt="" sx={{ width: 44, height: 44 }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{row.companyName}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 360 }}>
                            {row.about}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.contactName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.phone}{row.email ? ` · ${row.email}` : ''}{row.city ? ` · ${row.city}` : ''}
                        {row.gstNumber ? ` · GST ${row.gstNumber}` : ''}{row.yearOfIncorporation ? ` · Est. ${row.yearOfIncorporation}` : ''}
                        {row.officeLocation ? ` · ${row.officeLocation}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.industry}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={STATUS_LABELS[row.status] || row.status}
                        color={STATUS_COLORS[row.status] || 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        {row.websiteUrl && <Link href={hrefFor(row.websiteUrl)} target="_blank" rel="noreferrer">Website</Link>}
                        {row.videoUrl && <Link href={hrefFor(row.videoUrl)} target="_blank" rel="noreferrer">Video</Link>}
                        {row.brochureUrl && <Link href={row.brochureUrl} target="_blank" rel="noreferrer">Brochure</Link>}
                        {!row.websiteUrl && !row.videoUrl && !row.brochureUrl && <Typography variant="caption" color="text.secondary">None yet</Typography>}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Approve">
                          <span>
                            <IconButton
                              size="small"
                              color="success"
                              disabled={statusMutation.isPending || row.status === 'approved'}
                              onClick={() => setPendingDecision({ row, decision: DECISIONS[0] })}
                            >
                              <CheckCircleOutline fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Ask to resubmit">
                          <span>
                            <IconButton
                              size="small"
                              disabled={statusMutation.isPending || row.status === 'resubmit'}
                              onClick={() => setPendingDecision({ row, decision: DECISIONS[1] })}
                            >
                              <Replay fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={statusMutation.isPending || row.status === 'rejected'}
                              onClick={() => setPendingDecision({ row, decision: DECISIONS[2] })}
                            >
                              <CancelOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => setPending(row)}>
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {filtered.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={Math.min(page, totalPages)} onChange={(_, next) => setPage(next)} color="primary" shape="rounded" />
        </Box>
      )}

      <Dialog open={pendingDecision !== null} onClose={() => { if (!statusMutation.isPending) setPendingDecision(null); }} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>{pendingDecision?.decision.label}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {pendingDecision ? pendingDecision.decision.confirm(pendingDecision.row) : ''}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPendingDecision(null)} disabled={statusMutation.isPending}>Cancel</Button>
          <Button
            disabled={!pendingDecision || statusMutation.isPending}
            onClick={() => pendingDecision && statusMutation.mutate({ id: pendingDecision.row._id, status: pendingDecision.decision.status })}
            sx={pendingDecision?.decision.status === 'rejected'
              ? { bgcolor: '#b42318', color: '#fff', '&:hover': { bgcolor: '#912018' } }
              : { bgcolor: '#0f63a5', color: '#fff', '&:hover': { bgcolor: '#0c5288' } }}
          >
            {statusMutation.isPending ? 'Saving...' : pendingDecision?.decision.label}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pending !== null} onClose={() => { if (!removeMutation.isPending) setPending(null); }} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Remove this application?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {pending ? `${pending.companyName} will be removed, including the saved photo and brochure.` : ''}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPending(null)} disabled={removeMutation.isPending}>Cancel</Button>
          <Button
            disabled={!pending || removeMutation.isPending}
            onClick={() => pending && removeMutation.mutate(pending._id)}
            sx={{ bgcolor: '#b42318', color: '#fff', '&:hover': { bgcolor: '#912018' } }}
          >
            {removeMutation.isPending ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorPartners;

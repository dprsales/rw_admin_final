import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  TextField,
  Typography,
} from '@mui/material';
import {
  CancelOutlined,
  CheckCircleOutline,
  Close,
  DeleteOutline,
  Download,
  HandshakeOutlined,
  HourglassEmpty,
  Search,
  Visibility,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  deleteChannelPartner,
  downloadChannelPartnersCsv,
  getChannelPartners,
  updateChannelPartner,
} from '../../api/services';
import PageHeader from '../../Components/PageHeader';
import EmptyState from '../../Components/EmptyState';
import ConfirmDialog from '../../Components/ConfirmDialog';
import { TableSkeleton } from '../../Components/LoadingState';
import { useTableSort, SortableHeadCell } from '../../Components/TableSort';
import { tokens } from '../../Theme/tokens';

export interface ChannelPartnerUpload {
  field: string;
  url: string;
  fileName: string;
}

export interface ChannelPartner {
  _id: string;
  referenceNo: string;
  name: string;
  phone: string;
  email: string;
  agencyName?: string;
  city?: string;
  yearsExperience?: string;
  hasRera?: string;
  reraNo?: string;
  projectCategories?: string[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  clickId?: string;
  referrer?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  status: 'new' | 'reviewing' | 'approved' | 'rejected';
  uploads?: ChannelPartnerUpload[];
  createdAt: string;
}

const rowsPerPage = 12;
const EMPTY_PARTNERS: ChannelPartner[] = [];

const PARTNER_SORT = {
  partner: (row: ChannelPartner) => row.name,
  agency: (row: ChannelPartner) => row.agencyName,
  city: (row: ChannelPartner) => row.city,
  reference: (row: ChannelPartner) => row.referenceNo,
  status: (row: ChannelPartner) => row.status,
  applied: (row: ChannelPartner) => row.createdAt,
};

const STATUS_COLORS: Record<ChannelPartner['status'], 'info' | 'warning' | 'success' | 'error'> = {
  new: 'info',
  reviewing: 'warning',
  approved: 'success',
  rejected: 'error',
};

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString(undefined, {
  day: '2-digit', month: 'short', year: 'numeric',
}) : '-';

const errorMessage = (error: any): string =>
  error?.response?.data?.message ?? 'Something went wrong. Please try again.';

const ChannelPartners: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPartner, setSelectedPartner] = useState<ChannelPartner | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | {
    kind: 'approve' | 'delete' | 'reject';
    partner: ChannelPartner;
  }>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (partnerId: string) => deleteChannelPartner(partnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-partners'] });
      setSelectedPartner(null);
      setConfirmAction(null);
      toast.success('Channel partner deleted');
    },
    onError: (error: any) => {
      setConfirmAction(null);
      toast.error(errorMessage(error));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ partnerId, status }: { partnerId: string; status: ChannelPartner['status'] }) =>
      updateChannelPartner(partnerId, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channel-partners'] });
      setSelectedPartner((prev) => (prev ? { ...prev, status: variables.status } : prev));
      setConfirmAction(null);
      toast.success(variables.status === 'approved'
        ? 'Partner approved and notified'
        : variables.status === 'rejected'
          ? 'Partner rejected'
          : 'Status updated');
    },
    onError: (error: any) => {
      setConfirmAction(null);
      toast.error(errorMessage(error));
    },
  });

  const runConfirmAction = () => {
    if (!confirmAction) return;
    const { kind, partner } = confirmAction;
    if (kind === 'delete') {
      deleteMutation.mutate(partner._id);
    } else {
      statusMutation.mutate({ partnerId: partner._id, status: kind === 'approve' ? 'approved' : 'rejected' });
    }
  };

  const { data, isPending, error } = useQuery<ChannelPartner[], Error>({
    queryKey: ['channel-partners'],
    queryFn: getChannelPartners,
  });

  const partners = data || EMPTY_PARTNERS;
  const filteredPartners = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return partners;
    return partners.filter((partner) => [
      partner.name,
      partner.email,
      partner.phone,
      partner.agencyName,
      partner.city,
      partner.referenceNo,
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [partners, searchText]);

  const { sorted: sortedPartners, order, orderBy, toggle: toggleSort } = useTableSort(filteredPartners, PARTNER_SORT);
  const totalPages = Math.max(1, Math.ceil(sortedPartners.length / rowsPerPage));
  const visiblePartners = sortedPartners.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    setCurrentPage(1);
  };

  const handleCsvExport = async () => {
    setExporting(true);
    try {
      const response = await downloadChannelPartnersCsv();
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `channel-partners-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch (error: any) {
      toast.error(errorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  if (isPending) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <PageHeader title="Channel partners" description="Review agencies and brokers who have applied to sell RW inventory." crumbs={[{ label: 'Channel Partners' }]} />
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableSkeleton rows={7} columns={7} />
        </Paper>
      </Box>
    );
  }

  if (error) {
    return <Paper sx={{ p: 4, borderRadius: 3 }}><Typography color="error">Unable to load channel partners. Please try again.</Typography></Paper>;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <PageHeader
        title="Channel partners"
        description="Review agencies and brokers who have applied to sell RW inventory."
        crumbs={[{ label: 'Channel Partners' }]}
        actions={
          <>
            <Chip icon={<HandshakeOutlined />} label={`${partners.length} total`} sx={{ bgcolor: tokens.goldSoft, color: tokens.goldText, fontWeight: 600 }} />
            <Button
              onClick={handleCsvExport}
              disabled={exporting || partners.length === 0}
              startIcon={<Download />}
              variant="outlined"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </>
        }
      />

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: tokens.shadowSoft }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            value={searchText}
            onChange={handleSearch}
            placeholder="Search name, email, agency, city or reference"
            size="small"
            sx={{ width: { xs: '100%', sm: 380 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <Typography variant="caption" color="text.secondary">{filteredPartners.length} matching partners</Typography>
        </Box>
        <Divider />

        {visiblePartners.length === 0 ? (
          <EmptyState
            icon={HandshakeOutlined}
            title="No channel partners found"
            description="New partner enrolments will appear here automatically. Try a different search."
          />
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 820 }}>
              <TableHead sx={{ bgcolor: tokens.surfaceAlt }}>
                <TableRow>
                  <SortableHeadCell label="Partner" sortKey="partner" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <SortableHeadCell label="Agency" sortKey="agency" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <SortableHeadCell label="City" sortKey="city" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <SortableHeadCell label="Reference" sortKey="reference" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <SortableHeadCell label="Status" sortKey="status" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <SortableHeadCell label="Applied" sortKey="applied" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <TableCell sx={{ fontWeight: 700, color: tokens.text }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visiblePartners.map((partner) => (
                  <TableRow key={partner._id} hover onClick={() => setSelectedPartner(partner)} sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{partner.name || 'Unnamed partner'}</Typography>
                      <Typography variant="caption" color="text.secondary">{partner.email}</Typography>
                    </TableCell>
                    <TableCell>{partner.agencyName || '-'}</TableCell>
                    <TableCell>{partner.city || '-'}</TableCell>
                    <TableCell>{partner.referenceNo || '-'}</TableCell>
                    <TableCell><Chip size="small" label={partner.status} color={STATUS_COLORS[partner.status] || 'default'} sx={{ textTransform: 'capitalize', fontWeight: 600 }} /></TableCell>
                    <TableCell>{formatDate(partner.createdAt)}</TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View details">
                          <IconButton size="small" aria-label="View partner details" onClick={() => setSelectedPartner(partner)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {partner.status !== 'approved' && (
                          <Tooltip title="Approve & notify applicant">
                            <IconButton
                              size="small"
                              aria-label={`Approve ${partner.name || 'this applicant'}`}
                              color="success"
                              disabled={statusMutation.isPending}
                              onClick={() => setConfirmAction({ kind: 'approve', partner })}
                            >
                              <CheckCircleOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {filteredPartners.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={Math.min(currentPage, totalPages)} onChange={(_, page) => setCurrentPage(page)} color="primary" shape="rounded" />
        </Box>
      )}

      <PartnerDetails
        partner={selectedPartner}
        onClose={() => setSelectedPartner(null)}
        onDelete={(partnerId) => {
          const partner = partners.find((item) => item._id === partnerId) ?? selectedPartner;
          if (partner) setConfirmAction({ kind: 'delete', partner });
        }}
        onStatusChange={(status) => selectedPartner && statusMutation.mutate({ partnerId: selectedPartner._id, status })}
        onConfirmAction={(kind) => selectedPartner && setConfirmAction({ kind, partner: selectedPartner })}
        savingStatus={statusMutation.isPending}
        deleting={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.kind === 'delete'
          ? 'Delete channel partner?'
          : confirmAction?.kind === 'reject'
            ? 'Reject this application?'
            : 'Approve this application?'}
        description={confirmAction?.kind === 'delete'
          ? 'This channel partner and all their uploaded files will be permanently removed. This cannot be undone.'
          : confirmAction?.kind === 'reject'
            ? `${confirmAction?.partner.name || 'This applicant'} will be marked as rejected.`
            : `${confirmAction?.partner.name || 'This applicant'} will be emailed the approval notice and commission creative immediately.`}
        confirmLabel={confirmAction?.kind === 'delete'
          ? 'Delete partner'
          : confirmAction?.kind === 'reject'
            ? 'Reject'
            : 'Approve & notify'}
        tone={confirmAction?.kind === 'approve' ? 'primary' : 'danger'}
        loading={deleteMutation.isPending || statusMutation.isPending}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirmAction}
      />
    </Box>
  );
};

const PartnerDetails: React.FC<{
  partner: ChannelPartner | null;
  onClose: () => void;
  onDelete: (partnerId: string) => void;
  onStatusChange: (status: ChannelPartner['status']) => void;
  onConfirmAction: (kind: 'approve' | 'reject') => void;
  savingStatus: boolean;
  deleting: boolean;
}> = ({ partner, onClose, onDelete, onStatusChange, onConfirmAction, savingStatus, deleting }) => (
  <Dialog open={Boolean(partner)} onClose={onClose} fullWidth maxWidth="md">
    {partner && <>
      <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
        {partner.name || 'Partner details'}
        <IconButton onClick={onClose} aria-label="Close" sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{partner.agencyName || 'Independent'} · Ref {partner.referenceNo}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Status</Typography>
            <Chip size="small" label={partner.status} color={STATUS_COLORS[partner.status] || 'default'} sx={{ textTransform: 'capitalize', fontWeight: 600 }} />
            {savingStatus && <CircularProgress size={16} />}
          </Box>

          {/* Discrete actions, not a dropdown — each button states exactly what it does,
              and Approve carries its own confirm step since it immediately emails the
              applicant the approval notice and commission creative. */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircleOutline />}
              disabled={savingStatus || partner.status === 'approved'}
              onClick={() => onConfirmAction('approve')}
            >
              {partner.status === 'approved' ? 'Approved' : 'Approve & notify'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<HourglassEmpty />}
              disabled={savingStatus || partner.status === 'reviewing'}
              onClick={() => onStatusChange('reviewing')}
            >
              Mark reviewing
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelOutlined />}
              disabled={savingStatus || partner.status === 'rejected'}
              onClick={() => onConfirmAction('reject')}
            >
              Reject
            </Button>
          </Stack>
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Contact & agency</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
          <Detail label="Email" value={partner.email} link={`mailto:${partner.email}`} />
          <Detail label="Phone" value={partner.phone} link={`tel:${partner.phone}`} />
          <Detail label="Agency" value={partner.agencyName} />
          <Detail label="Base city" value={partner.city} />
          <Detail label="Years experience" value={partner.yearsExperience} />
          <Detail label="Applied" value={formatDate(partner.createdAt)} />
          <Detail label="RERA registered" value={partner.hasRera} />
          <Detail label="RERA number" value={partner.reraNo} />
          <Detail label="Project categories" value={partner.projectCategories?.join(', ')} />
          <Detail label="Terms accepted" value={partner.termsAccepted ? `Yes${partner.termsAcceptedAt ? ` · ${formatDate(partner.termsAcceptedAt)}` : ''}` : 'No'} />
        </Box>

        {(partner.uploads && partner.uploads.length > 0) && <>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Uploaded files</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
            {partner.uploads.map((upload) => (
              <Box
                key={upload.url}
                component="a"
                href={upload.url}
                target="_blank"
                rel="noreferrer"
                sx={{ display: 'inline-flex', flexDirection: 'column', px: 2, py: 1, borderRadius: 1.5, border: `1px solid ${tokens.line}`, bgcolor: tokens.surfaceAlt, textDecoration: 'none', color: tokens.goldText, minWidth: 140 }}
              >
                <Typography variant="caption" sx={{ textTransform: 'capitalize', color: tokens.textMuted }}>{upload.field.replace(/([A-Z])/g, ' $1').trim()}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{upload.fileName || 'View file'}</Typography>
              </Box>
            ))}
          </Box>
        </>}

        {(partner.utmSource || partner.utmMedium || partner.utmCampaign || partner.referrer) && <>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Attribution</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, p: 2, bgcolor: tokens.surfaceAlt, border: `1px solid ${tokens.line}`, borderRadius: 1 }}>
            <Detail label="UTM source" value={partner.utmSource} />
            <Detail label="UTM medium" value={partner.utmMedium} />
            <Detail label="UTM campaign" value={partner.utmCampaign} />
            <Detail label="UTM term" value={partner.utmTerm} />
            <Detail label="UTM content" value={partner.utmContent} />
            <Detail label="Referrer" value={partner.referrer} />
          </Box>
        </>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          color="error"
          startIcon={<DeleteOutline />}
          onClick={() => onDelete(partner._id)}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete Partner'}
        </Button>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </DialogActions>
    </>}
  </Dialog>
);

const Detail: React.FC<{ label: string; value?: string; link?: string }> = ({ label, value, link }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.4 }}>{label}</Typography>
    {link && value ? <Typography component="a" href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noreferrer" variant="body2" sx={{ color: tokens.goldText, wordBreak: 'break-word' }}>{value}</Typography> : <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{value || '-'}</Typography>}
  </Box>
);

export default ChannelPartners;

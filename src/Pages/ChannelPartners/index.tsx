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
import {
  deleteChannelPartner,
  downloadChannelPartnersCsv,
  getChannelPartners,
  updateChannelPartner,
} from '../../api/services';

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
  status: 'new' | 'reviewing' | 'approved' | 'rejected';
  uploads?: ChannelPartnerUpload[];
  createdAt: string;
}

const rowsPerPage = 12;
const EMPTY_PARTNERS: ChannelPartner[] = [];

const STATUS_COLORS: Record<ChannelPartner['status'], 'info' | 'warning' | 'success' | 'error'> = {
  new: 'info',
  reviewing: 'warning',
  approved: 'success',
  rejected: 'error',
};

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString(undefined, {
  day: '2-digit', month: 'short', year: 'numeric',
}) : '-';

const ChannelPartners: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPartner, setSelectedPartner] = useState<ChannelPartner | null>(null);
  const [exporting, setExporting] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (partnerId: string) => deleteChannelPartner(partnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-partners'] });
      setSelectedPartner(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ partnerId, status }: { partnerId: string; status: ChannelPartner['status'] }) =>
      updateChannelPartner(partnerId, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channel-partners'] });
      setSelectedPartner((prev) => (prev ? { ...prev, status: variables.status } : prev));
    },
  });

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

  const totalPages = Math.max(1, Math.ceil(filteredPartners.length / rowsPerPage));
  const visiblePartners = filteredPartners.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
    } finally {
      setExporting(false);
    }
  };

  if (isPending) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Paper sx={{ p: 4, borderRadius: 3 }}><Typography color="error">Unable to load channel partners. Please try again.</Typography></Paper>;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Channel partners</Typography>
          <Typography variant="body2" color="text.secondary">Review agencies and brokers who have applied to sell RW inventory.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip icon={<HandshakeOutlined />} label={`${partners.length} total`} sx={{ bgcolor: '#e7f1f7', color: '#0f63a5', fontWeight: 600 }} />
          <Button
            onClick={handleCsvExport}
            disabled={exporting || partners.length === 0}
            startIcon={<Download />}
            variant="outlined"
            sx={{ borderRadius: 1.5, borderColor: '#0f63a5', color: '#0f63a5', fontWeight: 600, '&:hover': { bgcolor: '#e7f1f7', borderColor: '#0f63a5' } }}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 99, 165, 0.08)' }}>
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
          <Box sx={{ py: 10, px: 3, textAlign: 'center' }}>
            <HandshakeOutlined sx={{ fontSize: 42, color: '#9bb9ca', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>No channel partners found</Typography>
            <Typography variant="body2" color="text.secondary">New partner enrolments will appear here automatically.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 820 }}>
              <TableHead sx={{ bgcolor: '#f3f8fb' }}>
                <TableRow>
                  {['Partner', 'Agency', 'City', 'Reference', 'Status', 'Applied', 'Actions'].map((heading) => <TableCell key={heading} sx={{ fontWeight: 700, color: '#355466' }}>{heading}</TableCell>)}
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
                          <IconButton size="small" onClick={() => setSelectedPartner(partner)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {partner.status !== 'approved' && (
                          <Tooltip title="Approve & notify applicant">
                            <IconButton
                              size="small"
                              color="success"
                              disabled={statusMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Approve ${partner.name || 'this applicant'}? This immediately emails them the approval notice and commission creative.`)) {
                                  statusMutation.mutate({ partnerId: partner._id, status: 'approved' });
                                }
                              }}
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
          if (window.confirm('Delete this channel partner and its uploaded files permanently?')) {
            deleteMutation.mutate(partnerId);
          }
        }}
        onStatusChange={(status) => selectedPartner && statusMutation.mutate({ partnerId: selectedPartner._id, status })}
        savingStatus={statusMutation.isPending}
        deleting={deleteMutation.isPending}
      />
    </Box>
  );
};

const PartnerDetails: React.FC<{
  partner: ChannelPartner | null;
  onClose: () => void;
  onDelete: (partnerId: string) => void;
  onStatusChange: (status: ChannelPartner['status']) => void;
  savingStatus: boolean;
  deleting: boolean;
}> = ({ partner, onClose, onDelete, onStatusChange, savingStatus, deleting }) => (
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
              onClick={() => {
                if (window.confirm(`Approve ${partner.name || 'this applicant'}? This immediately emails them the approval notice and commission creative.`)) {
                  onStatusChange('approved');
                }
              }}
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
              onClick={() => {
                if (window.confirm(`Reject ${partner.name || 'this applicant'}?`)) {
                  onStatusChange('rejected');
                }
              }}
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
                sx={{ display: 'inline-flex', flexDirection: 'column', px: 2, py: 1, borderRadius: 1.5, border: '1px solid #d5e3ec', bgcolor: '#f7fbfd', textDecoration: 'none', color: '#0f63a5', minWidth: 140 }}
              >
                <Typography variant="caption" sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>{upload.field.replace(/([A-Z])/g, ' $1').trim()}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{upload.fileName || 'View file'}</Typography>
              </Box>
            ))}
          </Box>
        </>}

        {(partner.utmSource || partner.utmMedium || partner.utmCampaign || partner.referrer) && <>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Attribution</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, p: 2, bgcolor: '#fafcfd', border: '1px solid #e4edf2', borderRadius: 1 }}>
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
    {link && value ? <Typography component="a" href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noreferrer" variant="body2" sx={{ color: '#0f63a5', wordBreak: 'break-word' }}>{value}</Typography> : <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{value || '-'}</Typography>}
  </Box>
);

export default ChannelPartners;

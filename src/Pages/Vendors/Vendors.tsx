import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
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
  Add,
  Close,
  DeleteOutline,
  EditOutlined,
  PauseCircleOutline,
  PlayCircleOutline,
  Search,
  StorefrontOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { createVendor, deleteVendor, getVendors, removeVendorDocument, updateVendor } from '../../api/services';
import PageHeader from '../../Components/PageHeader';
import EmptyState from '../../Components/EmptyState';
import ConfirmDialog from '../../Components/ConfirmDialog';
import { TableSkeleton, PageSkeleton } from '../../Components/LoadingState';
import { useTableSort, SortableHeadCell } from '../../Components/TableSort';
import { tokens } from '../../Theme/tokens';

type VendorStatus = 'active' | 'paused';

export interface Vendor {
  _id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email?: string;
  city?: string;
  industry: string;
  note?: string;
  websiteUrl?: string;
  feedback?: string;
  gstNumber?: string;
  yearOfIncorporation?: string;
  officeLocation?: string;
  panNumber?: string;
  cancelledChequeUrl?: string;
  brochureUrl?: string;
  status: VendorStatus;
  replacedNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

const VENDOR_SORT = {
  company: (row: Vendor) => row.companyName,
  name: (row: Vendor) => row.contactName,
  industry: (row: Vendor) => row.industry,
  status: (row: Vendor) => row.status,
  updated: (row: Vendor) => row.updatedAt || row.createdAt,
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type VendorDraft = {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  industry: string;
  note: string;
  websiteUrl: string;
  feedback: string;
  gstNumber: string;
  yearOfIncorporation: string;
  officeLocation: string;
  panNumber: string;
  status: VendorStatus;
};

type VendorFiles = {
  cancelledCheque: File | null;
  brochure: File | null;
};

type VendorDocumentKind = 'cheque' | 'brochure';

const rowsPerPage = 12;
const EMPTY: Vendor[] = [];

const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const YEAR_PATTERN = /^(18|19|20)\d{2}$/;
const THIS_YEAR = new Date().getFullYear();
const DOCUMENT_ACCEPT = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const blankFiles = (): VendorFiles => ({
  cancelledCheque: null,
  brochure: null,
});

const blankDraft = (): VendorDraft => ({
  companyName: '',
  contactName: '',
  phone: '',
  email: '',
  city: '',
  industry: '',
  note: '',
  websiteUrl: '',
  feedback: '',
  gstNumber: '',
  yearOfIncorporation: '',
  officeLocation: '',
  panNumber: '',
  status: 'active',
});

const draftFrom = (vendor: Vendor): VendorDraft => ({
  companyName: vendor.companyName,
  contactName: vendor.contactName,
  phone: vendor.phone,
  email: vendor.email || '',
  city: vendor.city || '',
  industry: vendor.industry,
  note: vendor.note || '',
  websiteUrl: vendor.websiteUrl || '',
  feedback: vendor.feedback || '',
  gstNumber: vendor.gstNumber || '',
  yearOfIncorporation: vendor.yearOfIncorporation || '',
  officeLocation: vendor.officeLocation || '',
  panNumber: vendor.panNumber || '',
  status: vendor.status,
});

const payloadFrom = (draft: VendorDraft) => ({
  companyName: draft.companyName.trim(),
  contactName: draft.contactName.trim(),
  phone: draft.phone.trim(),
  industry: draft.industry.trim(),
  status: draft.status,
  ...(draft.email.trim() ? { email: draft.email.trim() } : {}),
  ...(draft.city.trim() ? { city: draft.city.trim() } : {}),
  ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
  ...(draft.websiteUrl.trim() ? { websiteUrl: draft.websiteUrl.trim() } : {}),
  ...(draft.feedback.trim() ? { feedback: draft.feedback.trim() } : {}),
  ...(draft.gstNumber.trim() ? { gstNumber: draft.gstNumber.trim().toUpperCase() } : {}),
  ...(draft.yearOfIncorporation.trim() ? { yearOfIncorporation: draft.yearOfIncorporation.trim() } : {}),
  ...(draft.officeLocation.trim() ? { officeLocation: draft.officeLocation.trim() } : {}),
  ...(draft.panNumber.trim() ? { panNumber: draft.panNumber.trim().toUpperCase() } : {}),
});

const bodyFrom = (draft: VendorDraft, files: VendorFiles) => {
  const payload = payloadFrom(draft);
  const chosen = Object.values(files).some(Boolean);
  if (!chosen) return payload;
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => body.append(key, value));
  if (files.cancelledCheque) body.append('cancelledCheque', files.cancelledCheque);
  if (files.brochure) body.append('brochure', files.brochure);
  return body;
};

const apiMessage = (error: unknown) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string' && message) return message;
  return 'Could not save this vendor. Please try again.';
};

const Vendors: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [industry, setIndustry] = useState('All');
  const [status, setStatus] = useState<'all' | VendorStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewing, setViewing] = useState<Vendor | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Vendor | null>(null);
  const [confirmError, setConfirmError] = useState('');
  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery<Vendor[], Error>({
    queryKey: ['vendors'],
    queryFn: getVendors,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVendor(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<Vendor[]>(['vendors'], (current) => (current || []).filter((item) => item._id !== id));
      setPendingDelete(null);
      setConfirmError('');
      if (viewing?._id === id) setViewing(null);
      toast.success('Vendor deleted');
    },
    onError: (deleteError) => setConfirmError(apiMessage(deleteError)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: VendorStatus }) => updateVendor(id, { status: next }),
    onSuccess: (_result, { id, next }) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setViewing((current) => (current && current._id === id ? { ...current, status: next } : current));
      toast.success(next === 'paused' ? 'Vendor paused' : 'Vendor resumed');
    },
  });

  const confirmBusy = deleteMutation.isPending;
  const vendors = data || EMPTY;
  const industries = useMemo(
    () => Array.from(new Set(vendors.map((vendor) => vendor.industry).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [vendors],
  );

  const filtered = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return vendors.filter((vendor) => {
      if (industry !== 'All' && vendor.industry.toLowerCase() !== industry.toLowerCase()) return false;
      if (status !== 'all' && vendor.status !== status) return false;
      if (!query) return true;
      return [
        vendor.companyName,
        vendor.contactName,
        vendor.phone,
        vendor.email,
        vendor.city,
        vendor.gstNumber,
        vendor.yearOfIncorporation,
        vendor.officeLocation,
        vendor.panNumber,
        vendor.websiteUrl,
        vendor.feedback,
        vendor.note,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [vendors, searchText, industry, status]);

  const { sorted, order, orderBy, toggle: toggleSort } = useTableSort(filtered, VENDOR_SORT, 'updated', 'desc');
  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const visible = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const resetPage = () => setCurrentPage(1);

  if (isPending) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <PageHeader
          title="Vendor List"
          description="Companies Team RW already works with. The GST number, PAN number, and documents stay on the row."
          crumbs={[{ label: 'Vendor List' }]}
        />
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableSkeleton rows={8} columns={7} />
        </Paper>
      </Box>
    );
  }

  if (error) {
    return <Paper sx={{ p: 4, borderRadius: 3 }}><Typography color="error">Unable to load the vendor list. Please try again.</Typography></Paper>;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <PageHeader
        title="Vendor List"
        description="Companies Team RW already works with. The GST number, PAN number, and documents stay on the row."
        crumbs={[{ label: 'Vendor List' }]}
        actions={
          <>
            <Chip icon={<StorefrontOutlined />} label={`${vendors.length} total`} sx={{ bgcolor: tokens.goldSoft, color: tokens.goldText, fontWeight: 600 }} />
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/vendors/new')}>
              Add vendor
            </Button>
          </>
        }
      />

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: tokens.shadowSoft }}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              value={searchText}
              onChange={(event) => { setSearchText(event.target.value); resetPage(); }}
              placeholder="Search company, contact, phone, email, city, office, website, feedback, GST, year or PAN"
              size="small"
              sx={{ width: { xs: '100%', sm: 360, md: 420 }, flex: '1 1 280px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
            <Autocomplete
              size="small"
              options={['All industries', ...industries]}
              value={industry === 'All' ? 'All industries' : industry}
              onChange={(_, value) => {
                setIndustry(!value || value === 'All industries' ? 'All' : value);
                resetPage();
              }}
              sx={{ width: { xs: '100%', sm: 260 }, flex: '0 1 260px' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Industry"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
            />
            <Stack direction="row" spacing={1} sx={{ flex: '0 0 auto' }}>
              {(['all', 'active', 'paused'] as const).map((option) => (
                <Chip
                  key={option}
                  label={option === 'all' ? 'All' : option}
                  clickable
                  color={status === option ? 'primary' : 'default'}
                  onClick={() => { setStatus(option); resetPage(); }}
                  sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                />
              ))}
            </Stack>
          </Box>
          <Typography variant="caption" color="text.secondary">{sorted.length} matching companies · newest updates first</Typography>
        </Box>
        <Divider />

        {visible.length === 0 ? (
          <EmptyState
            icon={StorefrontOutlined}
            title={vendors.length === 0 ? 'No companies yet' : 'No companies match'}
            description={vendors.length === 0 ? 'Add the first company to start the vendor list.' : 'Try another industry or clear the search.'}
            actionLabel={vendors.length === 0 ? 'Add vendor' : undefined}
            onAction={vendors.length === 0 ? () => navigate('/vendors/new') : undefined}
          />
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 1180 }}>
              <TableHead sx={{ bgcolor: tokens.surfaceAlt }}>
                <TableRow>
                  <SortableHeadCell label="Company" sortKey="company" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700, color: tokens.text }} />
                  <SortableHeadCell label="Name" sortKey="name" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700, color: tokens.text }} />
                  <TableCell sx={{ fontWeight: 700, color: tokens.text }}>GST / PAN</TableCell>
                  <SortableHeadCell label="Industry" sortKey="industry" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700, color: tokens.text }} />
                  <TableCell sx={{ fontWeight: 700, color: tokens.text }}>Documents</TableCell>
                  <SortableHeadCell label="Status" sortKey="status" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700, color: tokens.text }} />
                  <SortableHeadCell label="Updated" sortKey="updated" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700, color: tokens.text }} />
                  <TableCell sx={{ fontWeight: 700, color: tokens.text }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((vendor) => (
                  <TableRow
                    key={vendor._id}
                    hover
                    onClick={() => setViewing(vendor)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{vendor.companyName}</Typography>
                      {vendor.websiteUrl && (
                        <Typography
                          component="a"
                          href={vendor.websiteUrl.startsWith('http') ? vendor.websiteUrl : `https://${vendor.websiteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="caption"
                          onClick={(event) => event.stopPropagation()}
                          sx={{ color: tokens.goldText, display: 'block', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          Website / portfolio
                        </Typography>
                      )}
                      {vendor.replacedNote && (
                        <Typography variant="caption" color="text.secondary">{vendor.replacedNote}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{vendor.contactName}</Typography>
                      <Typography variant="caption" color="text.secondary">{vendor.phone}{vendor.email ? ` · ${vendor.email}` : ''}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">GST {vendor.gstNumber || '-'}</Typography>
                      {vendor.yearOfIncorporation ? (
                        <Typography variant="caption" color="text.secondary">Est. {vendor.yearOfIncorporation}</Typography>
                      ) : null}
                      <Typography variant="caption" color="text.secondary">PAN {vendor.panNumber || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{vendor.industry}</Typography>
                      <Typography variant="caption" color="text.secondary">{vendor.city || '-'}</Typography>
                      {vendor.feedback && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {vendor.feedback.length > 80 ? `${vendor.feedback.slice(0, 80)}…` : vendor.feedback}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <DocumentLinks vendor={vendor} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={vendor.status}
                        color={vendor.status === 'active' ? 'success' : 'default'}
                        sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDateTime(vendor.updatedAt || vendor.createdAt)}</Typography>
                      {vendor.createdAt && vendor.updatedAt && vendor.createdAt !== vendor.updatedAt ? (
                        <Typography variant="caption" color="text.secondary">Added {formatDateTime(vendor.createdAt)}</Typography>
                      ) : null}
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View details">
                          <IconButton size="small" onClick={() => setViewing(vendor)}>
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => navigate(`/vendors/${vendor._id}`)}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              size="small"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                setConfirmError('');
                                setPendingDelete(vendor);
                              }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={vendor.status === 'active' ? 'Pause' : 'Resume'}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={statusMutation.isPending}
                              onClick={() => statusMutation.mutate({
                                id: vendor._id,
                                next: vendor.status === 'active' ? 'paused' : 'active',
                              })}
                            >
                              {vendor.status === 'active' ? <PauseCircleOutline fontSize="small" /> : <PlayCircleOutline fontSize="small" />}
                            </IconButton>
                          </span>
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

      {sorted.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={Math.min(currentPage, totalPages)}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}

      <VendorDetails
        vendor={viewing}
        onClose={() => setViewing(null)}
        onEdit={() => {
          if (!viewing) return;
          const id = viewing._id;
          setViewing(null);
          navigate(`/vendors/${id}`);
        }}
        onDelete={() => {
          if (!viewing) return;
          setConfirmError('');
          setPendingDelete(viewing);
        }}
        onToggleStatus={() => {
          if (!viewing) return;
          statusMutation.mutate({
            id: viewing._id,
            next: viewing.status === 'active' ? 'paused' : 'active',
          });
        }}
        deleting={deleteMutation.isPending}
        statusBusy={statusMutation.isPending}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this vendor?"
        description={
          `${pendingDelete?.companyName ?? 'This vendor'} will be removed from the sheet. Saved files are removed from storage too.` +
          (confirmError ? ` ${confirmError}` : '')
        }
        confirmLabel="Delete"
        tone="danger"
        loading={confirmBusy}
        onConfirm={() => { if (pendingDelete) deleteMutation.mutate(pendingDelete._id); }}
        onClose={() => { setPendingDelete(null); setConfirmError(''); }}
      />
    </Box>
  );
};

const hrefFor = (value?: string) => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const VendorDetails: React.FC<{
  vendor: Vendor | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  deleting: boolean;
  statusBusy: boolean;
}> = ({ vendor, onClose, onEdit, onDelete, onToggleStatus, deleting, statusBusy }) => (
  <Dialog open={Boolean(vendor)} onClose={onClose} fullWidth maxWidth="md">
    {vendor && (
      <>
        <DialogTitle sx={{ pr: 2, pb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
            <Box sx={{ minWidth: 0, pr: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.3 }}>
                {vendor.companyName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {vendor.contactName} · {vendor.industry}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end" sx={{ flexShrink: 0 }}>
              <Button
                size="small"
                variant="contained"
                startIcon={<EditOutlined />}
                onClick={onEdit}
              >
                Edit
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteOutline />}
                disabled={deleting}
                onClick={onDelete}
              >
                Delete
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Close />}
                onClick={onClose}
              >
                Close
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Status</Typography>
            <Chip
              size="small"
              label={vendor.status}
              color={vendor.status === 'active' ? 'success' : 'default'}
              sx={{ textTransform: 'capitalize', fontWeight: 600 }}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={vendor.status === 'active' ? <PauseCircleOutline /> : <PlayCircleOutline />}
              disabled={statusBusy}
              onClick={onToggleStatus}
            >
              {vendor.status === 'active' ? 'Pause' : 'Resume'}
            </Button>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Contact</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
            <Detail label="Name" value={vendor.contactName} />
            <Detail label="Phone" value={vendor.phone} link={vendor.phone ? `tel:${vendor.phone}` : undefined} />
            <Detail label="Email" value={vendor.email} link={vendor.email ? `mailto:${vendor.email}` : undefined} />
            <Detail label="City" value={vendor.city} />
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Business</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
            <Detail label="Company" value={vendor.companyName} />
            <Detail label="Industry" value={vendor.industry} />
            <Detail label="GST" value={vendor.gstNumber} />
            <Detail label="PAN" value={vendor.panNumber} />
            <Detail label="Year of incorporation" value={vendor.yearOfIncorporation} />
            <Detail label="Website" value={vendor.websiteUrl} link={vendor.websiteUrl ? hrefFor(vendor.websiteUrl) : undefined} />
            <Detail label="Office location" value={vendor.officeLocation} />
            <Detail label="Updated" value={formatDateTime(vendor.updatedAt || vendor.createdAt)} />
            <Detail label="Added" value={formatDateTime(vendor.createdAt)} />
          </Box>

          {(vendor.note || vendor.feedback || vendor.replacedNote) && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Notes</Typography>
              <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
                {vendor.note ? <Detail label="What they supply" value={vendor.note} /> : null}
                {vendor.feedback ? <Detail label="Feedback" value={vendor.feedback} /> : null}
                {vendor.replacedNote ? <Detail label="Replacement note" value={vendor.replacedNote} /> : null}
              </Box>
            </>
          )}

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Documents</Typography>
          <DocumentLinks vendor={vendor} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="outlined" startIcon={<Close />}>
            Close
          </Button>
        </DialogActions>
      </>
    )}
  </Dialog>
);

const Detail: React.FC<{ label: string; value?: string; link?: string }> = ({ label, value, link }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.4 }}>{label}</Typography>
    {link && value ? (
      <Typography
        component="a"
        href={link}
        target={link.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
        variant="body2"
        sx={{ color: tokens.goldText, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
      >
        {value}
      </Typography>
    ) : (
      <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{value || '-'}</Typography>
    )}
  </Box>
);

const documentLinks = (vendor: Vendor) => [
  vendor.cancelledChequeUrl ? { label: 'Cheque', url: vendor.cancelledChequeUrl } : null,
  vendor.brochureUrl ? { label: 'Brochure', url: vendor.brochureUrl } : null,
].filter((item): item is { label: string; url: string } => Boolean(item));

const isPdfUrl = (url: string) => /\.pdf($|\?)/i.test(url);

const DocumentLinks: React.FC<{ vendor: Vendor }> = ({ vendor }) => {
  const links = documentLinks(vendor);
  if (links.length === 0) return <Typography variant="body2" color="text.secondary">None yet</Typography>;
  return (
    <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
      {links.map((item) => (
        <Box key={item.label} component="a" href={item.url} target="_blank" rel="noreferrer" sx={{ textDecoration: 'none', color: 'inherit' }}>
          {isPdfUrl(item.url) ? (
            <Box sx={{ width: 56, height: 56, borderRadius: 1, border: `1px solid ${tokens.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: tokens.surfaceAlt, color: tokens.goldText, fontSize: 12, fontWeight: 700 }}>PDF</Box>
          ) : (
            <Box component="img" src={item.url} alt={item.label} sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, border: `1px solid ${tokens.line}`, display: 'block' }} />
          )}
          <Typography variant="caption" sx={{ display: 'block', mt: 0.25, color: tokens.textMuted }}>{item.label}</Typography>
        </Box>
      ))}
    </Stack>
  );
};

const DocumentDrop: React.FC<{
  label: string;
  file: File | null;
  currentUrl?: string;
  removing: boolean;
  onFile: (file: File | null) => void;
  onReject: (message: string) => void;
  onClear: () => void;
  onRemove?: () => void;
}> = ({ label, file, currentUrl, removing, onFile, onReject, onClear, onRemove }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const preview = objectUrl || currentUrl || '';
  const previewIsPdf = file ? file.type === 'application/pdf' : Boolean(preview && isPdfUrl(preview));

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: DOCUMENT_ACCEPT,
    multiple: false,
    maxFiles: 1,
    disabled: removing,
    onDrop: (accepted, rejected) => {
      if (rejected.length || !accepted[0]) {
        onReject('Upload a PDF or an image.');
        return;
      }
      onReject('');
      onFile(accepted[0]);
    },
  });

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 700 }}>{label}</Typography>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? tokens.gold : tokens.lineStrong,
          borderRadius: 2,
          bgcolor: isDragActive ? tokens.goldSoft : tokens.surfaceAlt,
          px: 2,
          py: 2.5,
          textAlign: 'center',
          cursor: removing ? 'default' : 'pointer',
        }}
      >
        <input {...getInputProps()} />
        <Typography variant="body2" color="text.secondary">
          {isDragActive ? 'Drop the file' : 'Drop a PDF or image here, or click to choose'}
        </Typography>
        {file && <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>{file.name}</Typography>}
      </Box>
      {preview && (
        <Box sx={{ mt: 1.25 }}>
          {previewIsPdf ? (
            <Box component="iframe" title={`${label} preview`} src={preview} sx={{ width: '100%', height: 220, border: `1px solid ${tokens.line}`, borderRadius: 1, bgcolor: tokens.surfaceRaised }} />
          ) : (
            <Box component="img" src={preview} alt={`${label} preview`} sx={{ display: 'block', maxWidth: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 1, border: `1px solid ${tokens.line}`, bgcolor: tokens.surfaceRaised }} />
          )}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            {currentUrl && (
              <Typography component="a" href={currentUrl} target="_blank" rel="noreferrer" variant="caption" sx={{ color: tokens.goldText, fontWeight: 600 }}>
                Open saved file
              </Typography>
            )}
            {file && (
              <Button size="small" onClick={onClear} disabled={removing} sx={{ bgcolor: tokens.surfaceAlt, color: tokens.text, border: `1px solid ${tokens.line}`, '&:hover': { bgcolor: tokens.surfaceRaised, color: tokens.text, border: `1px solid ${tokens.lineStrong}` } }}>
                Clear
              </Button>
            )}
            {currentUrl && onRemove && (
              <Button size="small" onClick={onRemove} disabled={removing} sx={{ bgcolor: tokens.surfaceAlt, color: tokens.dangerText, border: `1px solid ${tokens.line}`, '&:hover': { bgcolor: tokens.surfaceRaised, color: tokens.dangerText, border: `1px solid ${tokens.lineStrong}` } }}>
                {removing ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

const quietButton = {
  bgcolor: tokens.surfaceAlt,
  color: tokens.text,
  border: `1px solid ${tokens.line}`,
  '&:hover': { bgcolor: tokens.surfaceRaised, color: tokens.text, border: `1px solid ${tokens.lineStrong}` },
};

const saveButton = {
  bgcolor: tokens.gold,
  color: tokens.black,
  fontWeight: 600,
  '&:hover': { bgcolor: tokens.goldDark, color: tokens.black, border: `1px solid ${tokens.gold}` },
};

export const VendorFormPage: React.FC = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<VendorDraft>(blankDraft);
  const [files, setFiles] = useState<VendorFiles>(blankFiles);
  const [localError, setLocalError] = useState('');
  const [pendingRemove, setPendingRemove] = useState<{ kind: VendorDocumentKind; label: string } | null>(null);
  const [confirmError, setConfirmError] = useState('');
  const loadedId = useRef<string | null>(null);

  const { data, isPending, error } = useQuery<Vendor[], Error>({
    queryKey: ['vendors'],
    queryFn: getVendors,
  });

  const vendor = vendorId ? (data || EMPTY).find((item) => item._id === vendorId) || null : null;

  useEffect(() => {
    if (!vendorId) {
      loadedId.current = null;
      setDraft(blankDraft());
      setFiles(blankFiles());
      setLocalError('');
      return;
    }
    if (!vendor || loadedId.current === vendor._id) return;
    loadedId.current = vendor._id;
    setDraft(draftFrom(vendor));
    setFiles(blankFiles());
    setLocalError('');
  }, [vendorId, vendor]);

  const saveMutation = useMutation({
    mutationFn: ({ id, nextDraft, nextFiles }: { id?: string; nextDraft: VendorDraft; nextFiles: VendorFiles }) =>
      id ? updateVendor(id, bodyFrom(nextDraft, nextFiles)) : createVendor(bodyFrom(nextDraft, nextFiles)),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success(id ? 'Vendor updated' : 'Vendor added');
      navigate('/vendors');
    },
    onError: (saveError) => setLocalError(apiMessage(saveError)),
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: VendorDocumentKind }) => removeVendorDocument(id, kind),
    onSuccess: (updated: Vendor) => {
      queryClient.setQueryData<Vendor[]>(['vendors'], (current) =>
        (current || []).map((item) => (item._id === updated._id ? { ...item, ...updated } : item)),
      );
      setPendingRemove(null);
      setConfirmError('');
      toast.success('Document removed');
    },
    onError: (removeError) => setConfirmError(apiMessage(removeError)),
  });

  const set = (field: keyof VendorDraft) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = () => {
    if (!draft.companyName.trim() || !draft.contactName.trim() || !draft.phone.trim() || !draft.industry.trim()) {
      setLocalError('Company, contact, phone, and industry are required.');
      return;
    }
    if (draft.gstNumber.trim() && !GST_PATTERN.test(draft.gstNumber.trim())) {
      setLocalError('Enter a valid 15-character GST number.');
      return;
    }
    if (draft.yearOfIncorporation.trim()) {
      const year = Number(draft.yearOfIncorporation.trim());
      if (!YEAR_PATTERN.test(draft.yearOfIncorporation.trim()) || year > THIS_YEAR) {
        setLocalError('Enter a 4-digit year of incorporation.');
        return;
      }
    }
    if (draft.panNumber.trim() && !PAN_PATTERN.test(draft.panNumber.trim())) {
      setLocalError('Enter a valid 10-character PAN number.');
      return;
    }
    setLocalError('');
    saveMutation.mutate({ id: vendor?._id, nextDraft: draft, nextFiles: files });
  };

  if (vendorId && isPending) {
    return (
      <Box>
        <PageHeader
          title="Edit vendor"
          description="Company details, GST/PAN and documents for the vendor list."
          crumbs={[{ label: 'Vendor List', to: '/vendors' }, { label: 'Edit vendor' }]}
        />
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <PageSkeleton />
        </Paper>
      </Box>
    );
  }

  if (vendorId && (error || !vendor)) {
    return (
      <Box>
        <PageHeader
          title="Edit vendor"
          description="Company details, GST/PAN and documents for the vendor list."
          crumbs={[{ label: 'Vendor List', to: '/vendors' }, { label: 'Edit vendor' }]}
        />
        <Paper sx={{ borderRadius: 3 }}>
          <EmptyState
            icon={StorefrontOutlined}
            title="Vendor not found"
            description="This vendor is not on the vendor list."
            actionLabel="Back to vendor list"
            onAction={() => navigate('/vendors')}
          />
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={vendor ? 'Edit vendor' : 'Add vendor'}
        description="Company details, GST/PAN and documents for the vendor list."
        crumbs={[
          { label: 'Vendor List', to: '/vendors' },
          { label: vendor ? 'Edit vendor' : 'Add vendor' },
        ]}
        actions={
          <Button onClick={submit} disabled={saveMutation.isPending} sx={saveButton}>
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        }
      />

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, boxShadow: tokens.shadowSoft }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {vendor?.replacedNote && (
            <Typography variant="body2" color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
              Changing the company or contact keeps the previous name on this row. {vendor.replacedNote}.
            </Typography>
          )}
          <TextField label="Company" value={draft.companyName} onChange={set('companyName')} required fullWidth />
          <TextField label="Contact person" value={draft.contactName} onChange={set('contactName')} required fullWidth />
          <TextField label="Phone" value={draft.phone} onChange={set('phone')} required fullWidth />
          <TextField label="Email" value={draft.email} onChange={set('email')} type="email" fullWidth />
          <TextField label="City" value={draft.city} onChange={set('city')} fullWidth />
          <TextField label="Year of incorporation" value={draft.yearOfIncorporation} onChange={set('yearOfIncorporation')} fullWidth inputProps={{ maxLength: 4, inputMode: 'numeric' }} helperText="4-digit year, e.g. 2014." />
          <TextField label="Their office location" value={draft.officeLocation} onChange={set('officeLocation')} fullWidth multiline minRows={2} sx={{ gridColumn: '1 / -1' }} helperText="The vendor's street, area, and city — not Team RW." />
          <TextField label="Industry" value={draft.industry} onChange={set('industry')} required fullWidth helperText="Type the industry. It becomes a filter on the sheet." />
          <TextField label="Website / portfolio" value={draft.websiteUrl} onChange={set('websiteUrl')} fullWidth sx={{ gridColumn: '1 / -1' }} helperText="Company site, Behance, Drive folder, or portfolio link." />
          <TextField label="What they supply" value={draft.note} onChange={set('note')} fullWidth multiline minRows={2} sx={{ gridColumn: '1 / -1' }} />
          <TextField label="Feedback / notes" value={draft.feedback} onChange={set('feedback')} fullWidth multiline minRows={2} sx={{ gridColumn: '1 / -1' }} helperText="Call notes and outreach status from the vendor list." />
          <TextField label="GST number" value={draft.gstNumber} onChange={set('gstNumber')} fullWidth inputProps={{ maxLength: 15 }} helperText="15 characters. A GST certificate file is not required." />
          <TextField label="PAN number" value={draft.panNumber} onChange={set('panNumber')} fullWidth inputProps={{ maxLength: 10 }} helperText="10 characters. A PAN card file is not required." />
          <Box sx={{ minWidth: 0 }}>
            <DocumentDrop
              label="Cancelled cheque"
              file={files.cancelledCheque}
              currentUrl={vendor?.cancelledChequeUrl}
              removing={removeMutation.isPending}
              onFile={(next) => setFiles((current) => ({ ...current, cancelledCheque: next }))}
              onReject={(message) => { if (message) setLocalError(message); }}
              onClear={() => setFiles((current) => ({ ...current, cancelledCheque: null }))}
              onRemove={vendor?.cancelledChequeUrl ? () => { setConfirmError(''); setPendingRemove({ kind: 'cheque', label: 'cancelled cheque' }); } : undefined}
            />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <DocumentDrop
              label="Brochure"
              file={files.brochure}
              currentUrl={vendor?.brochureUrl}
              removing={removeMutation.isPending}
              onFile={(next) => setFiles((current) => ({ ...current, brochure: next }))}
              onReject={(message) => { if (message) setLocalError(message); }}
              onClear={() => setFiles((current) => ({ ...current, brochure: null }))}
              onRemove={vendor?.brochureUrl ? () => { setConfirmError(''); setPendingRemove({ kind: 'brochure', label: 'brochure' }); } : undefined}
            />
          </Box>
          <TextField select label="Status" value={draft.status} onChange={set('status')} fullWidth>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
          </TextField>
        </Box>
        {(localError || (error && !vendorId)) && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>{localError || 'Unable to load the vendor list. Please try again.'}</Typography>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
          <Button onClick={() => navigate('/vendors')} disabled={saveMutation.isPending} sx={quietButton}>Cancel</Button>
          <Button onClick={submit} disabled={saveMutation.isPending} sx={saveButton}>{saveMutation.isPending ? 'Saving...' : 'Save'}</Button>
        </Box>
      </Paper>

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remove this document?"
        description={`The ${pendingRemove?.label || 'document'} will be removed from this vendor and from storage.`}
        confirmLabel="Delete"
        tone="danger"
        loading={removeMutation.isPending}
        confirmDisabled={!pendingRemove || !vendor}
        onConfirm={() => { if (pendingRemove && vendor) removeMutation.mutate({ id: vendor._id, kind: pendingRemove.kind }); }}
        onClose={() => { if (!removeMutation.isPending) { setPendingRemove(null); setConfirmError(''); } }}
      >
        {confirmError && <Typography color="error" variant="body2" sx={{ mt: 1.5 }}>{confirmError}</Typography>}
      </ConfirmDialog>
    </Box>
  );
};

export default Vendors;

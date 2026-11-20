import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
  InputAdornment,
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
import { PersonAddAlt1, Search } from '@mui/icons-material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  approveEmployeeDocument,
  approveEmployeePackage,
  createEmployee,
  deleteEmployeeDocument,
  fetchEmployeeDocumentBlob,
  getEmployeeDocuments,
  getEmployeePackageReview,
  getEmployees,
  rejectEmployeeDocument,
  returnEmployeePackage,
  sendEmployeeInvitation,
  startEmployeePackageReview,
  type CreateEmployeeInput,
  type EmployeePackageReview,
  type EmployeeRecord,
  type JoinDocumentItem,
  type JoinDocumentsChecklist,
} from '../../api/services';
import PageHeader from '../../Components/PageHeader';
import ConfirmDialog from '../../Components/ConfirmDialog';
import EmptyState from '../../Components/EmptyState';
import { useTableSort, SortableHeadCell, type SortAccessors } from '../../Components/TableSort';
import { tokens } from '../../Theme/tokens';

const EMPTY_FORM: CreateEmployeeInput = {
  firstName: '',
  lastName: '',
  personalEmail: '',
  phone: '',
  designation: '',
  department: '',
  joiningDate: '',
};

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

type FormErrors = Partial<Record<keyof CreateEmployeeInput, string>>;

const EMPLOYEE_SORT: SortAccessors<EmployeeRecord> = {
  employeeId: (employee) => employee.employeeCode || '',
  name: (employee) => `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
  email: (employee) => employee.personalEmail || '',
  phone: (employee) => employee.phone || '',
  designation: (employee) => employee.designation || '',
  department: (employee) => employee.department || '',
  joiningDate: (employee) => employee.joiningDate || '',
  onboarding: (employee) => employee.onboardingStatus || '',
};

const ROWS_PER_PAGE = 10;

const validate = (form: CreateEmployeeInput): FormErrors => {
  const errors: FormErrors = {};
  if (!form.firstName.trim()) errors.firstName = 'First name is required';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required';
  if (!form.personalEmail.trim()) errors.personalEmail = 'Email is required';
  else if (!EMAIL_PATTERN.test(form.personalEmail.trim())) errors.personalEmail = 'Enter a valid email';
  if (!form.phone.trim()) errors.phone = 'Phone is required';
  else if (form.phone.trim().length > 40) errors.phone = 'Phone is too long';
  if (!form.designation.trim()) errors.designation = 'Designation is required';
  if (!form.department.trim()) errors.department = 'Department is required';
  if (!form.joiningDate) errors.joiningDate = 'Joining date is required';
  return errors;
};

const errorMessage = (error: any): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message || 'Something went wrong. Please try again.';
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

const fields: { key: keyof CreateEmployeeInput; label: string; type?: string }[] = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'personalEmail', label: 'Personal email', type: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'designation', label: 'Designation' },
  { key: 'department', label: 'Department' },
  { key: 'joiningDate', label: 'Joining date', type: 'date' },
];

const isImageMime = (mime: string) => mime.startsWith('image/');
const isPdfMime = (mime: string) => mime === 'application/pdf' || mime.includes('pdf');

const statusChipColor = (status: string): 'default' | 'success' | 'warning' | 'info' | 'error' => {
  if (status === 'Approved' || status === 'Locked') return 'success';
  if (status === 'Re-upload Required') return 'warning';
  if (status === 'Missing') return 'default';
  return 'info';
};

const HrDocumentRow = ({
  employeeId,
  doc,
  onChanged,
}: {
  employeeId: string;
  doc: JoinDocumentItem;
  onChanged: (checklist: JoinDocumentsChecklist) => void;
}) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewMime, setPreviewMime] = useState(doc.mimeType || '');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState('');
  const hasFile = (doc.sizeBytes || 0) > 0 && Boolean(doc.mimeType);
  const canReview =
    hasFile &&
    doc.status !== 'Approved' &&
    doc.status !== 'Locked' &&
    doc.status !== 'Re-upload Required';
  const canDelete =
    (hasFile || doc.status === 'Re-upload Required') &&
    doc.status !== 'Approved' &&
    doc.status !== 'Locked';

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    if (!hasFile) {
      setPreviewUrl('');
      return undefined;
    }
    fetchEmployeeDocumentBlob(employeeId, doc.documentType)
      .then(({ blob, mimeType }) => {
        const url = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPreviewUrl(url);
        setPreviewMime(mimeType || doc.mimeType || blob.type || '');
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl('');
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [employeeId, doc.documentType, doc.version, doc.status, doc.mimeType, hasFile]);

  const approveMutation = useMutation({
    mutationFn: () => approveEmployeeDocument(employeeId, doc.documentType),
    onSuccess: (checklist) => {
      toast.success(`${doc.label} approved`);
      onChanged(checklist);
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectEmployeeDocument(employeeId, doc.documentType, reason.trim()),
    onSuccess: (checklist) => {
      toast.success(`${doc.label} sent back for re-upload`);
      setRejectOpen(false);
      setReason('');
      onChanged(checklist);
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEmployeeDocument(employeeId, doc.documentType),
    onSuccess: (checklist) => {
      toast.success(`${doc.label} deleted from storage`);
      setDeleteOpen(false);
      onChanged(checklist);
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Box
          sx={{
            width: { xs: '100%', md: 120 },
            minHeight: 96,
            borderRadius: 1.5,
            border: '1px dashed',
            borderColor: tokens.border,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            bgcolor: tokens.surfaceAlt,
          }}
        >
          {!hasFile && (
            <Typography variant="caption" color="text.secondary">
              Missing
            </Typography>
          )}
          {hasFile && previewUrl && isImageMime(previewMime) && (
            <Box
              component="img"
              src={previewUrl}
              alt={`${doc.label} preview`}
              sx={{ width: '100%', height: 96, objectFit: 'cover' }}
            />
          )}
          {hasFile && previewUrl && isPdfMime(previewMime) && (
            <PictureAsPdfOutlinedIcon color="error" aria-hidden="true" />
          )}
          {hasFile && !previewUrl && <CircularProgress size={20} />}
        </Box>

        <Stack spacing={1} flex={1}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography fontWeight={700}>{doc.label}</Typography>
            <Chip size="small" color={statusChipColor(doc.status)} label={doc.status} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {hasFile
              ? `${doc.originalFileName || 'File'}${doc.version ? ` · v${doc.version}` : ''}`
              : 'Candidate has not uploaded this file yet'}
          </Typography>
          {doc.rejectionReason && (
            <Alert severity="warning">Last rejection: {doc.rejectionReason}</Alert>
          )}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {hasFile && previewUrl && (
              <Tooltip title="Open a larger preview of this file">
                <Button size="small" variant="outlined" onClick={() => setPreviewOpen(true)}>
                  Open
                </Button>
              </Tooltip>
            )}
            {canReview && (
              <Tooltip title="Accept this document. Needed before onboarding can be approved.">
                <span>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate()}
                  >
                    {approveMutation.isPending ? 'Saving…' : 'Approve'}
                  </Button>
                </span>
              </Tooltip>
            )}
            {canReview && (
              <Tooltip title="Reject this one file, delete it from storage, and ask the candidate to upload again.">
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => setRejectOpen(true)}
                >
                  Reject
                </Button>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title="Remove this file from the record and delete it from storage.">
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Stack>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{doc.label}</DialogTitle>
        <DialogContent dividers>
          {previewUrl && isImageMime(previewMime) && (
            <Box
              component="img"
              src={previewUrl}
              alt={`${doc.label} full preview`}
              sx={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', mx: 'auto' }}
            />
          )}
          {previewUrl && isPdfMime(previewMime) && (
            <Box
              component="iframe"
              title={`${doc.label} PDF`}
              src={previewUrl}
              sx={{ width: '100%', height: '70vh', border: 0 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={rejectOpen}
        title={`Reject ${doc.label}?`}
        confirmLabel="Confirm reject and delete file"
        tone="danger"
        loading={rejectMutation.isPending}
        confirmDisabled={reason.trim().length < 3}
        onConfirm={() => rejectMutation.mutate()}
        onClose={() => setRejectOpen(false)}
      >
        <Alert severity="warning" sx={{ mb: 2 }}>
          The current file will be deleted from storage. The candidate must upload a new one.
        </Alert>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          label="Reason for the candidate"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          helperText="Explain what to fix. The candidate will see this on the joining form."
          sx={{ mt: 1 }}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${doc.label}?`}
        description="This removes the file from the joining record and deletes it from storage. This cannot be undone."
        confirmLabel="Delete file"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => setDeleteOpen(false)}
      />
    </Paper>
  );
};

const DocumentReviewDialog = ({
  employee,
  open,
  onClose,
}: {
  employee: EmployeeRecord | null;
  open: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const employeeId = employee?._id || '';

  const docsQuery = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: () => getEmployeeDocuments(employeeId),
    enabled: open && Boolean(employeeId),
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Documents
        {employee ? ` · ${employee.firstName} ${employee.lastName}` : ''}
      </DialogTitle>
      <Divider />
      <DialogContent>
        {docsQuery.isPending && (
          <Stack alignItems="center" py={4}>
            <CircularProgress size={28} />
          </Stack>
        )}
        {docsQuery.error && (
          <Alert severity="error">{errorMessage(docsQuery.error)}</Alert>
        )}
        {docsQuery.data && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" fontWeight={600} role="status" aria-atomic="true">
              {docsQuery.data.uploadedCount} ready for review · {docsQuery.data.approvedCount ?? 0}{' '}
              approved · {docsQuery.data.requiredCount} required
            </Typography>
            {docsQuery.data.documents.map((doc) => (
              <HrDocumentRow
                key={`${doc.documentType}-${doc.version}-${doc.status}`}
                employeeId={employeeId}
                doc={doc}
                onChanged={(checklist) => {
                  queryClient.setQueryData(['employee-documents', employeeId], checklist);
                  queryClient.invalidateQueries({ queryKey: ['employees'] });
                  queryClient.invalidateQueries({ queryKey: ['employee-package-review', employeeId] });
                }}
              />
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const PackageReviewDialog = ({
  employee,
  open,
  onClose,
}: {
  employee: EmployeeRecord | null;
  open: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const employeeId = employee?._id || '';
  const [returnReason, setReturnReason] = useState('');
  const [returnOpen, setReturnOpen] = useState(false);

  const reviewQuery = useQuery({
    queryKey: ['employee-package-review', employeeId],
    queryFn: () => getEmployeePackageReview(employeeId),
    enabled: open && Boolean(employeeId),
  });

  const applyReview = (data: EmployeePackageReview) => {
    queryClient.setQueryData(['employee-package-review', employeeId], data);
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  const startMutation = useMutation({
    mutationFn: () => startEmployeePackageReview(employeeId),
    onSuccess: (data) => {
      toast.success('Onboarding review started');
      applyReview(data);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveEmployeePackage(employeeId),
    onSuccess: (data) => {
      toast.success('Onboarding approved');
      applyReview(data);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const returnMutation = useMutation({
    mutationFn: () => returnEmployeePackage(employeeId, returnReason.trim()),
    onSuccess: (data) => {
      toast.success('Onboarding sent back for corrections');
      setReturnOpen(false);
      setReturnReason('');
      applyReview(data);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const review = reviewQuery.data;

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>
          Onboarding review
          {employee ? ` · ${employee.firstName} ${employee.lastName}` : ''}
        </DialogTitle>
        <Divider />
        <DialogContent>
          {reviewQuery.isPending && (
            <Stack alignItems="center" py={4}>
              <CircularProgress size={28} />
            </Stack>
          )}
          {reviewQuery.error && (
            <Alert severity="error">{errorMessage(reviewQuery.error)}</Alert>
          )}
          {review && (
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={review.onboardingStatus} color="info" size="small" />
                {review.packageSubmittedAt && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Submitted ${formatDate(review.packageSubmittedAt)}`}
                  />
                )}
              </Stack>

              {review.packageCorrectionReason && (
                <Alert severity="warning">Last return reason: {review.packageCorrectionReason}</Alert>
              )}

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Form summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phone {review.form.phone || '-'} · Emergency {review.form.emergencyContactName || '-'}{' '}
                  ({review.form.emergencyContactPhone || '-'})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Education {review.form.educationCount} ·{' '}
                  {review.form.isFresher
                    ? 'Fresher'
                    : `Work history ${review.form.previousEmploymentCount}`}{' '}
                  · References {review.form.referencesCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bank {review.form.bankName || '-'} · IFSC {review.form.bankIfsc || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Address: {review.form.currentAddress || '-'}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Documents
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  {review.documents.approvedCount} of {review.documents.requiredCount} approved ·{' '}
                  {review.documents.uploadedCount} uploaded
                </Typography>
                {!review.documents.allRequiredApproved && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Approve every required file in Documents before completing onboarding.
                  </Typography>
                )}
                <Stack spacing={0.75}>
                  {review.documents.rows.map((row) => (
                    <Stack
                      key={row.documentType}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                    >
                      <Typography variant="body2">{row.label}</Typography>
                      <Chip size="small" color={statusChipColor(row.status)} label={row.status} />
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Policies
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {review.policies.acknowledgedCount} of {review.policies.requiredCount} accepted
                  {review.policies.declarationAccepted
                    ? ' · Declaration accepted'
                    : ' · Declaration pending'}
                </Typography>
                <Stack spacing={0.75}>
                  {review.policies.rows.map((row) => (
                    <Stack
                      key={row.policyId}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2">{row.title}</Typography>
                      <Chip
                        size="small"
                        color={row.acknowledged ? 'success' : 'warning'}
                        label={row.acknowledged ? 'Accepted' : 'Pending'}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Tooltip title="Close this review window">
            <Button onClick={onClose}>Close</Button>
          </Tooltip>
          {review?.canStartReview && (
            <Tooltip title="Mark onboarding as Under Review and email the candidate that HR has started checking it.">
              <span>
                <Button
                  variant="outlined"
                  disabled={startMutation.isPending}
                  onClick={() => startMutation.mutate()}
                >
                  {startMutation.isPending ? 'Starting…' : 'Start review'}
                </Button>
              </span>
            </Tooltip>
          )}
          {review?.canReturn && (
            <Tooltip title="Return onboarding to the candidate for corrections. You will add a reason, and they can fix and submit again.">
              <Button color="warning" variant="outlined" onClick={() => setReturnOpen(true)}>
                Send back
              </Button>
            </Tooltip>
          )}
          {review && (review.canApprove || review.onboardingStatus === 'Under Review' || review.onboardingStatus === 'Submitted') && (
            <Tooltip
              title={
                review.canApprove
                  ? 'Approve onboarding after all required documents are approved. The candidate is emailed that onboarding is complete.'
                  : 'Approve every required document in Documents first, then you can approve onboarding.'
              }
            >
              <span>
                <Button
                  variant="contained"
                  disabled={!review.canApprove || approveMutation.isPending}
                  onClick={() => approveMutation.mutate()}
                  sx={{ bgcolor: tokens.gold, color: tokens.black, '&:hover': { bgcolor: tokens.goldDark } }}
                >
                  {approveMutation.isPending ? 'Saving…' : 'Approve onboarding'}
                </Button>
              </span>
            </Tooltip>
          )}
          {review?.onboardingStatus === 'Completed' && (
            <Chip color="success" label="Onboarding completed" />
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={returnOpen}
        title="Send onboarding back for corrections"
        confirmLabel="Send back"
        loading={returnMutation.isPending}
        confirmDisabled={returnReason.trim().length < 3}
        onConfirm={() => returnMutation.mutate()}
        onClose={() => setReturnOpen(false)}
      >
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          label="Reason for the candidate"
          value={returnReason}
          onChange={(event) => setReturnReason(event.target.value)}
          sx={{ mt: 1 }}
        />
      </ConfirmDialog>
    </>
  );
};

const Employees: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [reviewEmployee, setReviewEmployee] = useState<EmployeeRecord | null>(null);
  const [packageEmployee, setPackageEmployee] = useState<EmployeeRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [onboardingFilter, setOnboardingFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isPending, error, refetch } = useQuery<EmployeeRecord[], Error>({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const inviteMutation = useMutation({
    mutationFn: sendEmployeeInvitation,
    onSuccess: (response: any) => {
      toast.success(response?.data?.message ?? 'Invitation sent');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (requestError: any) => toast.error(errorMessage(requestError)),
  });

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      toast.success('Employee created');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (requestError: any) => toast.error(errorMessage(requestError)),
  });

  const rows = data ?? [];
  const onboardingOptions = useMemo(
    () => Array.from(new Set(rows.map((employee) => employee.onboardingStatus).filter(Boolean))),
    [rows],
  );
  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((employee) => {
      if (onboardingFilter !== 'all' && employee.onboardingStatus !== onboardingFilter) return false;
      if (!query) return true;
      return [
        employee.employeeCode,
        employee.firstName,
        employee.lastName,
        employee.personalEmail,
        employee.phone,
        employee.designation,
        employee.department,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [rows, searchText, onboardingFilter]);
  const { sorted, order, orderBy, toggle: toggleSort } = useTableSort(filteredRows, EMPLOYEE_SORT);
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const visibleRows = sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const updateField = (field: keyof CreateEmployeeInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submitCreate = () => {
    const errors = validate(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    createMutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      personalEmail: form.personalEmail.trim(),
      phone: form.phone.trim(),
      designation: form.designation.trim(),
      department: form.department.trim(),
      joiningDate: form.joiningDate,
    });
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
      <Paper sx={{ p: 4, m: 2, borderRadius: 3 }}>
        <Typography color="error" sx={{ mb: 2 }}>
          Unable to load employees. Please try again.
        </Typography>
        <Button variant="outlined" onClick={() => refetch()}>
          Try again
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <PageHeader
        title="Employees"
        description="Create a draft employee record. Review documents and full onboarding from each row."
        crumbs={[{ label: 'Employees' }]}
        actions={
          <>
            <Chip label={`${rows.length} total`} sx={{ bgcolor: tokens.goldSoft, color: tokens.goldText, fontWeight: 600 }} />
            <Button
              onClick={() => {
                setForm(EMPTY_FORM);
                setFormErrors({});
                setCreateOpen(true);
              }}
              startIcon={<PersonAddAlt1 />}
              variant="contained"
            >
              Add employee
            </Button>
          </>
        }
      />

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: tokens.shadowSoft }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search name, email, code, or designation"
            size="small"
            sx={{ width: { xs: '100%', sm: 340 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: tokens.textMuted }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="employees-onboarding-filter">Onboarding status</InputLabel>
            <Select
              labelId="employees-onboarding-filter"
              label="Onboarding status"
              value={onboardingFilter}
              onChange={(event) => {
                setOnboardingFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              {onboardingOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {filteredRows.length} of {rows.length} employees
          </Typography>
        </Box>
        <Divider />
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <SortableHeadCell label="Employee ID" sortKey="employeeId" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} />
                <SortableHeadCell label="Name" sortKey="name" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} />
                <SortableHeadCell label="Email" sortKey="email" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <SortableHeadCell label="Phone" sortKey="phone" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} />
                <SortableHeadCell label="Designation" sortKey="designation" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <SortableHeadCell label="Department" sortKey="department" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <SortableHeadCell label="Joining date" sortKey="joiningDate" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} />
                <SortableHeadCell label="Onboarding" sortKey="onboarding" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, whiteSpace: 'nowrap', minWidth: 360, pr: 3 }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      icon={PersonAddAlt1}
                      title={rows.length === 0 ? 'No employees yet' : 'No employees found'}
                      description={
                        rows.length === 0
                          ? 'Add the first employee record.'
                          : 'Try a different search or onboarding status.'
                      }
                      actionLabel={rows.length === 0 ? 'Add employee' : undefined}
                      onAction={
                        rows.length === 0
                          ? () => {
                              setForm(EMPTY_FORM);
                              setFormErrors({});
                              setCreateOpen(true);
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((employee) => (
                  <TableRow key={employee._id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{employee.employeeCode}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 140 }}>
                      {`${employee.firstName} ${employee.lastName}`.trim()}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{employee.personalEmail}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{employee.phone}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(employee.joiningDate)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{employee.onboardingStatus}</TableCell>
                    <TableCell align="right" sx={{ minWidth: 360, pr: 3, py: 1.5 }}>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        justifyContent="flex-end"
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Tooltip title="Open and approve or reject each joining document one by one.">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setReviewEmployee(employee)}
                            sx={{
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              textTransform: 'none',
                              fontWeight: 600,
                              borderRadius: 1.5,
                              px: 1.5,
                            }}
                          >
                            Documents
                          </Button>
                        </Tooltip>
                        <Tooltip title="Review full onboarding: form summary, documents, and policies. Start review, send back, or approve.">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setPackageEmployee(employee)}
                            sx={{
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              textTransform: 'none',
                              fontWeight: 600,
                              borderRadius: 1.5,
                              px: 1.5,
                            }}
                          >
                            Review
                          </Button>
                        </Tooltip>
                        <Tooltip title="Email the candidate their personal joining invitation link.">
                          <span>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={inviteMutation.isPending}
                              onClick={() => inviteMutation.mutate(employee._id)}
                              sx={{
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 1.5,
                                px: 1.5,
                                bgcolor: tokens.gold,
                                color: tokens.black,
                                boxShadow: 'none',
                                '&:hover': { bgcolor: tokens.goldDark, boxShadow: 'none' },
                              }}
                            >
                              {inviteMutation.isPending && inviteMutation.variables === employee._id
                                ? 'Sending…'
                                : 'Send invitation'}
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {sorted.length > ROWS_PER_PAGE && (
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

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add employee</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {fields.map((field) => (
              <TextField
                key={field.key}
                label={field.label}
                type={field.type ?? 'text'}
                value={form[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                error={Boolean(formErrors[field.key])}
                helperText={formErrors[field.key] ?? ' '}
                fullWidth
                InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submitCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Saving…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <DocumentReviewDialog
        employee={reviewEmployee}
        open={Boolean(reviewEmployee)}
        onClose={() => setReviewEmployee(null)}
      />
      <PackageReviewDialog
        employee={packageEmployee}
        open={Boolean(packageEmployee)}
        onClose={() => setPackageEmployee(null)}
      />
    </Box>
  );
};

export default Employees;

import React, { useEffect, useState } from 'react';
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
  Paper,
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
import { PersonAddAlt1 } from '@mui/icons-material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  approveEmployeeDocument,
  createEmployee,
  fetchEmployeeDocumentBlob,
  getEmployeeDocuments,
  getEmployees,
  rejectEmployeeDocument,
  sendEmployeeInvitation,
  type CreateEmployeeInput,
  type EmployeeRecord,
  type JoinDocumentItem,
  type JoinDocumentsChecklist,
} from '../../api/services';

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
  const [reason, setReason] = useState('');
  const hasFile = doc.status !== 'Missing';
  const canReview =
    hasFile &&
    doc.status !== 'Approved' &&
    doc.status !== 'Locked' &&
    doc.status !== 'Re-upload Required';

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

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Box
          sx={{
            width: { xs: '100%', md: 120 },
            minHeight: 96,
            borderRadius: 1.5,
            border: '1px dashed',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            bgcolor: 'grey.50',
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
              <Button size="small" variant="outlined" onClick={() => setPreviewOpen(true)}>
                Open
              </Button>
            )}
            {canReview && (
              <Button
                size="small"
                variant="contained"
                color="success"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate()}
              >
                {approveMutation.isPending ? 'Saving…' : 'Approve'}
              </Button>
            )}
            {canReview && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </Button>
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

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject {doc.label}</DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)} disabled={rejectMutation.isPending}>
            Cancel
          </Button>
          <Button
            color="warning"
            variant="contained"
            disabled={rejectMutation.isPending || reason.trim().length < 3}
            onClick={() => rejectMutation.mutate()}
          >
            {rejectMutation.isPending ? 'Saving…' : 'Send for re-upload'}
          </Button>
        </DialogActions>
      </Dialog>
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

const Employees: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [reviewEmployee, setReviewEmployee] = useState<EmployeeRecord | null>(null);
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
            Employees
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a draft employee record. Review uploaded joining documents from each row.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip label={`${rows.length} total`} sx={{ bgcolor: '#e7f1f7', color: '#0f63a5', fontWeight: 600 }} />
          <Button
            onClick={() => {
              setForm(EMPTY_FORM);
              setFormErrors({});
              setCreateOpen(true);
            }}
            startIcon={<PersonAddAlt1 />}
            variant="contained"
            sx={{ borderRadius: 1.5, bgcolor: '#0f63a5', fontWeight: 600, '&:hover': { bgcolor: '#0b4f83' } }}
          >
            Add employee
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 99, 165, 0.08)' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Employee ID</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Joining date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Onboarding</TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, whiteSpace: 'nowrap', minWidth: 280, pr: 3 }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      No employees yet. Add the first record.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((employee) => (
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
                    <TableCell align="right" sx={{ minWidth: 280, pr: 3, py: 1.5 }}>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        justifyContent="flex-end"
                        alignItems="center"
                        flexWrap="nowrap"
                      >
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
                            bgcolor: '#0f63a5',
                            boxShadow: 'none',
                            '&:hover': { bgcolor: '#0b4f83', boxShadow: 'none' },
                          }}
                        >
                          {inviteMutation.isPending && inviteMutation.variables === employee._id
                            ? 'Sending…'
                            : 'Send invitation'}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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
    </Box>
  );
};

export default Employees;

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  deleteEmployeeDocument,
  getEmployeeDocuments,
  getEmployeeForm,
  saveEmployeeForm,
  updateEmployee,
  uploadEmployeeDocument,
  type CreateEmployeeInput,
  type EmployeeRecord,
  type JoinDocumentItem,
  type JoinDocumentsChecklist,
  type JoinEducationRow,
  type JoinEmploymentRow,
  type JoinFormDraft,
  type JoinReferenceRow,
} from '../../api/services';
import { tokens } from '../../Theme/tokens';

const EMPLOYMENT_STATUSES = ['Prejoining', 'Active', 'Inactive', 'Exited'] as const;

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const emptyEducation = (): JoinEducationRow => ({
  qualification: '',
  institution: '',
  yearOfPassing: '',
  percentageOrCgpa: '',
  specialization: '',
});

const emptyEmployment = (): JoinEmploymentRow => ({
  companyName: '',
  designation: '',
  fromDate: '',
  toDate: '',
  lastCtc: '',
  reasonForLeaving: '',
  referenceName: '',
  referencePhone: '',
});

const emptyReference = (): JoinReferenceRow => ({
  name: '',
  relation: '',
  phone: '',
  email: '',
  organization: '',
  designation: '',
  address: '',
  yearsKnown: '',
});

const toDateInputValue = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const errorMessage = (error: any): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message || 'Something went wrong. Please try again.';
};

type RoleForm = CreateEmployeeInput & { employmentStatus: string };

type Props = {
  open: boolean;
  employee: EmployeeRecord | null;
  onClose: () => void;
};

const EmployeeEditDialog: React.FC<Props> = ({ open, employee, onClose }) => {
  const queryClient = useQueryClient();
  const employeeId = employee?._id || '';
  const [tab, setTab] = useState(0);
  const [roleForm, setRoleForm] = useState<RoleForm | null>(null);
  const [roleErrors, setRoleErrors] = useState<Partial<Record<keyof RoleForm, string>>>({});
  const [joinForm, setJoinForm] = useState<JoinFormDraft | null>(null);
  const [uploadingType, setUploadingType] = useState('');

  const formQuery = useQuery({
    queryKey: ['employee-form', employeeId],
    queryFn: () => getEmployeeForm(employeeId),
    enabled: open && Boolean(employeeId),
  });

  const documentsQuery = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: () => getEmployeeDocuments(employeeId),
    enabled: open && Boolean(employeeId),
  });

  useEffect(() => {
    if (!open || !employee) return;
    setTab(0);
    setRoleForm({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      personalEmail: employee.personalEmail || '',
      phone: employee.phone || '',
      designation: employee.designation || '',
      department: employee.department || '',
      joiningDate: toDateInputValue(employee.joiningDate),
      employmentStatus: employee.employmentStatus || 'Prejoining',
    });
    setRoleErrors({});
  }, [open, employee]);

  useEffect(() => {
    if (formQuery.data) setJoinForm(formQuery.data);
  }, [formQuery.data]);

  const roleMutation = useMutation({
    mutationFn: () => {
      if (!employee || !roleForm) throw new Error('Missing employee');
      return updateEmployee(employee._id, {
        firstName: roleForm.firstName.trim(),
        lastName: roleForm.lastName.trim(),
        personalEmail: roleForm.personalEmail.trim(),
        phone: roleForm.phone.trim(),
        designation: roleForm.designation.trim(),
        department: roleForm.department.trim(),
        joiningDate: roleForm.joiningDate,
        employmentStatus: roleForm.employmentStatus,
      });
    },
    onSuccess: () => {
      toast.success('Role details saved');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const formMutation = useMutation({
    mutationFn: () => {
      if (!employee || !joinForm) throw new Error('Missing form');
      const {
        firstName: _f,
        lastName: _l,
        personalEmail: _e,
        personalSectionSavedAt: _p,
        formDraftSavedAt: _d,
        onboardingStatus: _o,
        joinCompletedSteps: _steps,
        joinStepTotal: _total,
        ...payload
      } = joinForm;
      return saveEmployeeForm(employee._id, payload);
    },
    onSuccess: (saved) => {
      toast.success('Joining form saved');
      setJoinForm(saved);
      queryClient.invalidateQueries({ queryKey: ['employee-form', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ documentType, file }: { documentType: string; file: File }) =>
      uploadEmployeeDocument(employeeId, documentType, file),
    onSuccess: (checklist) => {
      toast.success('Document uploaded');
      setUploadingType('');
      queryClient.setQueryData(['employee-documents', employeeId], checklist);
    },
    onError: (error: any) => {
      setUploadingType('');
      toast.error(errorMessage(error));
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (documentType: string) => deleteEmployeeDocument(employeeId, documentType),
    onSuccess: (checklist) => {
      toast.success('Document removed');
      queryClient.setQueryData(['employee-documents', employeeId], checklist);
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const roleFields: { key: keyof CreateEmployeeInput; label: string; type?: string }[] = [
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'personalEmail', label: 'Personal email', type: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department' },
    { key: 'joiningDate', label: 'Joining date', type: 'date' },
  ];

  const joinScalarFields: { key: keyof JoinFormDraft; label: string; type?: string; multiline?: boolean }[] =
    useMemo(
      () => [
        { key: 'phone', label: 'Phone' },
        { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
        { key: 'gender', label: 'Gender' },
        { key: 'alternatePhone', label: 'Alternate phone' },
        { key: 'fatherName', label: 'Father name' },
        { key: 'motherName', label: 'Mother name' },
        { key: 'maritalStatus', label: 'Marital status' },
        { key: 'spouseName', label: 'Spouse name' },
        { key: 'bloodGroup', label: 'Blood group' },
        { key: 'nationality', label: 'Nationality' },
        { key: 'currentCity', label: 'Current city' },
        { key: 'hometown', label: 'Hometown' },
        { key: 'languagesKnown', label: 'Languages known' },
        { key: 'totalExperienceYears', label: 'Total experience (years)' },
        { key: 'noticePeriodDays', label: 'Notice period (days)' },
        { key: 'passportNumber', label: 'Passport number' },
        { key: 'drivingLicenseNumber', label: 'Driving licence' },
        { key: 'uanNumber', label: 'UAN' },
        { key: 'pfNumber', label: 'PF number' },
        { key: 'esiNumber', label: 'ESI number' },
        { key: 'linkedInUrl', label: 'LinkedIn URL' },
        { key: 'currentAddress', label: 'Current address', multiline: true },
        { key: 'permanentAddress', label: 'Permanent address', multiline: true },
        { key: 'emergencyContactName', label: 'Emergency contact name' },
        { key: 'emergencyContactPhone', label: 'Emergency contact phone' },
        { key: 'emergencyContactRelation', label: 'Emergency contact relation' },
        { key: 'bankAccountHolderName', label: 'Account holder name' },
        { key: 'bankName', label: 'Bank name' },
        { key: 'bankAccountNumber', label: 'Account number' },
        { key: 'bankIfsc', label: 'IFSC' },
        { key: 'bankBranch', label: 'Branch' },
      ],
      [],
    );

  const saveRole = () => {
    if (!roleForm) return;
    const errors: Partial<Record<keyof RoleForm, string>> = {};
    if (!roleForm.firstName.trim()) errors.firstName = 'Required';
    if (!roleForm.lastName.trim()) errors.lastName = 'Required';
    if (!roleForm.personalEmail.trim()) errors.personalEmail = 'Required';
    else if (!EMAIL_PATTERN.test(roleForm.personalEmail.trim())) errors.personalEmail = 'Invalid email';
    if (!roleForm.phone.trim()) errors.phone = 'Required';
    if (!roleForm.designation.trim()) errors.designation = 'Required';
    if (!roleForm.department.trim()) errors.department = 'Required';
    if (!roleForm.joiningDate) errors.joiningDate = 'Required';
    setRoleErrors(errors);
    if (Object.keys(errors).length > 0) return;
    roleMutation.mutate();
  };

  const updateJoinField = (key: keyof JoinFormDraft, value: string | boolean) => {
    setJoinForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const documents: JoinDocumentItem[] = (documentsQuery.data as JoinDocumentsChecklist | undefined)?.documents || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      disableScrollLock
      // Keep typing available even if a parent menu/popper was just closed.
      disableRestoreFocus
    >
      <DialogTitle>
        Edit employee
        {employee ? (
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {employee.employeeCode}
          </Typography>
        ) : null}
      </DialogTitle>
      <Divider />
      <Tabs
        value={tab}
        onChange={(_, next) => setTab(next)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ px: 2, borderBottom: `1px solid ${tokens.border}` }}
      >
        <Tab label="Role details" />
        <Tab label="Joining form" />
        <Tab label="Documents" />
      </Tabs>
      <DialogContent sx={{ pt: 2, minHeight: 420 }}>
        {!employee || !roleForm ? (
          <Stack alignItems="center" py={6}>
            <CircularProgress size={28} />
          </Stack>
        ) : null}

        {employee && roleForm && tab === 0 ? (
          <Stack spacing={2}>
            <Alert severity="info">
              Super admin can correct role, contact, and employment status here.
            </Alert>
            <TextField label="Employee ID" value={employee.employeeCode} fullWidth InputProps={{ readOnly: true }} />
            {roleFields.map((field) => (
              <TextField
                key={field.key}
                label={field.label}
                type={field.type ?? 'text'}
                value={roleForm[field.key]}
                onChange={(event) => {
                  setRoleForm((prev) => (prev ? { ...prev, [field.key]: event.target.value } : prev));
                  setRoleErrors((prev) => ({ ...prev, [field.key]: undefined }));
                }}
                error={Boolean(roleErrors[field.key])}
                helperText={roleErrors[field.key] ?? ' '}
                fullWidth
                InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
              />
            ))}
            <FormControl fullWidth>
              <InputLabel id="edit-employment-status">Employment status</InputLabel>
              <Select
                labelId="edit-employment-status"
                label="Employment status"
                value={roleForm.employmentStatus}
                onChange={(event) =>
                  setRoleForm((prev) =>
                    prev ? { ...prev, employmentStatus: event.target.value } : prev,
                  )
                }
                MenuProps={{
                  disableScrollLock: true,
                  slotProps: {
                    backdrop: {
                      invisible: true,
                      sx: { backgroundColor: 'transparent', opacity: 1 },
                    },
                  },
                }}
              >
                {EMPLOYMENT_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        ) : null}

        {employee && tab === 1 ? (
          formQuery.isPending && !joinForm ? (
            <Stack alignItems="center" py={6}>
              <CircularProgress size={28} />
            </Stack>
          ) : formQuery.isError && !joinForm ? (
            <Stack spacing={2} py={2}>
              <Alert severity="error">
                {errorMessage(formQuery.error) ||
                  'Could not load the joining form. Restart the API if this route is new, then try again.'}
              </Alert>
              <Button variant="outlined" onClick={() => formQuery.refetch()}>
                Retry
              </Button>
            </Stack>
          ) : !joinForm ? (
            <Stack alignItems="center" py={6}>
              <CircularProgress size={28} />
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Alert severity="info">
                Update any joining form answer the candidate submitted. Mark fresher to skip relieving
                and experience letters.
              </Alert>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(joinForm.isFresher)}
                    onChange={(event) => updateJoinField('isFresher', event.target.checked)}
                  />
                }
                label="Fresher (no prior employment letters required)"
              />
              <Grid container spacing={2}>
                {joinScalarFields.map((field) => (
                  <Grid item xs={12} sm={field.multiline ? 12 : 6} key={String(field.key)}>
                    <TextField
                      label={field.label}
                      type={field.type ?? 'text'}
                      value={String(joinForm[field.key] ?? '')}
                      onChange={(event) => updateJoinField(field.key, event.target.value)}
                      fullWidth
                      multiline={field.multiline}
                      minRows={field.multiline ? 2 : undefined}
                      InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography fontWeight={700} sx={{ pt: 1 }}>
                Education
              </Typography>
              {(joinForm.education || []).map((row, index) => (
                <PaperRow
                  key={`edu-${index}`}
                  title={`Education ${index + 1}`}
                  onRemove={() =>
                    setJoinForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            education: prev.education.filter((_, i) => i !== index),
                          }
                        : prev,
                    )
                  }
                >
                  <Grid container spacing={1.5}>
                    {(
                      [
                        ['qualification', 'Qualification'],
                        ['institution', 'Institution'],
                        ['yearOfPassing', 'Year'],
                        ['percentageOrCgpa', 'Percentage / CGPA'],
                        ['specialization', 'Specialization'],
                      ] as const
                    ).map(([key, label]) => (
                      <Grid item xs={12} sm={6} key={key}>
                        <TextField
                          label={label}
                          value={row[key]}
                          fullWidth
                          size="small"
                          onChange={(event) =>
                            setJoinForm((prev) => {
                              if (!prev) return prev;
                              const education = [...prev.education];
                              education[index] = { ...education[index], [key]: event.target.value };
                              return { ...prev, education };
                            })
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </PaperRow>
              ))}
              <Button
                size="small"
                onClick={() =>
                  setJoinForm((prev) =>
                    prev ? { ...prev, education: [...prev.education, emptyEducation()] } : prev,
                  )
                }
              >
                Add education
              </Button>

              {!joinForm.isFresher ? (
                <>
                  <Typography fontWeight={700} sx={{ pt: 1 }}>
                    Previous employment
                  </Typography>
                  {(joinForm.previousEmployment || []).map((row, index) => (
                    <PaperRow
                      key={`job-${index}`}
                      title={`Job ${index + 1}`}
                      onRemove={() =>
                        setJoinForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                previousEmployment: prev.previousEmployment.filter((_, i) => i !== index),
                              }
                            : prev,
                        )
                      }
                    >
                      <Grid container spacing={1.5}>
                        {(
                          [
                            ['companyName', 'Company'],
                            ['designation', 'Designation'],
                            ['fromDate', 'From'],
                            ['toDate', 'To'],
                            ['lastCtc', 'Last CTC'],
                            ['reasonForLeaving', 'Reason for leaving'],
                          ] as const
                        ).map(([key, label]) => (
                          <Grid item xs={12} sm={6} key={key}>
                            <TextField
                              label={label}
                              value={row[key]}
                              fullWidth
                              size="small"
                              onChange={(event) =>
                                setJoinForm((prev) => {
                                  if (!prev) return prev;
                                  const previousEmployment = [...prev.previousEmployment];
                                  previousEmployment[index] = {
                                    ...previousEmployment[index],
                                    [key]: event.target.value,
                                  };
                                  return { ...prev, previousEmployment };
                                })
                              }
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </PaperRow>
                  ))}
                  <Button
                    size="small"
                    onClick={() =>
                      setJoinForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              previousEmployment: [...prev.previousEmployment, emptyEmployment()],
                            }
                          : prev,
                      )
                    }
                  >
                    Add employment
                  </Button>
                </>
              ) : null}

              <Typography fontWeight={700} sx={{ pt: 1 }}>
                References
              </Typography>
              {(joinForm.references || []).map((row, index) => (
                <PaperRow
                  key={`ref-${index}`}
                  title={`Reference ${index + 1}`}
                  onRemove={() =>
                    setJoinForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            references: prev.references.filter((_, i) => i !== index),
                          }
                        : prev,
                    )
                  }
                >
                  <Grid container spacing={1.5}>
                    {(
                      [
                        ['name', 'Name'],
                        ['relation', 'Relation'],
                        ['phone', 'Phone'],
                        ['email', 'Email'],
                        ['organization', 'Organization'],
                        ['designation', 'Designation'],
                        ['yearsKnown', 'Years known'],
                      ] as const
                    ).map(([key, label]) => (
                      <Grid item xs={12} sm={6} key={key}>
                        <TextField
                          label={label}
                          value={row[key]}
                          fullWidth
                          size="small"
                          onChange={(event) =>
                            setJoinForm((prev) => {
                              if (!prev) return prev;
                              const references = [...prev.references];
                              references[index] = { ...references[index], [key]: event.target.value };
                              return { ...prev, references };
                            })
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </PaperRow>
              ))}
              <Button
                size="small"
                onClick={() =>
                  setJoinForm((prev) =>
                    prev ? { ...prev, references: [...prev.references, emptyReference()] } : prev,
                  )
                }
              >
                Add reference
              </Button>
            </Stack>
          )
        ) : null}

        {employee && tab === 2 ? (
          documentsQuery.isPending ? (
            <Stack alignItems="center" py={6}>
              <CircularProgress size={28} />
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Alert severity="info">
                Upload, replace, or delete any joining document, including approved files. Relieving
                and experience letters are required unless the employee is marked fresher.
              </Alert>
              {documents.map((doc) => {
                const busy = uploadingType === doc.documentType && uploadMutation.isPending;
                const hasFile = (doc.sizeBytes || 0) > 0 && Boolean(doc.mimeType);
                return (
                  <Box
                    key={`${doc.documentType}-${doc.version}-${doc.status}`}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${tokens.border}`,
                      bgcolor: tokens.panel,
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ sm: 'center' }}
                    >
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography fontWeight={700}>{doc.label}</Typography>
                          <Chip size="small" label={doc.status} />
                          {doc.required ? <Chip size="small" variant="outlined" label="Required" /> : null}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {hasFile
                            ? `${doc.originalFileName || 'File'}${doc.version ? ` · v${doc.version}` : ''}`
                            : 'No file uploaded yet'}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button
                          size="small"
                          variant="outlined"
                          component="label"
                          disabled={busy}
                        >
                          {busy ? 'Uploading…' : hasFile ? 'Replace file' : 'Upload file'}
                          <input
                            hidden
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = '';
                              if (!file) return;
                              setUploadingType(doc.documentType);
                              uploadMutation.mutate({ documentType: doc.documentType, file });
                            }}
                          />
                        </Button>
                        {hasFile || doc.status === 'Re-upload Required' ? (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            disabled={deleteDocMutation.isPending}
                            onClick={() => deleteDocMutation.mutate(doc.documentType)}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {tab === 0 ? (
          <Button variant="contained" onClick={saveRole} disabled={roleMutation.isPending}>
            {roleMutation.isPending ? 'Saving…' : 'Save role details'}
          </Button>
        ) : null}
        {tab === 1 ? (
          <Button
            variant="contained"
            onClick={() => formMutation.mutate()}
            disabled={formMutation.isPending || !joinForm}
          >
            {formMutation.isPending ? 'Saving…' : 'Save joining form'}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

const PaperRow = ({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) => (
  <Box sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${tokens.border}` }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Button size="small" color="error" onClick={onRemove}>
        Remove
      </Button>
    </Stack>
    {children}
  </Box>
);

export default EmployeeEditDialog;

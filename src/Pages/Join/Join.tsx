import React, { useEffect, useState } from 'react';
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
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import ConfirmDialog from '../../Components/ConfirmDialog';
import { tokens } from '../../Theme/tokens';
import {
  acceptJoinDeclaration,
  acknowledgeJoinPolicy,
  deleteJoinDocument,
  fetchJoinDocumentBlob,
  getJoinDocuments,
  getJoinForm,
  getJoinPolicies,
  getJoinReadiness,
  requestJoinOtp,
  resolveInvitation,
  resumeJoinSession,
  saveJoinForm,
  submitJoinPackage,
  uploadJoinDocument,
  verifyJoinOtp,
  type JoinDocumentItem,
  type JoinEducationRow,
  type JoinEmploymentRow,
  type JoinFormDraft,
  type JoinReferenceRow,
} from '../../api/services';

const JOIN_TOKEN_KEY = 'join_access_token';

/** Team RW join portal palette, mapped to the shared dark theme tokens. */
const JOIN = {
  primary: tokens.gold,
  primaryDark: tokens.goldHover,
  primarySoft: tokens.goldSoft,
  ink: tokens.text,
  muted: tokens.textMuted,
  border: tokens.border,
  bg: tokens.bg,
  card: tokens.panel,
  success: tokens.success,
  warn: tokens.warning,
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: tokens.input,
    borderRadius: 1.5,
    transition: 'box-shadow 180ms ease, border-color 180ms ease',
    '& fieldset': { borderColor: JOIN.border },
    '&:hover fieldset': { borderColor: tokens.border },
    '&.Mui-focused': {
      boxShadow: `0 0 0 3px ${JOIN.primarySoft}`,
    },
    '&.Mui-focused fieldset': { borderColor: JOIN.primary, borderWidth: 1.5 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: JOIN.primary },
};

const cardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: 2.5,
  border: `1px solid ${JOIN.border}`,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
  bgcolor: JOIN.card,
};

const STEPS = [
  'Personal',
  'Professional',
  'Education',
  'Work history',
  'References',
  'Bank',
  'Documents',
  'Policies',
  'NDNC',
  'Review',
];

const NDNC_POLICY_ID = 'confidentiality_ndnc';
const NDNC_SIGNATURE_TYPE = 'ndnc_signature';

const STEP_HELP: Record<string, string> = {
  Personal: 'Your contact and family details for the joining record.',
  Professional: 'Experience and ID numbers used for onboarding checks.',
  Education: 'Add every relevant qualification, starting with the highest.',
  'Work history':
    'List previous jobs from latest to oldest, or mark yourself as a fresher.',
  References: 'Add at least one professional reference (manager, HR, or similar).',
  Bank: 'Salary account details. Double-check IFSC and account number.',
  Documents: 'Upload clear PDF or image files. Preview before you finish.',
  Policies: 'Read each workplace policy in full, then accept it.',
  NDNC:
    'Read the NDNC and confidentiality rules, accept them, upload your signature, then confirm the joining declaration.',
  Review: 'Check that form, documents, and policies are complete, then submit your onboarding once.',
};

const FORM_ISSUE_LABELS: Record<string, string> = {
  phone: 'Phone number',
  dateOfBirth: 'Date of birth',
  gender: 'Gender',
  fatherName: "Father's name",
  motherName: "Mother's name",
  maritalStatus: 'Marital status',
  spouseName: 'Spouse name',
  bloodGroup: 'Blood group',
  nationality: 'Nationality',
  currentCity: 'Current city',
  hometown: 'Hometown',
  languagesKnown: 'Languages known',
  currentAddress: 'Current address',
  permanentAddress: 'Permanent address',
  emergencyContactName: 'Emergency contact name',
  emergencyContactPhone: 'Emergency contact phone',
  emergencyContactRelation: 'Emergency relation',
  totalExperienceYears: 'Total experience',
  noticePeriodDays: 'Notice period',
  education: 'Education with year and marks',
  previousEmployment: 'Work history from latest to oldest, or mark fresher',
  references: 'At least one full professional reference',
  bankAccountHolderName: 'Bank account holder name',
  bankName: 'Bank name',
  bankAccountNumber: 'Bank account number',
  bankIfsc: 'IFSC',
  bankBranch: 'Bank branch',
};

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'];
const MARITAL_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'];
const BLOOD_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const NATIONALITY_OPTIONS = ['Indian', 'Other'];
const RELATION_OPTIONS = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Relative', 'Colleague', 'Other'];
/** Workplace references only (manager, HR, lead, client). */
const REFERENCE_RELATION_OPTIONS = [
  'Reporting manager',
  'Former manager',
  'HR / People team',
  'Team lead / supervisor',
  'Client / business contact',
];
const QUALIFICATION_OPTIONS = [
  '10th',
  '12th',
  'Diploma',
  "Bachelor's",
  "Master's",
  'Doctorate',
  'Professional certification',
  'Other',
];
const NOTICE_OPTIONS = [
  'Immediate',
  '15 days',
  '30 days',
  '45 days',
  '60 days',
  '90 days',
  'Serving notice',
];

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

const emptyForm = {
  phone: '',
  dateOfBirth: '',
  gender: '',
  alternatePhone: '',
  fatherName: '',
  motherName: '',
  maritalStatus: '',
  spouseName: '',
  bloodGroup: '',
  nationality: 'Indian',
  currentCity: '',
  hometown: '',
  languagesKnown: '',
  totalExperienceYears: '',
  noticePeriodDays: '',
  passportNumber: '',
  drivingLicenseNumber: '',
  uanNumber: '',
  pfNumber: '',
  esiNumber: '',
  linkedInUrl: '',
  currentAddress: '',
  permanentAddress: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  education: [emptyEducation()],
  isFresher: false,
  previousEmployment: [emptyEmployment()],
      references: [emptyReference()],
  bankAccountHolderName: '',
  bankName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankBranch: '',
};

const filled = (value?: string | boolean | null) => Boolean(String(value ?? '').trim());

/** Field-key map for inline errors (no long toast lists). */
const collectStepErrors = (
  stepIndex: number,
  form: typeof emptyForm,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const need = (key: string, ok: boolean, message = 'Required') => {
    if (!ok) errors[key] = message;
  };

  if (stepIndex === 0) {
    need('phone', filled(form.phone));
    need('dateOfBirth', filled(form.dateOfBirth));
    need('gender', filled(form.gender));
    need('fatherName', filled(form.fatherName));
    need('motherName', filled(form.motherName));
    need('maritalStatus', filled(form.maritalStatus));
    if (form.maritalStatus === 'Married') need('spouseName', filled(form.spouseName));
    need('bloodGroup', filled(form.bloodGroup));
    need('nationality', filled(form.nationality));
    need('currentCity', filled(form.currentCity));
    need('hometown', filled(form.hometown));
    need('languagesKnown', filled(form.languagesKnown));
    need('currentAddress', filled(form.currentAddress));
    need('permanentAddress', filled(form.permanentAddress));
    need('emergencyContactName', filled(form.emergencyContactName));
    need('emergencyContactPhone', filled(form.emergencyContactPhone));
    need('emergencyContactRelation', filled(form.emergencyContactRelation));
  }
  if (stepIndex === 1) {
    need('totalExperienceYears', filled(form.totalExperienceYears));
    need('noticePeriodDays', filled(form.noticePeriodDays));
  }
  if (stepIndex === 2) {
    const eduOk = form.education.some(
      (row) =>
        filled(row.qualification) &&
        filled(row.institution) &&
        filled(row.yearOfPassing) &&
        filled(row.percentageOrCgpa),
    );
    need(
      'education',
      eduOk,
      'Add at least one row with degree, institution, year, and marks',
    );
  }
  if (stepIndex === 3 && !form.isFresher) {
    const jobOk = form.previousEmployment.some(
      (row) =>
        filled(row.companyName) &&
        filled(row.designation) &&
        filled(row.fromDate) &&
        filled(row.toDate) &&
        filled(row.lastCtc) &&
        filled(row.reasonForLeaving),
    );
    need(
      'previousEmployment',
      jobOk,
      'Add one complete job, or mark yourself as a fresher',
    );
  }
  if (stepIndex === 4) {
    const refOk = form.references.some(
      (row) =>
        filled(row.name) &&
        filled(row.phone) &&
        filled(row.relation) &&
        filled(row.organization) &&
        filled(row.designation) &&
        filled(row.email) &&
        filled(row.yearsKnown),
    );
    need('references', refOk, 'Add one complete professional reference');
  }
  if (stepIndex === 5) {
    need('bankAccountHolderName', filled(form.bankAccountHolderName));
    need('bankName', filled(form.bankName));
    need('bankAccountNumber', filled(form.bankAccountNumber));
    need('bankIfsc', filled(form.bankIfsc));
    need('bankBranch', filled(form.bankBranch));
  }
  return errors;
};

const errorMessage = (error: any): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message || 'Something went wrong. Please try again.';
};

const OptionSelect = ({
  label,
  value,
  options,
  onChange,
  required = false,
  error = false,
  helperText,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}) => (
  <FormControl fullWidth size="medium" required={required} error={error} sx={fieldSx}>
    <InputLabel id={`${label}-label`}>{label}</InputLabel>
    <Select
      labelId={`${label}-label`}
      label={label}
      value={value || ''}
      onChange={(event) => onChange(String(event.target.value))}
    >
      <MenuItem value="">
        <em>Select</em>
      </MenuItem>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </Select>
    {helperText ? (
      <Typography
        variant="caption"
        sx={{ mt: 0.75, ml: 1.75, color: error ? 'error.main' : 'text.secondary' }}
      >
        {helperText}
      </Typography>
    ) : null}
  </FormControl>
);

const Field = ({ sx, ...props }: React.ComponentProps<typeof TextField>) => (
  <TextField
    size="medium"
    fullWidth
    sx={[fieldSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])] as any}
    {...props}
  />
);

const RepeatCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.25,
      borderRadius: 2,
      border: `1px solid ${JOIN.border}`,
      bgcolor: tokens.panelAlt,
    }}
  >
    <Typography
      variant="subtitle2"
      sx={{ fontWeight: 700, color: JOIN.ink, mb: 1.75, letterSpacing: 0.2 }}
    >
      {title}
    </Typography>
    {children}
  </Paper>
);

const PrimaryButtonSx = {
  borderRadius: 1.5,
  textTransform: 'none' as const,
  fontWeight: 700,
  px: 2.5,
  py: 1.1,
  bgcolor: JOIN.primary,
  color: tokens.black,
  boxShadow: 'none',
  transition: 'background-color 180ms ease, box-shadow 180ms ease',
  '&:hover': { bgcolor: JOIN.primaryDark, boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)' },
};

const OutlineButtonSx = {
  borderRadius: 1.5,
  textTransform: 'none' as const,
  fontWeight: 600,
  px: 2.25,
  py: 1.05,
  borderColor: JOIN.border,
  color: JOIN.ink,
  '&:hover': { borderColor: JOIN.primary, bgcolor: JOIN.primarySoft },
};

const isImageMime = (mime: string) => mime.startsWith('image/');
const isPdfMime = (mime: string) => mime === 'application/pdf' || mime.includes('pdf');

const DocumentPreviewCard = ({
  doc,
  accessToken,
  busy,
  deleting,
  onUpload,
  onDelete,
}: {
  doc: JoinDocumentItem;
  accessToken: string;
  busy: boolean;
  deleting: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
}) => {
  const inputId = `join-doc-${doc.documentType}`;
  const hasFile = (doc.sizeBytes || 0) > 0 && Boolean(doc.mimeType);
  const needsReupload = doc.status === 'Re-upload Required';
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewMime, setPreviewMime] = useState(doc.mimeType || '');
  const [previewError, setPreviewError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    if (!hasFile || !accessToken) {
      setPreviewUrl('');
      setPreviewMime('');
      setPreviewError('');
      return undefined;
    }

    setPreviewLoading(true);
    setPreviewError('');
    fetchJoinDocumentBlob(accessToken, doc.documentType)
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
        if (cancelled) return;
        setPreviewError('Preview unavailable. Try upload again.');
        setPreviewUrl('');
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessToken, doc.documentType, doc.version, doc.status, doc.mimeType, hasFile]);

  const locked = doc.status === 'Locked' || doc.status === 'Approved';
  const chipColor =
    doc.status === 'Approved' || doc.status === 'Locked'
      ? 'success'
      : needsReupload
        ? 'warning'
        : hasFile
          ? 'info'
          : 'default';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: 2,
        border: `1px solid ${needsReupload ? tokens.warning : JOIN.border}`,
        bgcolor: needsReupload ? tokens.warningSoft : JOIN.card,
        transition: 'border-color 180ms ease, box-shadow 180ms ease',
        '&:hover': {
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
        },
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'stretch' }}>
        <Box
          sx={{
            width: { xs: '100%', sm: 132 },
            minHeight: 104,
            borderRadius: 1.5,
            border: '1px dashed',
            borderColor: needsReupload ? tokens.warning : hasFile ? tokens.success : tokens.border,
            bgcolor: needsReupload
              ? tokens.warningSoft
              : hasFile
                ? tokens.successSoft
                : tokens.input,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
          aria-busy={previewLoading}
        >
          {!hasFile && (
            <Stack alignItems="center" spacing={0.5} px={1} textAlign="center">
              <UploadFileOutlinedIcon color="disabled" aria-hidden="true" />
              <Typography variant="caption" color="text.secondary">
                No file yet
              </Typography>
            </Stack>
          )}
          {hasFile && previewLoading && <CircularProgress size={22} />}
          {hasFile && !previewLoading && previewError && (
            <Typography variant="caption" color="error" px={1} textAlign="center">
              {previewError}
            </Typography>
          )}
          {hasFile && !previewLoading && previewUrl && isImageMime(previewMime) && (
            <Box
              component="img"
              src={previewUrl}
              alt={`${doc.label} preview`}
              sx={{ width: '100%', height: 104, objectFit: 'cover', display: 'block' }}
            />
          )}
          {hasFile && !previewLoading && previewUrl && isPdfMime(previewMime) && (
            <Stack alignItems="center" spacing={0.5}>
              <PictureAsPdfOutlinedIcon color="error" aria-hidden="true" />
              <Typography variant="caption" color="text.secondary">
                PDF ready
              </Typography>
            </Stack>
          )}
          {hasFile &&
            !previewLoading &&
            previewUrl &&
            !isImageMime(previewMime) &&
            !isPdfMime(previewMime) && (
              <Stack alignItems="center" spacing={0.5}>
                <ImageOutlinedIcon color="action" aria-hidden="true" />
                <Typography variant="caption" color="text.secondary">
                  File ready
                </Typography>
              </Stack>
            )}
        </Box>

        <Stack spacing={1.25} flex={1} justifyContent="space-between">
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography fontWeight={700}>{doc.label}</Typography>
              <Chip
                size="small"
                color={chipColor}
                label={needsReupload ? 'Re-upload Required' : hasFile ? doc.status : 'Missing'}
                role="status"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {hasFile
                ? `${doc.originalFileName || 'Uploaded file'}${doc.version ? ` · v${doc.version}` : ''}`
                : needsReupload
                  ? 'Previous file removed. Upload a new file.'
                  : 'PDF, JPG, or PNG up to 5 MB'}
            </Typography>
            {needsReupload && doc.rejectionReason && (
              <Alert severity="warning" sx={{ mt: 1 }} role="alert">
                Re-upload needed: {doc.rejectionReason}
              </Alert>
            )}
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {hasFile && previewUrl && (
              <Button
                variant="outlined"
                sx={OutlineButtonSx}
                onClick={() => setDialogOpen(true)}
                disabled={previewLoading}
              >
                Preview
              </Button>
            )}
            <Button
              variant="contained"
              component="label"
              disabled={busy || deleting || locked}
              sx={{
                ...PrimaryButtonSx,
                ...(needsReupload
                  ? { bgcolor: JOIN.warn, color: tokens.black, '&:hover': { bgcolor: tokens.goldHover } }
                  : {}),
              }}
            >
              {busy ? 'Uploading…' : needsReupload ? 'Re-upload' : hasFile ? 'Replace' : 'Upload'}
              <input
                id={inputId}
                hidden
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  if (hasFile) {
                    setPendingFile(file);
                    return;
                  }
                  onUpload(file);
                }}
              />
            </Button>
            {hasFile && !locked && (
              <Button
                variant="outlined"
                color="warning"
                disabled={busy || deleting}
                sx={OutlineButtonSx}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>

      <ConfirmDialog
        open={Boolean(pendingFile)}
        title="Replace this file?"
        confirmLabel="Replace file"
        tone="danger"
        confirmDisabled={!pendingFile || busy || deleting}
        onConfirm={() => {
          if (!pendingFile) return;
          const file = pendingFile;
          setPendingFile(null);
          onUpload(file);
        }}
        onClose={() => setPendingFile(null)}
      >
        <Typography variant="body2" color="text.secondary">
          The current file will be removed from storage and replaced with{' '}
          {pendingFile?.name || 'the new file'}.
        </Typography>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete this file?"
        description={`${doc.label} will be removed from the joining form and deleted from storage. This cannot be undone.`}
        confirmLabel="Delete file"
        tone="danger"
        loading={deleting}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          onDelete();
        }}
        onClose={() => setDeleteConfirmOpen(false)}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
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
              title={`${doc.label} PDF preview`}
              src={previewUrl}
              sx={{ width: '100%', height: '70vh', border: 0 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

const Join: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem(JOIN_TOKEN_KEY) || '');
  const [form, setForm] = useState(emptyForm);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    setStepErrors({});
  }, [activeStep]);

  const clearStepError = (key: string) => {
    setStepErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const fieldError = (key: string) => Boolean(stepErrors[key]);
  const fieldHelper = (key: string, fallback?: string) => stepErrors[key] || fallback;

  const StepIssuesAlert = () =>
    Object.keys(stepErrors).length ? (
      <Alert
        id="join-step-issues"
        severity="warning"
        variant="outlined"
        sx={{
          borderRadius: 2,
          borderColor: tokens.warning,
          bgcolor: tokens.warningSoft,
          color: JOIN.ink,
          '& .MuiAlert-icon': { color: tokens.warning },
        }}
      >
        Complete the highlighted fields on this step to continue.
      </Alert>
    ) : null;

  const { data, isPending, isError } = useQuery({
    queryKey: ['join', token],
    queryFn: () => resolveInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });

  const refused = !token || isError || (!isPending && !data?.valid);
  const verified = Boolean(data?.emailVerified);

  useEffect(() => {
    if (!token || !verified || accessToken) return;
    let cancelled = false;
    resumeJoinSession(token)
      .then((session) => {
        if (cancelled) return;
        sessionStorage.setItem(JOIN_TOKEN_KEY, session.accessToken);
        setAccessToken(session.accessToken);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [token, verified, accessToken]);

  const formQuery = useQuery({
    queryKey: ['join-form', accessToken],
    queryFn: () => getJoinForm(accessToken),
    enabled: Boolean(accessToken),
    retry: false,
  });

  const documentsQuery = useQuery({
    queryKey: ['join-documents', accessToken],
    queryFn: () => getJoinDocuments(accessToken),
    enabled: Boolean(accessToken),
    retry: false,
  });

  const policiesQuery = useQuery({
    queryKey: ['join-policies', accessToken],
    queryFn: () => getJoinPolicies(accessToken),
    enabled: Boolean(accessToken),
    retry: false,
  });

  const readinessQuery = useQuery({
    queryKey: ['join-readiness', accessToken],
    queryFn: () => getJoinReadiness(accessToken),
    enabled: Boolean(accessToken),
    retry: false,
  });

  const [uploadingType, setUploadingType] = useState('');
  const [deletingType, setDeletingType] = useState('');
  const [ackingPolicyId, setAckingPolicyId] = useState('');
  const [declarationChecked, setDeclarationChecked] = useState(false);

  useEffect(() => {
    const draft = formQuery.data as JoinFormDraft | undefined;
    if (!draft) return;
    setForm({
      phone: draft.phone || '',
      dateOfBirth: draft.dateOfBirth || '',
      gender: draft.gender || '',
      alternatePhone: draft.alternatePhone || '',
      fatherName: draft.fatherName || '',
      motherName: draft.motherName || '',
      maritalStatus: draft.maritalStatus || '',
      spouseName: draft.spouseName || '',
      bloodGroup: draft.bloodGroup || '',
      nationality: draft.nationality || 'Indian',
      currentCity: draft.currentCity || '',
      hometown: draft.hometown || '',
      languagesKnown: draft.languagesKnown || '',
      totalExperienceYears: draft.totalExperienceYears || '',
      noticePeriodDays: draft.noticePeriodDays || '',
      passportNumber: draft.passportNumber || '',
      drivingLicenseNumber: draft.drivingLicenseNumber || '',
      uanNumber: draft.uanNumber || '',
      pfNumber: draft.pfNumber || '',
      esiNumber: draft.esiNumber || '',
      linkedInUrl: draft.linkedInUrl || '',
      currentAddress: draft.currentAddress || '',
      permanentAddress: draft.permanentAddress || '',
      emergencyContactName: draft.emergencyContactName || '',
      emergencyContactPhone: draft.emergencyContactPhone || '',
      emergencyContactRelation: draft.emergencyContactRelation || '',
      education: draft.education?.length ? draft.education : [emptyEducation()],
      isFresher: Boolean(draft.isFresher),
      previousEmployment: draft.previousEmployment?.length
        ? draft.previousEmployment
        : [emptyEmployment()],
      references: draft.references?.length ? draft.references : [emptyReference()],
      bankAccountHolderName: draft.bankAccountHolderName || '',
      bankName: draft.bankName || '',
      bankAccountNumber: draft.bankAccountNumber || '',
      bankIfsc: draft.bankIfsc || '',
      bankBranch: draft.bankBranch || '',
    });
    setSavedAt(draft.formDraftSavedAt || draft.personalSectionSavedAt);
  }, [formQuery.data]);

  const sendOtp = useMutation({
    mutationFn: () => requestJoinOtp(token),
    onSuccess: (response) => {
      setOtpSent(true);
      setStatusMessage(response.message);
      toast.success(response.message);
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const verifyOtp = useMutation({
    mutationFn: () => verifyJoinOtp(token, code.trim()),
    onSuccess: async (session) => {
      sessionStorage.setItem(JOIN_TOKEN_KEY, session.accessToken);
      setAccessToken(session.accessToken);
      setStatusMessage('Email verified. Complete each section below.');
      toast.success('Email verified');
      await queryClient.invalidateQueries({ queryKey: ['join', token] });
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const saveForm = useMutation({
    mutationFn: () => saveJoinForm(accessToken, form),
    onSuccess: (draft) => {
      setSavedAt(draft.formDraftSavedAt || draft.personalSectionSavedAt);
      setStatusMessage('Details saved. You can return later with the same invitation link.');
      toast.success('Details saved');
      queryClient.setQueryData(['join-form', accessToken], draft);
      queryClient.invalidateQueries({ queryKey: ['join-readiness', accessToken] });
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const uploadDocument = useMutation({
    mutationFn: ({ documentType, file }: { documentType: string; file: File }) =>
      uploadJoinDocument(accessToken, documentType, file),
    onSuccess: (checklist) => {
      setUploadingType('');
      const message = `Documents updated: ${checklist.uploadedCount} of ${checklist.requiredCount} required files uploaded.`;
      setStatusMessage(message);
      toast.success(message);
      queryClient.setQueryData(['join-documents', accessToken], checklist);
      queryClient.invalidateQueries({ queryKey: ['join-readiness', accessToken] });
    },
    onError: (error: any) => {
      setUploadingType('');
      toast.error(errorMessage(error));
    },
  });

  const deleteDocument = useMutation({
    mutationFn: (documentType: string) => deleteJoinDocument(accessToken, documentType),
    onSuccess: (checklist) => {
      setDeletingType('');
      const message = `Documents updated: ${checklist.uploadedCount} of ${checklist.requiredCount} required files uploaded.`;
      setStatusMessage(message);
      toast.success(message);
      queryClient.setQueryData(['join-documents', accessToken], checklist);
      queryClient.invalidateQueries({ queryKey: ['join-readiness', accessToken] });
    },
    onError: (error: any) => {
      setDeletingType('');
      toast.error(errorMessage(error));
    },
  });

  const acknowledgePolicy = useMutation({
    mutationFn: (policyId: string) => acknowledgeJoinPolicy(accessToken, policyId),
    onSuccess: (state) => {
      setAckingPolicyId('');
      const message = `Policies accepted: ${state.acknowledgedCount} of ${state.requiredCount}.`;
      setStatusMessage(message);
      toast.success(message);
      queryClient.setQueryData(['join-policies', accessToken], state);
      queryClient.invalidateQueries({ queryKey: ['join-readiness', accessToken] });
    },
    onError: (error: any) => {
      setAckingPolicyId('');
      toast.error(errorMessage(error));
    },
  });

  const acceptDeclaration = useMutation({
    mutationFn: () => acceptJoinDeclaration(accessToken),
    onSuccess: (state) => {
      setDeclarationChecked(true);
      setStatusMessage('Joining declaration accepted. Open Review to submit your onboarding.');
      toast.success('Joining declaration accepted');
      queryClient.setQueryData(['join-policies', accessToken], state);
      queryClient.invalidateQueries({ queryKey: ['join-readiness', accessToken] });
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  const submitPackage = useMutation({
    mutationFn: () => submitJoinPackage(accessToken),
    onSuccess: (state) => {
      const message = state.alreadySubmitted
        ? 'Your onboarding is submitted. HR will review it next.'
        : 'Onboarding submitted.';
      setStatusMessage(message);
      toast.success(message);
      queryClient.setQueryData(['join-readiness', accessToken], state);
    },
    onError: (error: any) => toast.error(errorMessage(error)),
  });

  useEffect(() => {
    if (policiesQuery.data?.declaration.accepted) {
      setDeclarationChecked(true);
    }
  }, [policiesQuery.data?.declaration.accepted]);

  const setField = (key: keyof typeof emptyForm, value: string | boolean) => {
    clearStepError(String(key));
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateEducation = (index: number, key: keyof JoinEducationRow, value: string) => {
    clearStepError('education');
    setForm((current) => ({
      ...current,
      education: current.education.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  };

  const updateEmployment = (index: number, key: keyof JoinEmploymentRow, value: string) => {
    clearStepError('previousEmployment');
    setForm((current) => ({
      ...current,
      previousEmployment: current.previousEmployment.map((row, i) =>
        i === index ? { ...row, [key]: value } : row,
      ),
    }));
  };

  const updateReference = (index: number, key: keyof JoinReferenceRow, value: string) => {
    clearStepError('references');
    setForm((current) => ({
      ...current,
      references: current.references.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  };

  const actionError =
    sendOtp.error ||
    verifyOtp.error ||
    saveForm.error ||
    formQuery.error ||
    documentsQuery.error ||
    uploadDocument.error ||
    deleteDocument.error ||
    policiesQuery.error ||
    acknowledgePolicy.error ||
    acceptDeclaration.error ||
    readinessQuery.error ||
    submitPackage.error;
  const showForm = Boolean(accessToken) && verified;
  const documentsStepIndex = STEPS.indexOf('Documents');
  const policiesStepIndex = STEPS.indexOf('Policies');
  const ndncStepIndex = STEPS.indexOf('NDNC');
  const reviewStepIndex = STEPS.indexOf('Review');
  const isDocumentsStep = activeStep === documentsStepIndex;
  const isPoliciesStep = activeStep === policiesStepIndex;
  const isNdncStep = activeStep === ndncStepIndex;
  const isReviewStep = activeStep === reviewStepIndex;
  const hideDraftSave = isDocumentsStep || isPoliciesStep || isNdncStep || isReviewStep;

  const renderStep = () => {
    if (activeStep === 0) {
      return (
        <Stack spacing={2}>
          <StepIssuesAlert />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><Field label="Phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} required error={fieldError('phone')} helperText={fieldHelper('phone')} /></Grid>
            <Grid item xs={12} sm={6}><Field label="Alternate phone" value={form.alternatePhone} onChange={(e) => setField('alternatePhone', e.target.value)} helperText="Optional" /></Grid>
            <Grid item xs={12} sm={6}><Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)} InputLabelProps={{ shrink: true }} required error={fieldError('dateOfBirth')} helperText={fieldHelper('dateOfBirth')} /></Grid>
            <Grid item xs={12} sm={6}><OptionSelect label="Gender" value={form.gender} options={GENDER_OPTIONS} onChange={(v) => setField('gender', v)} required error={fieldError('gender')} helperText={fieldHelper('gender')} /></Grid>
            <Grid item xs={12} sm={6}><Field label="Father's name" value={form.fatherName} onChange={(e) => setField('fatherName', e.target.value)} required error={fieldError('fatherName')} helperText={fieldHelper('fatherName')} /></Grid>
            <Grid item xs={12} sm={6}><Field label="Mother's name" value={form.motherName} onChange={(e) => setField('motherName', e.target.value)} required error={fieldError('motherName')} helperText={fieldHelper('motherName')} /></Grid>
            <Grid item xs={12} sm={6}><OptionSelect label="Marital status" value={form.maritalStatus} options={MARITAL_OPTIONS} onChange={(v) => setField('maritalStatus', v)} required error={fieldError('maritalStatus')} helperText={fieldHelper('maritalStatus')} /></Grid>
            <Grid item xs={12} sm={6}><Field label="Spouse name" value={form.spouseName} onChange={(e) => setField('spouseName', e.target.value)} disabled={form.maritalStatus !== 'Married'} required={form.maritalStatus === 'Married'} error={fieldError('spouseName')} helperText={fieldHelper('spouseName', form.maritalStatus !== 'Married' ? 'Needed only if married' : undefined)} /></Grid>
            <Grid item xs={12} sm={6}><OptionSelect label="Blood group" value={form.bloodGroup} options={BLOOD_OPTIONS} onChange={(v) => setField('bloodGroup', v)} required error={fieldError('bloodGroup')} helperText={fieldHelper('bloodGroup')} /></Grid>
            <Grid item xs={12} sm={6}><OptionSelect label="Nationality" value={form.nationality} options={NATIONALITY_OPTIONS} onChange={(v) => setField('nationality', v)} required error={fieldError('nationality')} helperText={fieldHelper('nationality')} /></Grid>
            <Grid item xs={12} sm={6}><Field label="Current city" value={form.currentCity} onChange={(e) => setField('currentCity', e.target.value)} required error={fieldError('currentCity')} helperText={fieldHelper('currentCity')} /></Grid>
            <Grid item xs={12} sm={6}><Field label="Hometown" value={form.hometown} onChange={(e) => setField('hometown', e.target.value)} required error={fieldError('hometown')} helperText={fieldHelper('hometown')} /></Grid>
            <Grid item xs={12}><Field label="Languages known" value={form.languagesKnown} onChange={(e) => setField('languagesKnown', e.target.value)} placeholder="e.g. English, Hindi, Telugu" required error={fieldError('languagesKnown')} helperText={fieldHelper('languagesKnown')} /></Grid>
            <Grid item xs={12}><Field label="Current address" value={form.currentAddress} onChange={(e) => setField('currentAddress', e.target.value)} multiline minRows={2} required error={fieldError('currentAddress')} helperText={fieldHelper('currentAddress')} /></Grid>
            <Grid item xs={12}><Field label="Permanent address" value={form.permanentAddress} onChange={(e) => setField('permanentAddress', e.target.value)} multiline minRows={2} required error={fieldError('permanentAddress')} helperText={fieldHelper('permanentAddress')} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Emergency contact name" value={form.emergencyContactName} onChange={(e) => setField('emergencyContactName', e.target.value)} required error={fieldError('emergencyContactName')} helperText={fieldHelper('emergencyContactName')} /></Grid>
            <Grid item xs={12} sm={4}><Field label="Emergency contact phone" value={form.emergencyContactPhone} onChange={(e) => setField('emergencyContactPhone', e.target.value)} required error={fieldError('emergencyContactPhone')} helperText={fieldHelper('emergencyContactPhone')} /></Grid>
            <Grid item xs={12} sm={4}><OptionSelect label="Emergency relation" value={form.emergencyContactRelation} options={RELATION_OPTIONS} onChange={(v) => setField('emergencyContactRelation', v)} required error={fieldError('emergencyContactRelation')} helperText={fieldHelper('emergencyContactRelation')} /></Grid>
          </Grid>
        </Stack>
      );
    }

    if (activeStep === 1) {
      return (
        <Stack spacing={2}>
          <StepIssuesAlert />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><Field label="Total experience (years)" value={form.totalExperienceYears} onChange={(e) => setField('totalExperienceYears', e.target.value)} inputProps={{ inputMode: 'decimal' }} required error={fieldError('totalExperienceYears')} helperText={fieldHelper('totalExperienceYears', 'Use 0 if fresher')} /></Grid>
            <Grid item xs={12} sm={6}><OptionSelect label="Notice period" value={form.noticePeriodDays} options={NOTICE_OPTIONS} onChange={(v) => setField('noticePeriodDays', v)} required error={fieldError('noticePeriodDays')} helperText={fieldHelper('noticePeriodDays')} /></Grid>
            <Grid item xs={12}><Field label="LinkedIn URL" value={form.linkedInUrl} onChange={(e) => setField('linkedInUrl', e.target.value)} helperText="Optional" /></Grid>
            <Grid item xs={12} sm={6}><Field label="Passport number" value={form.passportNumber} onChange={(e) => setField('passportNumber', e.target.value)} helperText="Optional" /></Grid>
            <Grid item xs={12} sm={6}><Field label="Driving licence number" value={form.drivingLicenseNumber} onChange={(e) => setField('drivingLicenseNumber', e.target.value)} helperText="Optional" /></Grid>
            <Grid item xs={12} sm={4}><Field label="UAN number" value={form.uanNumber} onChange={(e) => setField('uanNumber', e.target.value)} helperText="Optional" /></Grid>
            <Grid item xs={12} sm={4}><Field label="PF number" value={form.pfNumber} onChange={(e) => setField('pfNumber', e.target.value)} helperText="Optional" /></Grid>
            <Grid item xs={12} sm={4}><Field label="ESI number" value={form.esiNumber} onChange={(e) => setField('esiNumber', e.target.value)} helperText="Optional" /></Grid>
          </Grid>
        </Stack>
      );
    }

    if (activeStep === 2) {
      return (
        <Stack spacing={2}>
          <StepIssuesAlert />
          {stepErrors.education ? (
            <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
              {stepErrors.education}
            </Alert>
          ) : null}
          {form.education.map((row, index) => (
            <RepeatCard key={`edu-${index}`} title={`Qualification ${index + 1}`}>
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <OptionSelect
                      label="Degree / qualification"
                      value={row.qualification}
                      options={QUALIFICATION_OPTIONS}
                      onChange={(v) => updateEducation(index, 'qualification', v)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}><Field label="Institution" value={row.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} required /></Grid>
                  <Grid item xs={12} sm={4}><Field label="Year of passing" value={row.yearOfPassing} onChange={(e) => updateEducation(index, 'yearOfPassing', e.target.value)} inputProps={{ inputMode: 'numeric', maxLength: 4 }} required /></Grid>
                  <Grid item xs={12} sm={4}><Field label="Percentage / CGPA" value={row.percentageOrCgpa} onChange={(e) => updateEducation(index, 'percentageOrCgpa', e.target.value)} required /></Grid>
                  <Grid item xs={12} sm={4}><Field label="Specialization" value={row.specialization} onChange={(e) => updateEducation(index, 'specialization', e.target.value)} helperText="Optional" /></Grid>
                </Grid>
                {form.education.length > 1 && (
                  <Button sx={OutlineButtonSx} onClick={() => setForm((c) => ({ ...c, education: c.education.filter((_, i) => i !== index) }))}>
                    Remove
                  </Button>
                )}
              </Stack>
            </RepeatCard>
          ))}
          <Button variant="outlined" sx={OutlineButtonSx} onClick={() => setForm((c) => ({ ...c, education: [...c.education, emptyEducation()] }))}>
            Add education
          </Button>
        </Stack>
      );
    }

    if (activeStep === 3) {
      return (
        <Stack spacing={2}>
          <StepIssuesAlert />
          {stepErrors.previousEmployment ? (
            <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
              {stepErrors.previousEmployment}
            </Alert>
          ) : null}
          <FormControlLabel
            control={<Checkbox checked={form.isFresher} onChange={(e) => setField('isFresher', e.target.checked)} />}
            label="I am a fresher (no previous employment)"
          />
          {!form.isFresher && (
            <>
              <Typography variant="body2" color="text.secondary">
                Add jobs from latest to oldest. Put your most recent employer first, then earlier roles.
              </Typography>
              {form.previousEmployment.map((row, index) => (
                <RepeatCard
                  key={`emp-${index}`}
                  title={index === 0 ? 'Most recent employer' : `Earlier employer ${index}`}
                >
                  <Stack spacing={2}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><Field label="Company name" value={row.companyName} onChange={(e) => updateEmployment(index, 'companyName', e.target.value)} required /></Grid>
                      <Grid item xs={12} sm={6}><Field label="Designation" value={row.designation} onChange={(e) => updateEmployment(index, 'designation', e.target.value)} required /></Grid>
                      <Grid item xs={12} sm={6}><Field label="From" type="month" value={row.fromDate} onChange={(e) => updateEmployment(index, 'fromDate', e.target.value)} InputLabelProps={{ shrink: true }} required /></Grid>
                      <Grid item xs={12} sm={6}><Field label="To" type="month" value={row.toDate} onChange={(e) => updateEmployment(index, 'toDate', e.target.value)} InputLabelProps={{ shrink: true }} required /></Grid>
                      <Grid item xs={12} sm={6}><Field label="Last CTC" value={row.lastCtc} onChange={(e) => updateEmployment(index, 'lastCtc', e.target.value)} required /></Grid>
                      <Grid item xs={12} sm={6}><Field label="Reason for leaving" value={row.reasonForLeaving} onChange={(e) => updateEmployment(index, 'reasonForLeaving', e.target.value)} required /></Grid>
                      <Grid item xs={12} sm={6}><Field label="Manager / reference name" value={row.referenceName} onChange={(e) => updateEmployment(index, 'referenceName', e.target.value)} helperText="Optional" /></Grid>
                      <Grid item xs={12} sm={6}><Field label="Manager / reference phone" value={row.referencePhone} onChange={(e) => updateEmployment(index, 'referencePhone', e.target.value)} helperText="Optional" /></Grid>
                    </Grid>
                    {form.previousEmployment.length > 1 && (
                      <Button sx={OutlineButtonSx} onClick={() => setForm((c) => ({ ...c, previousEmployment: c.previousEmployment.filter((_, i) => i !== index) }))}>
                        Remove
                      </Button>
                    )}
                  </Stack>
                </RepeatCard>
              ))}
              <Button variant="outlined" sx={OutlineButtonSx} onClick={() => setForm((c) => ({ ...c, previousEmployment: [...c.previousEmployment, emptyEmployment()] }))}>
                Add earlier employer
              </Button>
            </>
          )}
        </Stack>
      );
    }

    if (activeStep === 4) {
      return (
        <Stack spacing={2}>
          <StepIssuesAlert />
          {stepErrors.references ? (
            <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
              {stepErrors.references}
            </Alert>
          ) : null}
          <Typography variant="body2" color="text.secondary">
            At least one professional reference is required (manager, HR, team lead, or client).
            Friends and personal contacts are not accepted.
          </Typography>
          {form.references.map((row, index) => (
            <RepeatCard key={`ref-${index}`} title={`Professional reference ${index + 1}`}>
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}><Field label="Full name" value={row.name} onChange={(e) => updateReference(index, 'name', e.target.value)} required /></Grid>
                  <Grid item xs={12} sm={6}>
                    <OptionSelect
                      label="Professional relation"
                      value={row.relation}
                      options={REFERENCE_RELATION_OPTIONS}
                      onChange={(v) => updateReference(index, 'relation', v)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}><Field label="Phone" value={row.phone} onChange={(e) => updateReference(index, 'phone', e.target.value)} required /></Grid>
                  <Grid item xs={12} sm={6}><Field label="Email" type="email" value={row.email} onChange={(e) => updateReference(index, 'email', e.target.value)} required /></Grid>
                  <Grid item xs={12} sm={6}><Field label="Organization" value={row.organization} onChange={(e) => updateReference(index, 'organization', e.target.value)} required /></Grid>
                  <Grid item xs={12} sm={6}><Field label="Designation" value={row.designation} onChange={(e) => updateReference(index, 'designation', e.target.value)} required /></Grid>
                  <Grid item xs={12} sm={8}><Field label="Address" value={row.address} onChange={(e) => updateReference(index, 'address', e.target.value)} helperText="Optional" /></Grid>
                  <Grid item xs={12} sm={4}><Field label="Years known" value={row.yearsKnown} onChange={(e) => updateReference(index, 'yearsKnown', e.target.value)} inputProps={{ inputMode: 'numeric' }} required /></Grid>
                </Grid>
                {form.references.length > 1 && (
                  <Button sx={OutlineButtonSx} onClick={() => setForm((c) => ({ ...c, references: c.references.filter((_, i) => i !== index) }))}>
                    Remove
                  </Button>
                )}
              </Stack>
            </RepeatCard>
          ))}
          <Button variant="outlined" sx={OutlineButtonSx} onClick={() => setForm((c) => ({ ...c, references: [...c.references, emptyReference()] }))}>
            Add professional reference
          </Button>
        </Stack>
      );
    }

    if (activeStep === 5) {
      return (
        <Stack spacing={2}>
          <StepIssuesAlert />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><Field label="Account holder name" value={form.bankAccountHolderName} onChange={(e) => setField('bankAccountHolderName', e.target.value)} required error={fieldError('bankAccountHolderName')} helperText={fieldHelper('bankAccountHolderName')} /></Grid>
            <Grid item xs={12} sm={6}><Field label="Bank name" value={form.bankName} onChange={(e) => setField('bankName', e.target.value)} required error={fieldError('bankName')} helperText={fieldHelper('bankName')} /></Grid>
            <Grid item xs={12} sm={6}><Field label="Account number" value={form.bankAccountNumber} onChange={(e) => setField('bankAccountNumber', e.target.value)} required error={fieldError('bankAccountNumber')} helperText={fieldHelper('bankAccountNumber')} /></Grid>
            <Grid item xs={12} sm={6}><Field label="IFSC" value={form.bankIfsc} onChange={(e) => setField('bankIfsc', e.target.value.toUpperCase())} required error={fieldError('bankIfsc')} helperText={fieldHelper('bankIfsc')} /></Grid>
            <Grid item xs={12}><Field label="Branch" value={form.bankBranch} onChange={(e) => setField('bankBranch', e.target.value)} required error={fieldError('bankBranch')} helperText={fieldHelper('bankBranch')} /></Grid>
          </Grid>
        </Stack>
      );
    }

    if (activeStep === documentsStepIndex) {
      const checklist = documentsQuery.data;
      if (documentsQuery.isPending) {
        return (
          <Stack alignItems="center" py={2}>
            <CircularProgress size={24} />
          </Stack>
        );
      }

      const idDocuments = (checklist?.documents || []).filter(
        (doc) => doc.documentType !== NDNC_SIGNATURE_TYPE,
      );
      const idRequired = idDocuments.filter((doc) => doc.required);
      const idUploaded = idRequired.filter(
        (doc) => doc.status !== 'Missing' && doc.status !== 'Re-upload Required',
      ).length;

      return (
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Upload PDF, JPG, or PNG files up to 5 MB. Each uploaded file shows a preview so you can
            confirm the right document before moving on. Your NDNC signature is collected on the next
            NDNC step.
          </Typography>
          {checklist && (
            <Typography variant="body2" fontWeight={600} role="status" aria-atomic="true">
              {idUploaded} of {idRequired.length} identity documents uploaded
            </Typography>
          )}
          {idDocuments.map((doc) => {
            const busy = uploadingType === doc.documentType && uploadDocument.isPending;
            const deleting = deletingType === doc.documentType && deleteDocument.isPending;
            return (
              <DocumentPreviewCard
                key={`${doc.documentType}-${doc.version}-${doc.status}`}
                doc={doc}
                accessToken={accessToken}
                busy={busy}
                deleting={deleting}
                onUpload={(file) => {
                  setUploadingType(doc.documentType);
                  uploadDocument.mutate({ documentType: doc.documentType, file });
                }}
                onDelete={() => {
                  setDeletingType(doc.documentType);
                  deleteDocument.mutate(doc.documentType);
                }}
              />
            );
          })}
        </Stack>
      );
    }

    if (activeStep === policiesStepIndex) {
      const policyState = policiesQuery.data;
      if (policiesQuery.isPending) {
        return (
          <Stack alignItems="center" py={2}>
            <CircularProgress size={24} />
          </Stack>
        );
      }

      const handbookPolicies = (policyState?.policies || []).filter(
        (policy) => policy.policyId !== NDNC_POLICY_ID,
      );
      const handbookAccepted = handbookPolicies.filter((policy) => policy.acknowledged).length;

      return (
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Read each workplace policy in full, then accept it. NDNC and your signature come on the
            next step.
          </Typography>
          {policyState && (
            <Typography variant="body2" fontWeight={600} role="status" aria-atomic="true">
              {handbookAccepted} of {handbookPolicies.length} workplace policies accepted
            </Typography>
          )}
          {handbookPolicies.map((policy) => {
            const busy = ackingPolicyId === policy.policyId && acknowledgePolicy.isPending;
            return (
              <Paper
                key={`${policy.policyId}-${policy.version}`}
                elevation={0}
                sx={{
                  p: 2.25,
                  borderRadius: 2,
                  border: `1px solid ${policy.acknowledged ? tokens.success : JOIN.border}`,
                  bgcolor: policy.acknowledged ? tokens.successSoft : JOIN.card,
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography fontWeight={700}>{policy.title}</Typography>
                    <Chip
                      size="small"
                      color={policy.acknowledged ? 'success' : 'default'}
                      label={policy.acknowledged ? 'Accepted' : 'Pending'}
                      role="status"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Version {policy.version}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {policy.summary}
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 180,
                      overflow: 'auto',
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: tokens.input,
                      border: `1px solid ${JOIN.border}`,
                      whiteSpace: 'pre-wrap',
                      typography: 'body2',
                      color: JOIN.ink,
                    }}
                  >
                    {policy.body}
                  </Box>
                  <Button
                    variant={policy.acknowledged ? 'outlined' : 'contained'}
                    disabled={policy.acknowledged || busy}
                    sx={policy.acknowledged ? OutlineButtonSx : PrimaryButtonSx}
                    onClick={() => {
                      setAckingPolicyId(policy.policyId);
                      acknowledgePolicy.mutate(policy.policyId);
                    }}
                  >
                    {busy ? 'Saving…' : policy.acknowledged ? 'Accepted' : 'I accept this policy'}
                  </Button>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      );
    }

    if (activeStep === ndncStepIndex) {
      const policyState = policiesQuery.data;
      const checklist = documentsQuery.data;
      if (policiesQuery.isPending || documentsQuery.isPending) {
        return (
          <Stack alignItems="center" py={2}>
            <CircularProgress size={24} />
          </Stack>
        );
      }

      const ndncPolicy = (policyState?.policies || []).find(
        (policy) => policy.policyId === NDNC_POLICY_ID,
      );
      const signatureDoc = (checklist?.documents || []).find(
        (doc) => doc.documentType === NDNC_SIGNATURE_TYPE,
      );
      const signatureReady = Boolean(
        signatureDoc &&
          signatureDoc.status !== 'Missing' &&
          signatureDoc.status !== 'Re-upload Required',
      );
      const ndncBusy =
        ackingPolicyId === NDNC_POLICY_ID && acknowledgePolicy.isPending;
      const signatureBusy =
        uploadingType === NDNC_SIGNATURE_TYPE && uploadDocument.isPending;
      const signatureDeleting =
        deletingType === NDNC_SIGNATURE_TYPE && deleteDocument.isPending;
      const canConfirmDeclaration =
        Boolean(policyState?.allPoliciesAcknowledged) && signatureReady;

      return (
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Read the confidentiality and NDNC rules, accept them, then upload a clear image or scan
            of your signature. That file is your signed NDNC acknowledgement for HR.
          </Typography>

          {ndncPolicy && (
            <Paper
              elevation={0}
              sx={{
                p: 2.25,
                borderRadius: 2,
                border: `1px solid ${ndncPolicy.acknowledged ? tokens.success : JOIN.border}`,
                bgcolor: ndncPolicy.acknowledged ? tokens.successSoft : JOIN.card,
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography fontWeight={700}>{ndncPolicy.title}</Typography>
                  <Chip
                    size="small"
                    color={ndncPolicy.acknowledged ? 'success' : 'default'}
                    label={ndncPolicy.acknowledged ? 'Accepted' : 'Pending'}
                    role="status"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Version {ndncPolicy.version}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {ndncPolicy.summary}
                </Typography>
                <Box
                  sx={{
                    maxHeight: 220,
                    overflow: 'auto',
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: tokens.input,
                    border: `1px solid ${JOIN.border}`,
                    whiteSpace: 'pre-wrap',
                    typography: 'body2',
                    color: JOIN.ink,
                  }}
                >
                  {ndncPolicy.body}
                </Box>
                <Button
                  variant={ndncPolicy.acknowledged ? 'outlined' : 'contained'}
                  disabled={ndncPolicy.acknowledged || ndncBusy}
                  sx={ndncPolicy.acknowledged ? OutlineButtonSx : PrimaryButtonSx}
                  onClick={() => {
                    setAckingPolicyId(NDNC_POLICY_ID);
                    acknowledgePolicy.mutate(NDNC_POLICY_ID);
                  }}
                >
                  {ndncBusy
                    ? 'Saving…'
                    : ndncPolicy.acknowledged
                      ? 'NDNC accepted'
                      : 'I accept the NDNC and confidentiality rules'}
                </Button>
              </Stack>
            </Paper>
          )}

          {signatureDoc && (
            <DocumentPreviewCard
              key={`${signatureDoc.documentType}-${signatureDoc.version}-${signatureDoc.status}`}
              doc={{
                ...signatureDoc,
                label: 'Your signature for NDNC',
              }}
              accessToken={accessToken}
              busy={signatureBusy}
              deleting={signatureDeleting}
              onUpload={(file) => {
                setUploadingType(NDNC_SIGNATURE_TYPE);
                uploadDocument.mutate({ documentType: NDNC_SIGNATURE_TYPE, file });
              }}
              onDelete={() => {
                setDeletingType(NDNC_SIGNATURE_TYPE);
                deleteDocument.mutate(NDNC_SIGNATURE_TYPE);
              }}
            />
          )}

          <Paper
            elevation={0}
            sx={{
              p: 2.25,
              borderRadius: 2,
              border: `1px solid ${policyState?.declaration.accepted ? tokens.success : JOIN.border}`,
              bgcolor: policyState?.declaration.accepted ? tokens.successSoft : tokens.warningSoft,
            }}
          >
            <Stack spacing={1.5}>
              <Typography fontWeight={700}>
                {policyState?.declaration.title || 'Joining declaration'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Version {policyState?.declaration.version}
              </Typography>
              <Box
                sx={{
                  whiteSpace: 'pre-wrap',
                  typography: 'body2',
                  color: JOIN.ink,
                }}
              >
                {policyState?.declaration.body}
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={declarationChecked || Boolean(policyState?.declaration.accepted)}
                    disabled={
                      !canConfirmDeclaration ||
                      Boolean(policyState?.declaration.accepted) ||
                      acceptDeclaration.isPending
                    }
                    onChange={(event) => setDeclarationChecked(event.target.checked)}
                  />
                }
                label="I confirm this declaration is true and complete"
              />
              {!canConfirmDeclaration && (
                <Typography variant="caption" color="text.secondary">
                  Accept every workplace policy, accept NDNC, and upload your signature before you
                  can confirm the declaration.
                </Typography>
              )}
              <Button
                variant="contained"
                sx={PrimaryButtonSx}
                disabled={
                  !canConfirmDeclaration ||
                  Boolean(policyState?.declaration.accepted) ||
                  !declarationChecked ||
                  acceptDeclaration.isPending
                }
                onClick={() => acceptDeclaration.mutate()}
              >
                {acceptDeclaration.isPending
                  ? 'Saving…'
                  : policyState?.declaration.accepted
                    ? 'Declaration accepted'
                    : 'Accept declaration'}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      );
    }

    const readiness = readinessQuery.data;
    if (readinessQuery.isPending) {
      return (
        <Stack alignItems="center" py={2}>
          <CircularProgress size={24} />
        </Stack>
      );
    }

    const reviewRows = [
      {
        key: 'form',
        title: 'Form details',
        ready: Boolean(readiness?.form.ready),
        detail: readiness?.form.ready
          ? 'Personal, work, references, and bank details look complete.'
          : `Still needed: ${(readiness?.form.issues || [])
              .map((issue) => FORM_ISSUE_LABELS[issue] || issue)
              .join(', ')}.`,
      },
      {
        key: 'documents',
        title: 'Documents',
        ready: Boolean(readiness?.documents.ready),
        detail: readiness?.documents.ready
          ? `${readiness.documents.uploadedCount} of ${readiness.documents.requiredCount} required files uploaded.`
          : `${readiness?.documents.uploadedCount || 0} of ${readiness?.documents.requiredCount || 0} required files ready. Fix missing or re-upload items.`,
      },
      {
        key: 'policies',
        title: 'Policies, NDNC, and declaration',
        ready: Boolean(readiness?.policies.ready),
        detail: readiness?.policies.ready
          ? 'Workplace policies, NDNC, and the joining declaration are accepted.'
          : `${readiness?.policies.acknowledgedCount || 0} of ${readiness?.policies.requiredCount || 0} policies accepted${
              readiness?.policies.declarationAccepted ? '' : ', declaration still pending'
            }. Upload your NDNC signature on the NDNC step if it is still missing.`,
      },
    ];

    return (
      <Stack spacing={2.5}>
        {readiness?.onboardingStatus === 'Corrections Required' && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            HR asked for onboarding corrections
            {readiness.packageCorrectionReason
              ? `: ${readiness.packageCorrectionReason}`
              : '.'}{' '}
            Fix the items below, then submit again.
          </Alert>
        )}
        {readiness?.alreadySubmitted ? (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            {readiness.onboardingStatus === 'Completed'
              ? 'Onboarding approved. HR has completed your review.'
              : `Onboarding submitted${
                  readiness.packageSubmittedAt
                    ? ` on ${new Date(readiness.packageSubmittedAt).toLocaleString()}`
                    : ''
                }. HR will review it next. A second submit does not create another record.`}
          </Alert>
        ) : readiness?.onboardingStatus !== 'Corrections Required' ? (
          <Typography variant="body2" color="text.secondary">
            Confirm each part below is complete, then submit your onboarding once. You can go back to
            fix anything that is still pending.
          </Typography>
        ) : null}

        {reviewRows.map((row) => (
          <Paper
            key={row.key}
            elevation={0}
            sx={{
              p: 2.25,
              borderRadius: 2,
              border: `1px solid ${row.ready ? tokens.success : JOIN.border}`,
              bgcolor: row.ready ? tokens.successSoft : JOIN.card,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
              <Box>
                <Typography fontWeight={700}>{row.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {row.detail}
                </Typography>
              </Box>
              <Chip
                size="small"
                color={row.ready ? 'success' : 'warning'}
                label={row.ready ? 'Ready' : 'Pending'}
                role="status"
              />
            </Stack>
          </Paper>
        ))}

        <Button
          variant="contained"
          sx={PrimaryButtonSx}
          disabled={
            Boolean(readiness?.alreadySubmitted) ||
            !readiness?.ready ||
            submitPackage.isPending
          }
          onClick={() => submitPackage.mutate()}
        >
          {submitPackage.isPending
            ? 'Submitting…'
            : readiness?.alreadySubmitted
              ? 'Already submitted'
              : readiness?.ready
                ? 'Submit onboarding'
                : 'Finish pending items first'}
        </Button>
      </Stack>
    );
  };

  const progressValue = ((activeStep + 1) / STEPS.length) * 100;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: JOIN.bg,
        backgroundImage:
          `radial-gradient(ellipse at top, ${tokens.goldSoft}, transparent 55%), linear-gradient(180deg, ${tokens.bg} 0%, ${tokens.panel} 100%)`,
        px: { xs: 1.5, md: 4 },
        py: { xs: 3, md: 6 },
      }}
    >
      <Box sx={{ maxWidth: 920, mx: 'auto' }}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
          mb={2.5}
          flexWrap="wrap"
          useFlexGap
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: JOIN.primary,
                letterSpacing: '-0.02em',
                textWrap: 'balance',
                lineHeight: 1.15,
              }}
            >
              Team RW
            </Typography>
            <Typography variant="body2" sx={{ color: JOIN.muted, mt: 0.4 }}>
              Secure employee joining portal
            </Typography>
          </Box>
          <Chip
            icon={<LockOutlinedIcon sx={{ fontSize: 16 }} />}
            label="Private invitation"
            sx={{
              bgcolor: JOIN.primarySoft,
              color: JOIN.primaryDark,
              fontWeight: 600,
              borderRadius: 2,
            }}
          />
        </Stack>

        <Paper elevation={0} sx={cardSx}>
          {!token && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              This invitation link cannot be used.
            </Alert>
          )}

          {token && isPending && (
            <Stack alignItems="center" spacing={2} py={4}>
              <CircularProgress size={28} sx={{ color: JOIN.primary }} />
              <Typography sx={{ color: JOIN.muted }}>Checking your invitation…</Typography>
            </Stack>
          )}

          {token && !isPending && data?.valid && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: JOIN.ink, letterSpacing: '-0.01em' }}>
                  Hello, {data.firstName}
                </Typography>
                <Typography variant="body2" sx={{ color: JOIN.muted, mt: 0.75, maxWidth: 62 * 8 }}>
                  Complete each section carefully. You can save a draft and return with the same
                  invitation link.
                </Typography>
              </Box>

              {!showForm && verified && (
                <Stack alignItems="center" spacing={2} py={3}>
                  <CircularProgress size={28} sx={{ color: JOIN.primary }} />
                  <Typography sx={{ color: JOIN.muted }}>Opening your joining form…</Typography>
                </Stack>
              )}

              {!showForm && !verified && (
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 2,
                    bgcolor: JOIN.primarySoft,
                    border: `1px solid ${JOIN.border}`,
                  }}
                >
                  <Stack spacing={2.25}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <VerifiedOutlinedIcon sx={{ color: JOIN.primary }} aria-hidden="true" />
                      <Typography fontWeight={700} color={JOIN.ink}>
                        Verify your email
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: JOIN.muted }}>
                      We will send a one-time code to {data.maskedEmail}. Enter that code to confirm
                      this invitation is yours.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button
                        variant="contained"
                        sx={PrimaryButtonSx}
                        onClick={() => sendOtp.mutate()}
                        disabled={sendOtp.isPending}
                      >
                        {sendOtp.isPending ? 'Sending…' : otpSent ? 'Resend code' : 'Send verification code'}
                      </Button>
                    </Stack>
                    {(otpSent || statusMessage) && (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
                        <Field
                          label="6-digit code"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputProps={{ inputMode: 'numeric', maxLength: 6, 'aria-label': '6-digit verification code' }}
                          sx={{ ...fieldSx, maxWidth: { sm: 220 } }}
                        />
                        <Button
                          variant="outlined"
                          sx={{ ...OutlineButtonSx, mt: { sm: 0.5 } }}
                          onClick={() => verifyOtp.mutate()}
                          disabled={verifyOtp.isPending || code.trim().length !== 6}
                        >
                          {verifyOtp.isPending ? 'Checking…' : 'Verify email'}
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              )}

              {showForm && (
                <>
                  <Alert
                    icon={<VerifiedOutlinedIcon fontSize="inherit" />}
                    severity="success"
                    sx={{ borderRadius: 2, bgcolor: tokens.successSoft, border: `1px solid ${tokens.success}` }}
                  >
                    Email verified. Progress through the sections below. Save whenever you need a
                    break.
                  </Alert>

                  {formQuery.isPending ? (
                    <Stack alignItems="center" py={3}>
                      <CircularProgress size={24} sx={{ color: JOIN.primary }} />
                    </Stack>
                  ) : (
                    <Stack spacing={3}>
                      <Box>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1}
                        >
                          <Typography variant="caption" sx={{ color: JOIN.muted, fontWeight: 600 }}>
                            Step {activeStep + 1} of {STEPS.length}
                          </Typography>
                          <Typography variant="caption" sx={{ color: JOIN.primary, fontWeight: 700 }}>
                            {Math.round(progressValue)}% complete
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={progressValue}
                          aria-label="Joining form progress"
                          sx={{
                            height: 8,
                            borderRadius: 999,
                            bgcolor: JOIN.primarySoft,
                            mb: 2,
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 999,
                              bgcolor: JOIN.primary,
                            },
                          }}
                        />
                        <Stepper
                          activeStep={activeStep}
                          alternativeLabel
                          sx={{
                            display: { xs: 'none', md: 'flex' },
                            '& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed': {
                              color: JOIN.primary,
                            },
                            '& .MuiStepLabel-label': {
                              typography: 'caption',
                              fontWeight: 600,
                              color: JOIN.muted,
                            },
                            '& .MuiStepLabel-label.Mui-active': { color: JOIN.ink },
                          }}
                        >
                          {STEPS.map((label) => (
                            <Step key={label}>
                              <StepLabel>{label}</StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{ display: { md: 'none' }, color: JOIN.ink }}
                        >
                          {STEPS[activeStep]}
                        </Typography>
                      </Box>

                      <Divider sx={{ borderColor: JOIN.border }} />

                      <Box sx={{ pb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: JOIN.ink, mb: 0.5 }}>
                          {STEPS[activeStep]}
                        </Typography>
                        <Typography variant="body2" sx={{ color: JOIN.muted, mb: 2.5 }}>
                          {STEP_HELP[STEPS[activeStep]]}
                        </Typography>
                        {renderStep()}
                      </Box>

                      <Divider sx={{ borderColor: JOIN.border, my: 0.5 }} />

                      <Box
                        sx={{
                          width: '100%',
                          pt: 1,
                          pb: 0.5,
                        }}
                      >
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1.5}
                          justifyContent="space-between"
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                        >
                          <Button
                            variant="outlined"
                            sx={{ ...OutlineButtonSx, width: { xs: '100%', sm: 'auto' } }}
                            disabled={activeStep === 0}
                            onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
                          >
                            Back
                          </Button>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.25}
                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                          >
                            {!hideDraftSave && (
                              <Button
                                variant="outlined"
                                sx={{ ...OutlineButtonSx, width: { xs: '100%', sm: 'auto' } }}
                                onClick={() => saveForm.mutate()}
                                disabled={saveForm.isPending || !form.phone.trim()}
                              >
                                {saveForm.isPending ? 'Saving…' : 'Save draft'}
                              </Button>
                            )}
                            {activeStep < STEPS.length - 1 ? (
                              <Button
                                variant="contained"
                                sx={{ ...PrimaryButtonSx, width: { xs: '100%', sm: 'auto' } }}
                                onClick={() => {
                                  const errors = collectStepErrors(activeStep, form);
                                  if (Object.keys(errors).length) {
                                    setStepErrors(errors);
                                    window.requestAnimationFrame(() => {
                                      document
                                        .getElementById('join-step-issues')
                                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    });
                                    return;
                                  }
                                  setStepErrors({});
                                  if (activeStep === reviewStepIndex - 1) {
                                    queryClient.invalidateQueries({
                                      queryKey: ['join-readiness', accessToken],
                                    });
                                  }
                                  setActiveStep((step) => Math.min(STEPS.length - 1, step + 1));
                                }}
                              >
                                Next section
                              </Button>
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{ color: JOIN.muted, alignSelf: { sm: 'center' }, py: 1 }}
                              >
                                {readinessQuery.data?.alreadySubmitted
                                  ? 'Onboarding submitted. HR review comes next.'
                                  : 'Submit only when form, documents, and policies are ready.'}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                        {savedAt && (
                          <Typography variant="caption" sx={{ color: JOIN.muted, display: 'block', mt: 1.5 }}>
                            Last saved {new Date(savedAt).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  )}
                </>
              )}

              {statusMessage && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  {statusMessage}
                </Alert>
              )}
              {actionError && (
                <Alert severity="error" role="alert" sx={{ borderRadius: 2 }}>
                  {errorMessage(actionError)}
                </Alert>
              )}
            </Stack>
          )}

          {token && !isPending && refused && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              This invitation link cannot be used.
            </Alert>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Join;

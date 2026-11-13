import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  getJoinForm,
  requestJoinOtp,
  resolveInvitation,
  resumeJoinSession,
  saveJoinForm,
  verifyJoinOtp,
  type JoinEducationRow,
  type JoinEmploymentRow,
  type JoinFormDraft,
  type JoinReferenceRow,
} from '../../api/services';

const JOIN_TOKEN_KEY = 'join_access_token';

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
  nationality: '',
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
  references: [emptyReference(), emptyReference()],
  bankAccountHolderName: '',
  bankName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankBranch: '',
};

const errorMessage = (error: any): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message || 'Something went wrong. Please try again.';
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
  const queryClient = useQueryClient();

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
      nationality: draft.nationality || '',
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
      references: draft.references?.length ? draft.references : [emptyReference(), emptyReference()],
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
    },
  });

  const verifyOtp = useMutation({
    mutationFn: () => verifyJoinOtp(token, code.trim()),
    onSuccess: async (session) => {
      sessionStorage.setItem(JOIN_TOKEN_KEY, session.accessToken);
      setAccessToken(session.accessToken);
      setStatusMessage('Email verified. Fill and save your joining details below.');
      await queryClient.invalidateQueries({ queryKey: ['join', token] });
    },
  });

  const saveForm = useMutation({
    mutationFn: () => saveJoinForm(accessToken, form),
    onSuccess: (draft) => {
      setSavedAt(draft.formDraftSavedAt || draft.personalSectionSavedAt);
      setStatusMessage('All details saved. You can return later with the same invitation link.');
      queryClient.setQueryData(['join-form', accessToken], draft);
    },
  });

  const setField = (key: keyof typeof emptyForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateEducation = (index: number, key: keyof JoinEducationRow, value: string) => {
    setForm((current) => ({
      ...current,
      education: current.education.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  };

  const updateEmployment = (index: number, key: keyof JoinEmploymentRow, value: string) => {
    setForm((current) => ({
      ...current,
      previousEmployment: current.previousEmployment.map((row, i) =>
        i === index ? { ...row, [key]: value } : row,
      ),
    }));
  };

  const updateReference = (index: number, key: keyof JoinReferenceRow, value: string) => {
    setForm((current) => ({
      ...current,
      references: current.references.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  };

  const actionError = sendOtp.error || verifyOtp.error || saveForm.error || formQuery.error;
  const showForm = Boolean(accessToken) && verified;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f7fb', px: { xs: 2, md: 5 }, py: { xs: 4, md: 8 } }}>
      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#0f63a5' }} mb={0.5}>
          Team RW
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Employee joining invitation
        </Typography>

        <Paper sx={{ p: { xs: 2.5, md: 4 } }}>
          {!token && <Alert severity="error">This invitation link cannot be used.</Alert>}

          {token && isPending && (
            <Stack alignItems="center" spacing={2} py={2}>
              <CircularProgress size={28} />
              <Typography color="text.secondary">Checking your invitation…</Typography>
            </Stack>
          )}

          {token && !isPending && data?.valid && (
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={700}>
                Hello, {data.firstName}
              </Typography>

              {!showForm && verified && (
                <Stack alignItems="center" spacing={2} py={2}>
                  <CircularProgress size={28} />
                  <Typography color="text.secondary">Opening your joining form…</Typography>
                </Stack>
              )}

              {!showForm && !verified && (
                <>
                  <Typography color="text.secondary">
                    We will send a one-time code to {data.maskedEmail}. Enter that code to confirm
                    this invitation is yours.
                  </Typography>
                  <Button variant="contained" onClick={() => sendOtp.mutate()} disabled={sendOtp.isPending}>
                    {sendOtp.isPending ? 'Sending…' : otpSent ? 'Resend code' : 'Send verification code'}
                  </Button>
                  {(otpSent || statusMessage) && (
                    <TextField
                      label="6-digit code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                      fullWidth
                    />
                  )}
                  {(otpSent || statusMessage) && (
                    <Button
                      variant="outlined"
                      onClick={() => verifyOtp.mutate()}
                      disabled={verifyOtp.isPending || code.trim().length !== 6}
                    >
                      {verifyOtp.isPending ? 'Checking…' : 'Verify email'}
                    </Button>
                  )}
                </>
              )}

              {showForm && (
                <>
                  <Alert severity="success">
                    Email verified. Complete all sections below. Save anytime and return with the same
                    link.
                  </Alert>

                  {formQuery.isPending ? (
                    <Stack alignItems="center" py={2}>
                      <CircularProgress size={24} />
                    </Stack>
                  ) : (
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="h6" fontWeight={700} mb={1.5}>
                          Personal and contact
                        </Typography>
                        <Stack spacing={2}>
                          <TextField label="Phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} fullWidth required />
                          <TextField label="Alternate phone" value={form.alternatePhone} onChange={(e) => setField('alternatePhone', e.target.value)} fullWidth />
                          <TextField label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                          <TextField label="Gender" value={form.gender} onChange={(e) => setField('gender', e.target.value)} fullWidth />
                          <TextField label="Father's name" value={form.fatherName} onChange={(e) => setField('fatherName', e.target.value)} fullWidth />
                          <TextField label="Mother's name" value={form.motherName} onChange={(e) => setField('motherName', e.target.value)} fullWidth />
                          <TextField label="Marital status" value={form.maritalStatus} onChange={(e) => setField('maritalStatus', e.target.value)} fullWidth />
                          <TextField label="Spouse name" value={form.spouseName} onChange={(e) => setField('spouseName', e.target.value)} fullWidth />
                          <TextField label="Blood group" value={form.bloodGroup} onChange={(e) => setField('bloodGroup', e.target.value)} fullWidth />
                          <TextField label="Nationality" value={form.nationality} onChange={(e) => setField('nationality', e.target.value)} fullWidth />
                          <TextField label="Current city" value={form.currentCity} onChange={(e) => setField('currentCity', e.target.value)} fullWidth />
                          <TextField label="Hometown" value={form.hometown} onChange={(e) => setField('hometown', e.target.value)} fullWidth />
                          <TextField label="Languages known" value={form.languagesKnown} onChange={(e) => setField('languagesKnown', e.target.value)} fullWidth />
                          <TextField label="Current address" value={form.currentAddress} onChange={(e) => setField('currentAddress', e.target.value)} fullWidth multiline minRows={2} />
                          <TextField label="Permanent address" value={form.permanentAddress} onChange={(e) => setField('permanentAddress', e.target.value)} fullWidth multiline minRows={2} />
                          <TextField label="Emergency contact name" value={form.emergencyContactName} onChange={(e) => setField('emergencyContactName', e.target.value)} fullWidth />
                          <TextField label="Emergency contact phone" value={form.emergencyContactPhone} onChange={(e) => setField('emergencyContactPhone', e.target.value)} fullWidth />
                          <TextField label="Emergency contact relation" value={form.emergencyContactRelation} onChange={(e) => setField('emergencyContactRelation', e.target.value)} fullWidth />
                        </Stack>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="h6" fontWeight={700} mb={1.5}>
                          Professional extras
                        </Typography>
                        <Stack spacing={2}>
                          <TextField label="Total experience (years)" value={form.totalExperienceYears} onChange={(e) => setField('totalExperienceYears', e.target.value)} fullWidth />
                          <TextField label="Notice period (days)" value={form.noticePeriodDays} onChange={(e) => setField('noticePeriodDays', e.target.value)} fullWidth />
                          <TextField label="LinkedIn URL" value={form.linkedInUrl} onChange={(e) => setField('linkedInUrl', e.target.value)} fullWidth />
                          <TextField label="Passport number" value={form.passportNumber} onChange={(e) => setField('passportNumber', e.target.value)} fullWidth />
                          <TextField label="Driving licence number" value={form.drivingLicenseNumber} onChange={(e) => setField('drivingLicenseNumber', e.target.value)} fullWidth />
                          <TextField label="UAN number" value={form.uanNumber} onChange={(e) => setField('uanNumber', e.target.value)} fullWidth />
                          <TextField label="PF number" value={form.pfNumber} onChange={(e) => setField('pfNumber', e.target.value)} fullWidth />
                          <TextField label="ESI number" value={form.esiNumber} onChange={(e) => setField('esiNumber', e.target.value)} fullWidth />
                        </Stack>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="h6" fontWeight={700} mb={1.5}>
                          Education
                        </Typography>
                        <Stack spacing={2}>
                          {form.education.map((row, index) => (
                            <Paper key={`edu-${index}`} variant="outlined" sx={{ p: 2 }}>
                              <Stack spacing={2}>
                                <Typography variant="subtitle2">Qualification {index + 1}</Typography>
                                <TextField label="Degree / qualification" value={row.qualification} onChange={(e) => updateEducation(index, 'qualification', e.target.value)} fullWidth />
                                <TextField label="Institution" value={row.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} fullWidth />
                                <TextField label="Year of passing" value={row.yearOfPassing} onChange={(e) => updateEducation(index, 'yearOfPassing', e.target.value)} fullWidth />
                                <TextField label="Percentage / CGPA" value={row.percentageOrCgpa} onChange={(e) => updateEducation(index, 'percentageOrCgpa', e.target.value)} fullWidth />
                                <TextField label="Specialization" value={row.specialization} onChange={(e) => updateEducation(index, 'specialization', e.target.value)} fullWidth />
                                {form.education.length > 1 && (
                                  <Button color="inherit" onClick={() => setForm((c) => ({ ...c, education: c.education.filter((_, i) => i !== index) }))}>
                                    Remove
                                  </Button>
                                )}
                              </Stack>
                            </Paper>
                          ))}
                          <Button variant="outlined" onClick={() => setForm((c) => ({ ...c, education: [...c.education, emptyEducation()] }))}>
                            Add education
                          </Button>
                        </Stack>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="h6" fontWeight={700} mb={1.5}>
                          Previous employment
                        </Typography>
                        <FormControlLabel
                          control={<Checkbox checked={form.isFresher} onChange={(e) => setField('isFresher', e.target.checked)} />}
                          label="I am a fresher (no previous employment)"
                        />
                        {!form.isFresher && (
                          <Stack spacing={2} mt={1}>
                            {form.previousEmployment.map((row, index) => (
                              <Paper key={`emp-${index}`} variant="outlined" sx={{ p: 2 }}>
                                <Stack spacing={2}>
                                  <Typography variant="subtitle2">Employer {index + 1}</Typography>
                                  <TextField label="Company name" value={row.companyName} onChange={(e) => updateEmployment(index, 'companyName', e.target.value)} fullWidth />
                                  <TextField label="Designation" value={row.designation} onChange={(e) => updateEmployment(index, 'designation', e.target.value)} fullWidth />
                                  <TextField label="From (YYYY-MM)" value={row.fromDate} onChange={(e) => updateEmployment(index, 'fromDate', e.target.value)} fullWidth />
                                  <TextField label="To (YYYY-MM)" value={row.toDate} onChange={(e) => updateEmployment(index, 'toDate', e.target.value)} fullWidth />
                                  <TextField label="Last CTC" value={row.lastCtc} onChange={(e) => updateEmployment(index, 'lastCtc', e.target.value)} fullWidth />
                                  <TextField label="Reason for leaving" value={row.reasonForLeaving} onChange={(e) => updateEmployment(index, 'reasonForLeaving', e.target.value)} fullWidth />
                                  <TextField label="Manager / reference name" value={row.referenceName} onChange={(e) => updateEmployment(index, 'referenceName', e.target.value)} fullWidth />
                                  <TextField label="Manager / reference phone" value={row.referencePhone} onChange={(e) => updateEmployment(index, 'referencePhone', e.target.value)} fullWidth />
                                  {form.previousEmployment.length > 1 && (
                                    <Button color="inherit" onClick={() => setForm((c) => ({ ...c, previousEmployment: c.previousEmployment.filter((_, i) => i !== index) }))}>
                                      Remove
                                    </Button>
                                  )}
                                </Stack>
                              </Paper>
                            ))}
                            <Button variant="outlined" onClick={() => setForm((c) => ({ ...c, previousEmployment: [...c.previousEmployment, emptyEmployment()] }))}>
                              Add employer
                            </Button>
                          </Stack>
                        )}
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="h6" fontWeight={700} mb={1.5}>
                          References
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={1.5}>
                          Add at least two people who can confirm your background (not family unless asked).
                        </Typography>
                        <Stack spacing={2}>
                          {form.references.map((row, index) => (
                            <Paper key={`ref-${index}`} variant="outlined" sx={{ p: 2 }}>
                              <Stack spacing={2}>
                                <Typography variant="subtitle2">Reference {index + 1}</Typography>
                                <TextField label="Full name" value={row.name} onChange={(e) => updateReference(index, 'name', e.target.value)} fullWidth />
                                <TextField label="Relation" value={row.relation} onChange={(e) => updateReference(index, 'relation', e.target.value)} fullWidth />
                                <TextField label="Phone" value={row.phone} onChange={(e) => updateReference(index, 'phone', e.target.value)} fullWidth />
                                <TextField label="Email" value={row.email} onChange={(e) => updateReference(index, 'email', e.target.value)} fullWidth />
                                <TextField label="Organization" value={row.organization} onChange={(e) => updateReference(index, 'organization', e.target.value)} fullWidth />
                                <TextField label="Designation" value={row.designation} onChange={(e) => updateReference(index, 'designation', e.target.value)} fullWidth />
                                <TextField label="Address" value={row.address} onChange={(e) => updateReference(index, 'address', e.target.value)} fullWidth multiline minRows={2} />
                                <TextField label="Years known" value={row.yearsKnown} onChange={(e) => updateReference(index, 'yearsKnown', e.target.value)} fullWidth />
                                {form.references.length > 1 && (
                                  <Button color="inherit" onClick={() => setForm((c) => ({ ...c, references: c.references.filter((_, i) => i !== index) }))}>
                                    Remove
                                  </Button>
                                )}
                              </Stack>
                            </Paper>
                          ))}
                          <Button variant="outlined" onClick={() => setForm((c) => ({ ...c, references: [...c.references, emptyReference()] }))}>
                            Add reference
                          </Button>
                        </Stack>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="h6" fontWeight={700} mb={1.5}>
                          Bank details
                        </Typography>
                        <Stack spacing={2}>
                          <TextField label="Account holder name" value={form.bankAccountHolderName} onChange={(e) => setField('bankAccountHolderName', e.target.value)} fullWidth />
                          <TextField label="Bank name" value={form.bankName} onChange={(e) => setField('bankName', e.target.value)} fullWidth />
                          <TextField label="Account number" value={form.bankAccountNumber} onChange={(e) => setField('bankAccountNumber', e.target.value)} fullWidth />
                          <TextField label="IFSC" value={form.bankIfsc} onChange={(e) => setField('bankIfsc', e.target.value.toUpperCase())} fullWidth />
                          <TextField label="Branch" value={form.bankBranch} onChange={(e) => setField('bankBranch', e.target.value)} fullWidth />
                        </Stack>
                      </Box>

                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => saveForm.mutate()}
                        disabled={saveForm.isPending || !form.phone.trim()}
                      >
                        {saveForm.isPending ? 'Saving…' : 'Save all details'}
                      </Button>
                      {savedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Last saved {new Date(savedAt).toLocaleString()}
                        </Typography>
                      )}
                    </Stack>
                  )}
                </>
              )}

              {statusMessage && <Alert severity="info">{statusMessage}</Alert>}
              {actionError && <Alert severity="error">{errorMessage(actionError)}</Alert>}
            </Stack>
          )}

          {token && !isPending && refused && (
            <Alert severity="error">This invitation link cannot be used.</Alert>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Join;

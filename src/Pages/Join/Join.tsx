import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { requestJoinOtp, resolveInvitation, verifyJoinOtp } from '../../api/services';

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
  const queryClient = useQueryClient();

  const { data, isPending, isError } = useQuery({
    queryKey: ['join', token],
    queryFn: () => resolveInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });

  const sendOtp = useMutation({
    mutationFn: () => requestJoinOtp(token),
    onSuccess: (response) => {
      setOtpSent(true);
      setStatusMessage(response.message);
    },
  });

  const verifyOtp = useMutation({
    mutationFn: () => verifyJoinOtp(token, code.trim()),
    onSuccess: async () => {
      setStatusMessage('Email verified. You can continue onboarding.');
      await queryClient.invalidateQueries({ queryKey: ['join', token] });
    },
  });

  const refused = !token || isError || (!isPending && !data?.valid);
  const verified = Boolean(data?.emailVerified);
  const actionError = sendOtp.error || verifyOtp.error;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f7fb', px: { xs: 2, md: 5 }, py: { xs: 4, md: 8 } }}>
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#0f63a5' }} mb={0.5}>
          Team RW
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Employee joining invitation
        </Typography>

        <Paper sx={{ p: { xs: 2.5, md: 4 } }}>
          {!token && (
            <Alert severity="error">This invitation link cannot be used.</Alert>
          )}

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

              {verified ? (
                <Alert severity="success">
                  Your email is verified. The next step is your joining form.
                </Alert>
              ) : (
                <>
                  <Typography color="text.secondary">
                    We will send a one-time code to {data.maskedEmail}. Enter that code to confirm
                    this invitation is yours.
                  </Typography>

                  <Button
                    variant="contained"
                    onClick={() => sendOtp.mutate()}
                    disabled={sendOtp.isPending}
                  >
                    {sendOtp.isPending
                      ? 'Sending…'
                      : otpSent
                        ? 'Resend code'
                        : 'Send verification code'}
                  </Button>

                  {(otpSent || statusMessage) && (
                    <TextField
                      label="6-digit code"
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
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

              {statusMessage && !verified && (
                <Alert severity="info">{statusMessage}</Alert>
              )}

              {actionError && (
                <Alert severity="error">{errorMessage(actionError)}</Alert>
              )}
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

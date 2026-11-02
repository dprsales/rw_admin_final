import React from 'react';
import { Alert, Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { resolveInvitation } from '../../api/services';

const Join: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const { data, isPending, isError } = useQuery({
    queryKey: ['join', token],
    queryFn: () => resolveInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });

  const refused = !token || isError || (!isPending && !data?.valid);

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
            <Stack spacing={1.5}>
              <Typography variant="h5" fontWeight={700}>
                Hello, {data.firstName}
              </Typography>
              <Typography color="text.secondary">
                Your invitation is valid. The next step is email verification.
              </Typography>
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

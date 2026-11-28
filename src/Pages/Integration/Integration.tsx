import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import Cookies from 'js-cookie';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import PageHeader from '../../Components/PageHeader';
import { getWhatsappAgentStatus, setWhatsappControls } from '../../api/services';
import { tokens } from '../../Theme/tokens';

function isSuperAdmin(): boolean {
  return String(Cookies.get('user_type') || '').toLowerCase() === 'super_admin';
}

const IntegrationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const superAdmin = isSuperAdmin();

  const agentQuery = useQuery({
    queryKey: ['whatsapp-agent'],
    queryFn: getWhatsappAgentStatus,
  });

  const toggleMutation = useMutation({
    mutationFn: (patch: { agentEnabled?: boolean; autoTemplatesEnabled?: boolean }) =>
      setWhatsappControls(patch),
    onSuccess: (data) => {
      toast.success(data.message || 'Saved');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-agent'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(' ')
          : message || 'Could not update WhatsApp controls.',
      );
    },
  });

  const status = agentQuery.data;
  const agentOn = Boolean(status?.agentEnabled ?? status?.enabled);
  const autoOn = Boolean(status?.autoTemplatesEnabled);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, maxWidth: 720, mx: 'auto' }}>
      <PageHeader
        title="Integrations"
        description="WhatsApp on/off lives here. No env push for day-to-day switches."
        crumbs={[{ label: 'Integrations' }]}
      />

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          border: `1px solid ${tokens.border}`,
          borderRadius: 2,
          bgcolor: tokens.panel,
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              WhatsApp (AiSensy)
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.textMuted, mt: 0.5 }}>
              Super admin controls. API key and campaign names stay on the server. These toggles
              save to the database instantly.
            </Typography>
          </Box>

          {agentQuery.isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={26} />
            </Box>
          ) : agentQuery.isError ? (
            <Alert severity="warning">Could not load status. Is the API running with latest code?</Alert>
          ) : (
            <>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={2}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    AI agent (night / inbound replies)
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.textMuted }}>
                    When someone messages the Cloud API number. Never quotes price. Keep published
                    in AiSensy when this is on.
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={agentOn ? 'ON' : 'OFF'}
                  sx={{
                    fontWeight: 700,
                    bgcolor: agentOn ? tokens.successSoft : tokens.dangerSoft,
                    color: agentOn ? tokens.successText : tokens.dangerText,
                  }}
                />
                <Switch
                  checked={agentOn}
                  disabled={!superAdmin || toggleMutation.isPending}
                  onChange={(_e, checked) =>
                    toggleMutation.mutate({ agentEnabled: checked })
                  }
                  color="primary"
                />
              </Stack>

              <Divider sx={{ borderColor: tokens.border }} />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={2}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Auto template campaigns
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.textMuted }}>
                    Form ack / nurture timers from our API. Desk manual Send WhatsApp still works
                    when this is off.
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={autoOn ? 'ON' : 'OFF'}
                  sx={{
                    fontWeight: 700,
                    bgcolor: autoOn ? tokens.successSoft : tokens.dangerSoft,
                    color: autoOn ? tokens.successText : tokens.dangerText,
                  }}
                />
                <Switch
                  checked={autoOn}
                  disabled={!superAdmin || toggleMutation.isPending}
                  onChange={(_e, checked) =>
                    toggleMutation.mutate({ autoTemplatesEnabled: checked })
                  }
                  color="primary"
                />
              </Stack>

              {!superAdmin ? (
                <Alert severity="info">Only super admin can flip these switches.</Alert>
              ) : null}

              <Alert severity="info">
                <Typography variant="body2">{status?.note}</Typography>
                <Typography
                  variant="caption"
                  sx={{ color: tokens.textMuted, display: 'block', mt: 0.5 }}
                >
                  API key: {status?.configured ? 'configured' : 'missing on server'}
                </Typography>
              </Alert>

              <Button
                variant="outlined"
                href="https://www.app.aisensy.com/"
                target="_blank"
                rel="noreferrer"
                sx={{ textTransform: 'none', alignSelf: 'flex-start', fontWeight: 600 }}
              >
                Open AiSensy
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default IntegrationPage;

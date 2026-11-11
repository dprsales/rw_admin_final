import React, { useMemo } from 'react';
import {
  Drawer, Box, Typography, Button, Chip, Divider, Stack, Link, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  FORM_ANSWER_LABELS,
  FORM_TRACK_LABEL,
  INTENT_LABEL,
  KrisahStatusChip,
  Lead,
  leadSourceLabel,
  SERVICE_LABEL,
  VISITOR_LABEL,
} from './Leads';

interface LeadModalProps {
  open: boolean;
  handleClose: () => void;
  lead: Lead;
}

function formatAnswerValue(raw: unknown): string {
  if (raw == null || raw === '') return '';
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean).join(', ');
  if (typeof raw === 'object') return '';
  return String(raw);
}

function answerLabel(key: string): string {
  if (FORM_ANSWER_LABELS[key]) return FORM_ANSWER_LABELS[key];
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()).trim();
}

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1.5, py: 0.85, alignItems: 'start' }}>
    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.02, pt: 0.2 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {children || '-'}
    </Typography>
  </Box>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ mb: 3 }}>
    <Typography
      variant="overline"
      sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, letterSpacing: 0.08, mb: 1 }}
    >
      {title}
    </Typography>
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 2,
        py: 0.5,
        bgcolor: '#fafbfc',
      }}
    >
      {children}
    </Box>
  </Box>
);

const LeadModal: React.FC<LeadModalProps> = ({ open, handleClose, lead }) => {
  const hasGuidance = Boolean(
    lead.visitorType || lead.challenge || lead.challengeNote || lead.goal || lead.recommendedService,
  );

  const formRows = useMemo(() => {
    const answers = lead.formAnswers || {};
    const skip = new Set(['name', 'phone', 'email', 'finder']);
    return Object.entries(answers)
      .filter(([key, value]) => !skip.has(key) && formatAnswerValue(value))
      .map(([key, value]) => ({ key, label: answerLabel(key), value: formatAnswerValue(value) }));
  }, [lead.formAnswers]);

  const trackLabel = lead.formTrack
    ? (FORM_TRACK_LABEL[lead.formTrack] || lead.formTrack)
    : null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520, md: 600 },
          maxWidth: '100vw',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography id="lead-modal-title" variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                {lead.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {lead.email}
                {lead.phoneNumber ? ` · ${lead.phoneNumber}` : ''}
              </Typography>
            </Box>
            <IconButton aria-label="Close lead details" onClick={handleClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.75 }}>
            <Chip size="small" label={trackLabel || lead.type} sx={{ fontWeight: 600, textTransform: 'capitalize' }} />
            <Chip size="small" variant="outlined" label={leadSourceLabel(lead)} />
            {lead.intent && (
              <Chip size="small" variant="outlined" label={INTENT_LABEL[lead.intent] || lead.intent} />
            )}
            {lead.recommendedService && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={SERVICE_LABEL[lead.recommendedService] || lead.recommendedService}
              />
            )}
            <KrisahStatusChip lead={lead} />
          </Stack>
        </Box>

        <Box sx={{ px: 3, py: 2.5, overflowY: 'auto', flex: 1 }}>
          <Section title="Contact">
            <FieldRow label="Name">{lead.name}</FieldRow>
            <Divider />
            <FieldRow label="Email">
              <Link href={`mailto:${lead.email}`} underline="hover">{lead.email}</Link>
            </FieldRow>
            <Divider />
            <FieldRow label="Phone">
              <Link href={`tel:${lead.phoneNumber}`} underline="hover">{lead.phoneNumber}</Link>
            </FieldRow>
            {lead.company && (
              <>
                <Divider />
                <FieldRow label="Company">{lead.company}</FieldRow>
              </>
            )}
            {lead.projectName && (
              <>
                <Divider />
                <FieldRow label="Project">{lead.projectName}</FieldRow>
              </>
            )}
          </Section>

          <Section title="Capture">
            <FieldRow label="Source">
              {leadSourceLabel(lead)}
              {lead.pageSource ? ` · ${lead.pageSource}` : ''}
            </FieldRow>
            <Divider />
            <FieldRow label="Intent">{INTENT_LABEL[lead.intent || ''] || lead.intent || 'Enquiry'}</FieldRow>
            <Divider />
            <FieldRow label="Service">
              {lead.recommendedService
                ? (SERVICE_LABEL[lead.recommendedService] || lead.recommendedService)
                : '-'}
            </FieldRow>
            <Divider />
            <FieldRow label="Received">
              {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '-'}
            </FieldRow>
            {lead.formSubmittedAt && (
              <>
                <Divider />
                <FieldRow label="Form submitted">
                  {new Date(lead.formSubmittedAt).toLocaleString()}
                </FieldRow>
              </>
            )}
            {lead.enquiries && lead.enquiries > 1 && (
              <>
                <Divider />
                <FieldRow label="Touches">{String(lead.enquiries)}</FieldRow>
              </>
            )}
            <Divider />
            <FieldRow label="KRISAH">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <KrisahStatusChip lead={lead} />
                {lead.krisahCompletedAt
                  ? ` · ${new Date(lead.krisahCompletedAt).toLocaleDateString()}`
                  : ''}
              </Box>
            </FieldRow>
          </Section>

          {formRows.length > 0 && (
            <Section title={`Service form${trackLabel ? ` · ${trackLabel}` : ''}`}>
              {formRows.map((row, index) => (
                <React.Fragment key={row.key}>
                  {index > 0 && <Divider />}
                  <FieldRow label={row.label}>{row.value}</FieldRow>
                </React.Fragment>
              ))}
            </Section>
          )}

          {hasGuidance && (
            <Section title="Guided finder">
              {(lead.visitorType || lead.challenge || lead.goal) && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, py: 1.25 }}>
                  {lead.visitorType && (
                    <Chip size="small" label={VISITOR_LABEL[lead.visitorType] || lead.visitorType} />
                  )}
                  {lead.challenge && (
                    <Chip size="small" variant="outlined" label={lead.challenge.replace(/_/g, ' ')} />
                  )}
                  {lead.goal && (
                    <Chip size="small" variant="outlined" label={lead.goal.replace(/_/g, ' ')} />
                  )}
                </Box>
              )}
              {lead.challengeNote && (
                <>
                  <Divider />
                  <FieldRow label="In their words">{lead.challengeNote}</FieldRow>
                </>
              )}
              {lead.recommendedService && (
                <>
                  <Divider />
                  <FieldRow label="Recommended">
                    {SERVICE_LABEL[lead.recommendedService] || lead.recommendedService}
                  </FieldRow>
                </>
              )}
            </Section>
          )}

          {!!lead.contentDownloads?.length && (
            <Section title="Content downloads">
              {lead.contentDownloads.map((item, index) => (
                <React.Fragment key={`${item.fileId || item.fileName || index}`}>
                  {index > 0 && <Divider />}
                  <FieldRow label={item.date || item.at || `File ${index + 1}`}>
                    {item.title || item.fileName || item.fileId || '-'}
                  </FieldRow>
                </React.Fragment>
              ))}
            </Section>
          )}

          <Section title="Notes / message">
            <Box sx={{ py: 1.25 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: lead.message ? 'text.primary' : 'text.secondary' }}>
                {lead.message || 'No message recorded.'}
              </Typography>
            </Box>
          </Section>
        </Box>

        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'flex-end',
            bgcolor: 'background.paper',
          }}
        >
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default LeadModal;

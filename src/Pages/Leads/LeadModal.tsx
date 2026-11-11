import React, { useEffect, useMemo, useState } from 'react';
import {
  Drawer, Box, Typography, Button, Chip, Divider, Stack, Link, IconButton,
  FormControl, InputLabel, Select, MenuItem, TextField, Alert, Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CRM_SOURCE_LABEL,
  FORM_ANSWER_LABELS,
  FORM_TRACK_LABEL,
  INTENT_LABEL,
  KrisahStatusChip,
  Lead,
  leadSourceLabel,
  LOST_REASON_OPTIONS,
  NEXT_ACTION_OPTIONS,
  SERVICE_LABEL,
  STAGE_LABEL,
  STAGE_OPTIONS,
  TEMPERATURE_OPTIONS,
  VISITOR_LABEL,
} from './Leads';
import { getLeadActivities, updateLead } from '../../api/services';

interface LeadModalProps {
  open: boolean;
  handleClose: () => void;
  lead: Lead;
}

type LeadActivityRow = {
  _id: string;
  type: 'note' | 'stage_change';
  note?: string;
  fromStage?: string;
  toStage?: string;
  createdAt?: string;
};

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

/** Convert ISO / Date string to datetime-local value (local wall clock). */
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const queryClient = useQueryClient();
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

  const [stage, setStage] = useState(lead.stage || 'new_lead');
  const [temperature, setTemperature] = useState(lead.temperature || 'cold');
  const [lostReason, setLostReason] = useState(lead.lostReason || '');
  const [nextAction, setNextAction] = useState(lead.nextAction || '');
  const [nextFollowUpAt, setNextFollowUpAt] = useState(toLocalInput(lead.nextFollowUpAt));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setStage(lead.stage || 'new_lead');
    setTemperature(lead.temperature || 'cold');
    setLostReason(lead.lostReason || '');
    setNextAction(lead.nextAction || '');
    setNextFollowUpAt(toLocalInput(lead.nextFollowUpAt));
    setNote('');
    setError('');
  }, [open, lead]);

  const activitiesQuery = useQuery({
    queryKey: ['lead-activities', lead._id],
    queryFn: () => getLeadActivities(lead._id),
    enabled: open && Boolean(lead._id),
  });

  const activities: LeadActivityRow[] = activitiesQuery.data?.activities || [];

  const saveMutation = useMutation({
    mutationFn: () => {
      const followUpIso = nextFollowUpAt
        ? new Date(nextFollowUpAt).toISOString()
        : undefined;
      return updateLead(lead._id, {
        stage,
        temperature,
        ...(stage === 'lost' ? { lostReason, status: 'lost' } : {}),
        ...(stage === 'won_booked' ? { status: 'won' } : {}),
        ...(stage === 'nurture' ? { status: 'nurture' } : {}),
        ...(nextAction ? { nextAction } : {}),
        ...(followUpIso ? { nextFollowUpAt: followUpIso } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities', lead._id] });
      setNote('');
      handleClose();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : null) ||
        'Could not save CRM fields.';
      setError(typeof msg === 'string' ? msg : 'Could not save CRM fields.');
    },
  });

  const noteOnlyMutation = useMutation({
    mutationFn: () => updateLead(lead._id, { note: note.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities', lead._id] });
      setNote('');
      setError('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not save note.';
      setError(typeof msg === 'string' ? msg : 'Could not save note.');
    },
  });

  const dirty =
    stage !== (lead.stage || 'new_lead') ||
    temperature !== (lead.temperature || 'cold') ||
    (stage === 'lost' && lostReason !== (lead.lostReason || '')) ||
    nextAction !== (lead.nextAction || '') ||
    nextFollowUpAt !== toLocalInput(lead.nextFollowUpAt);

  const canSave = dirty && (stage !== 'lost' || Boolean(lostReason));
  const canSaveNote = Boolean(note.trim()) && !dirty;

  const activityLabel = (row: LeadActivityRow) => {
    if (row.type === 'stage_change') {
      const from = STAGE_LABEL[row.fromStage || ''] || row.fromStage || '-';
      const to = STAGE_LABEL[row.toStage || ''] || row.toStage || '-';
      return `Stage: ${from} → ${to}`;
    }
    return 'Note';
  };

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
          <Section title="CRM">
            <Box sx={{ py: 1.5 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="lead-stage-label">Stage</InputLabel>
                    <Select
                      labelId="lead-stage-label"
                      label="Stage"
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                    >
                      {STAGE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="lead-temp-label">Temperature</InputLabel>
                    <Select
                      labelId="lead-temp-label"
                      label="Temperature"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                    >
                      {TEMPERATURE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {stage === 'lost' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel id="lead-lost-label">Lost reason</InputLabel>
                      <Select
                        labelId="lead-lost-label"
                        label="Lost reason"
                        value={lostReason}
                        onChange={(e) => setLostReason(e.target.value)}
                      >
                        {LOST_REASON_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="lead-next-action-label">Next action</InputLabel>
                    <Select
                      labelId="lead-next-action-label"
                      label="Next action"
                      value={nextAction}
                      onChange={(e) => setNextAction(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {NEXT_ACTION_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Follow-up due"
                    type="datetime-local"
                    value={nextFollowUpAt}
                    onChange={(e) => setNextFollowUpAt(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                Status: {lead.status || 'open'}
                {' · '}
                CRM source: {CRM_SOURCE_LABEL[lead.crmSource || ''] || lead.crmSource || '-'}
              </Typography>
            </Box>
          </Section>

          <Section title="Activity">
            <Box sx={{ py: 1.25 }}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="Add a note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                sx={{ mb: 1.5 }}
              />
              {canSaveNote && (
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2 }}
                  disabled={noteOnlyMutation.isPending}
                  onClick={() => noteOnlyMutation.mutate()}
                >
                  {noteOnlyMutation.isPending ? 'Saving note…' : 'Save note'}
                </Button>
              )}
              {activitiesQuery.isLoading && (
                <Typography variant="body2" color="text.secondary">Loading activity…</Typography>
              )}
              {!activitiesQuery.isLoading && activities.length === 0 && (
                <Typography variant="body2" color="text.secondary">No activity yet.</Typography>
              )}
              {activities.map((row) => (
                <Box key={row._id} sx={{ mb: 1.25 }}>
                  <Typography variant="caption" color="text.secondary">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {activityLabel(row)}
                  </Typography>
                  {row.note && (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {row.note}
                    </Typography>
                  )}
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </Box>
          </Section>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
            gap: 1,
            bgcolor: 'background.paper',
          }}
        >
          <Button onClick={handleClose} variant="outlined">
            Close
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            variant="contained"
            disabled={!canSave || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save CRM'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default LeadModal;

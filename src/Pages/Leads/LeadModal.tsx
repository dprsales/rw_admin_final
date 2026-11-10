import React, { useEffect, useState } from 'react';
import {
  Modal, Box, Typography, Button, Grid, Chip, FormControl, InputLabel, Select, MenuItem, Alert,
  TextField, Divider,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CRM_SOURCE_LABEL,
  KrisahStatusChip,
  Lead,
  leadSourceLabel,
  LOST_REASON_OPTIONS,
  NEXT_ACTION_LABEL,
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

const LeadModal: React.FC<LeadModalProps> = ({ open, handleClose, lead }) => {
  const queryClient = useQueryClient();
  const hasGuidance = Boolean(lead.visitorType || lead.challenge || lead.challengeNote || lead.goal || lead.recommendedService);

  const [stage, setStage] = useState(lead.stage || 'new_lead');
  const [temperature, setTemperature] = useState(lead.temperature || 'cold');
  const [lostReason, setLostReason] = useState(lead.lostReason || '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setStage(lead.stage || 'new_lead');
    setTemperature(lead.temperature || 'cold');
    setLostReason(lead.lostReason || '');
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
    mutationFn: () =>
      updateLead(lead._id, {
        stage,
        temperature,
        ...(stage === 'lost' ? { lostReason, status: 'lost' } : {}),
        ...(stage === 'won_booked' ? { status: 'won' } : {}),
        ...(stage === 'nurture' ? { status: 'nurture' } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
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
        'Could not save stage / temperature.';
      setError(typeof msg === 'string' ? msg : 'Could not save stage / temperature.');
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
    (stage === 'lost' && lostReason !== (lead.lostReason || ''));

  const canSave = dirty && (stage !== 'lost' || Boolean(lostReason));
  const canSaveNote = Boolean(note.trim()) && !dirty;

  const activityLabel = (row: LeadActivityRow) => {
    if (row.type === 'stage_change') {
      const from = STAGE_LABEL[row.fromStage || ''] || row.fromStage || '—';
      const to = STAGE_LABEL[row.toStage || ''] || row.toStage || '—';
      return `Stage: ${from} → ${to}`;
    }
    return 'Note';
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="lead-modal-title"
      aria-describedby="lead-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(560px, calc(100vw - 32px))',
          maxHeight: '90vh',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          borderRadius: '10px',
          boxShadow: 24,
          p: 4,
          outline: 'none',
        }}
      >
        <Typography
          id="lead-modal-title"
          variant="h6"
          component="h2"
          sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}
        >
          {lead.type === 'project' && lead.projectName
            ? `Project Lead Details (Source: ${lead.projectName})`
            : 'Lead Details'}
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Personal Information:
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Typography variant="body2"><strong>Name:</strong> {lead.name}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2"><strong>Email:</strong> {lead.email}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2"><strong>Phone Number:</strong> {lead.phoneNumber}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              <strong>Date:</strong> {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '-'}
            </Typography>
          </Grid>
          {lead.company && (
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Company:</strong> {lead.company}</Typography>
            </Grid>
          )}
          <Grid item xs={6}>
            <Typography variant="body2">
              <strong>Source:</strong> {leadSourceLabel(lead)}
              {lead.pageSource && lead.source !== 'assessment' ? ` · ${lead.pageSource}` : ''}
              {lead.enquiries && lead.enquiries > 1 ? ` · ${lead.enquiries} enquiries` : ''}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <strong>KRISAH:</strong>
              <KrisahStatusChip lead={lead} />
              {lead.krisahCompletedAt ? ` · ${new Date(lead.krisahCompletedAt).toLocaleDateString()}` : ''}
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          CRM (locked stage list):
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
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
          <Grid item xs={6}>
            <Typography variant="body2"><strong>Status:</strong> {lead.status || 'open'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              <strong>CRM source:</strong>{' '}
              {CRM_SOURCE_LABEL[lead.crmSource || ''] || lead.crmSource || '-'}
            </Typography>
          </Grid>
          {lead.budget && (
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Budget:</strong> {lead.budget}</Typography>
            </Grid>
          )}
          {lead.configuration && (
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Configuration:</strong> {lead.configuration}</Typography>
            </Grid>
          )}
          {lead.nextAction && (
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Next action:</strong> {NEXT_ACTION_LABEL[lead.nextAction] || lead.nextAction}
              </Typography>
            </Grid>
          )}
          {lead.nextFollowUpAt && (
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Next follow-up:</strong> {new Date(lead.nextFollowUpAt).toLocaleString()}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Activity
        </Typography>
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
        <Box sx={{ mb: 2, maxHeight: 180, overflowY: 'auto' }}>
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

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {hasGuidance && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Guided journey:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {lead.visitorType && <Chip size="small" label={VISITOR_LABEL[lead.visitorType] || lead.visitorType} />}
              {lead.challenge && <Chip size="small" variant="outlined" label={lead.challenge.replace(/_/g, ' ')} />}
              {lead.goal && <Chip size="small" variant="outlined" label={lead.goal.replace(/_/g, ' ')} />}
            </Box>
            {lead.challengeNote && (
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                <strong>In their words:</strong> {lead.challengeNote}
              </Typography>
            )}
            {lead.recommendedService && (
              <Typography variant="body2" sx={{ mt: lead.challengeNote ? 1 : 0 }}>
                <strong>Recommended:</strong> {SERVICE_LABEL[lead.recommendedService] || lead.recommendedService}
              </Typography>
            )}
          </Box>
        )}

        {lead.type === 'project' && lead.projectName && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Project Information:
            </Typography>
            <Typography variant="body2">
              <strong>Project:</strong> {lead.projectName}
            </Typography>
          </Box>
        )}

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Additional Information:
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          <strong>Message:</strong> {lead.message || '-'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button onClick={handleClose} variant="outlined">
            Close
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            variant="contained"
            color="primary"
            disabled={!canSave || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save CRM'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default LeadModal;

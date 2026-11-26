import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import Cookies from 'js-cookie';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  addStaffLead,
  getAssignableLeadOwners,
  type AssignableOwner,
} from '../../api/services';
import { CRM_SOURCE_LABEL, STAGE_OPTIONS, TEMPERATURE_OPTIONS } from './Leads';

const CRM_SOURCE_OPTIONS = [
  'manual',
  'channel_partner',
  'referral',
  'walk_in',
  'whatsapp',
  'other',
] as const;

const PARTNER_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'Partner · Rohas', label: 'Partner · Rohas' },
  { value: 'Partner · Impia', label: 'Partner · Impia' },
  { value: 'Partner · other', label: 'Partner · other' },
];

type AddLeadDialogProps = {
  open: boolean;
  onClose: () => void;
};

function isManagerSeat(): boolean {
  const role = String(Cookies.get('user_type') || '').toLowerCase();
  return role === 'admin' || role === 'super_admin';
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

function ownerDisplay(owner: AssignableOwner): string {
  const base = owner.name || owner.email || owner._id;
  return owner.usertype ? `${base} (${owner.usertype})` : base;
}

const AddLeadDialog: React.FC<AddLeadDialogProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const canAssign = isManagerSeat();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [projectName, setProjectName] = useState('');
  const [crmSource, setCrmSource] = useState<string>('manual');
  const [partnerPreset, setPartnerPreset] = useState('');
  const [campaign, setCampaign] = useState('');
  const [stage, setStage] = useState('new_lead');
  const [temperature, setTemperature] = useState('cold');
  const [ownerId, setOwnerId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const ownersQuery = useQuery({
    queryKey: ['assignable-lead-owners'],
    queryFn: getAssignableLeadOwners,
    enabled: open && canAssign,
  });

  const owners: AssignableOwner[] = ownersQuery.data || [];
  const selectedOwner = owners.find((o) => o._id === ownerId) || null;

  const pageSource = useMemo(() => {
    const fromPartner = partnerPreset.trim();
    const fromCampaign = campaign.trim();
    if (fromPartner && fromCampaign) return `${fromPartner} · ${fromCampaign}`;
    return fromPartner || fromCampaign || undefined;
  }, [partnerPreset, campaign]);

  useEffect(() => {
    if (!open) return;
    setName('');
    setEmail('');
    setPhoneNumber('');
    setProjectName('');
    setCrmSource('manual');
    setPartnerPreset('');
    setCampaign('');
    setStage('new_lead');
    setTemperature('cold');
    setOwnerId('');
    setMessage('');
    setError('');
  }, [open]);

  const createMutation = useMutation({
    mutationFn: () =>
      addStaffLead({
        name: name.trim(),
        email: email.trim(),
        phoneNumber,
        type: 'project',
        ...(projectName.trim() ? { projectName: projectName.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
        ...(pageSource ? { pageSource } : {}),
        crmSource,
        stage,
        temperature,
        ...(canAssign && ownerId ? { ownerId } : {}),
      }),
    onSuccess: () => {
      toast.success('Lead added');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : null) ||
        'Could not add lead.';
      setError(typeof msg === 'string' ? msg : 'Could not add lead.');
    },
  });

  const phoneOk = /^\d{10}$/.test(phoneNumber);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit =
    name.trim().length >= 2 && emailOk && phoneOk && !createMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Lead</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(digitsOnly(e.target.value))}
                fullWidth
                required
                size="small"
                helperText="10 digits"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Project (optional)"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                options={[...CRM_SOURCE_OPTIONS]}
                value={crmSource}
                onChange={(_e, next) => setCrmSource(next || 'manual')}
                getOptionLabel={(option) => CRM_SOURCE_LABEL[option] || option}
                disableClearable
                blurOnSelect
                renderInput={(params) => (
                  <TextField {...params} label="CRM source" placeholder="Search source" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                options={PARTNER_OPTIONS}
                value={
                  PARTNER_OPTIONS.find((o) => o.value === partnerPreset) ||
                  PARTNER_OPTIONS[0]
                }
                onChange={(_e, next) => {
                  const value = next?.value || '';
                  setPartnerPreset(value);
                  if (value.startsWith('Partner')) {
                    setCrmSource('channel_partner');
                  }
                }}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                disableClearable
                blurOnSelect
                renderInput={(params) => (
                  <TextField {...params} label="Partner transfer" placeholder="Search partner" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Campaign / label"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                fullWidth
                size="small"
                placeholder="Optional campaign name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                options={[...STAGE_OPTIONS]}
                value={STAGE_OPTIONS.find((o) => o.value === stage) || STAGE_OPTIONS[0]}
                onChange={(_e, next) => setStage(next?.value || 'new_lead')}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                disableClearable
                blurOnSelect
                renderInput={(params) => (
                  <TextField {...params} label="Stage" placeholder="Search stage" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                options={[...TEMPERATURE_OPTIONS]}
                value={
                  TEMPERATURE_OPTIONS.find((o) => o.value === temperature) ||
                  TEMPERATURE_OPTIONS[2]
                }
                onChange={(_e, next) => setTemperature(next?.value || 'cold')}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                disableClearable
                blurOnSelect
                renderInput={(params) => (
                  <TextField {...params} label="Temperature" placeholder="Search" />
                )}
              />
            </Grid>
            {canAssign && (
              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  options={owners}
                  value={selectedOwner}
                  onChange={(_e, next) => setOwnerId(next?._id || '')}
                  getOptionLabel={ownerDisplay}
                  isOptionEqualToValue={(a, b) => a._id === b._id}
                  loading={ownersQuery.isLoading}
                  blurOnSelect
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assign to"
                      placeholder="Search person"
                    />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                label="Notes / first comment"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={2}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit}
        >
          {createMutation.isPending ? 'Saving…' : 'Add Lead'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLeadDialog;

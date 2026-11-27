import React, { useMemo, useState } from 'react';
import {
  Autocomplete,
  Box, TextField, InputAdornment, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Pagination, Typography, Checkbox,
  Button, ClickAwayListener, Popper, MenuList, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import { Search as SearchIcon, ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

import LeadModal from './LeadModal'; // Adjust path
import AddLeadDialog from './AddLeadDialog';
import {
  assignLeadOwner,
  deleteLead,
  getAssignableLeadOwners,
  getLeads,
  releaseLeadCall,
  sendLeadCall,
  type AssignableOwner,
} from '../../api/services';
import PageHeader from '../../Components/PageHeader';
import EmptyState from '../../Components/EmptyState';
import { TableSkeleton } from '../../Components/LoadingState';
import { tokens } from '../../Theme/tokens';

type OwnerFilterOption = {
  value: string;
  label: string;
};

function isLeadManagerSeat(): boolean {
  const role = String(Cookies.get('user_type') || '').toLowerCase();
  return role === 'admin' || role === 'super_admin';
}

// ----------------------
// Type Declarations
// ----------------------
export interface Lead {
  _id: string;
  source?: string;
  intent?: string;
  type: string;
  name: string;
  email: string;
  phoneNumber: string;
  projectName?: string;
  projectId?: string;
  message?: string;
  company?: string;
  visitorType?: string;
  challenge?: string;
  challengeNote?: string;
  goal?: string;
  recommendedService?: string;
  pageSource?: string;
  lastTouchSource?: string;
  enquiries?: number;
  ownerId?: string;
  temperature?: string;
  stage?: string;
  status?: string;
  crmSource?: string;
  budget?: string;
  configuration?: string;
  nextAction?: string;
  nextFollowUpAt?: string;
  lostReason?: string;
  loan?: string;
  decisionMaker?: string;
  channelPartnerId?: string;
  firstCallAt?: string;
  contentDownloadCount?: number;
  contentDownloads?: Array<{
    title?: string;
    fileId?: string;
    fileName?: string;
    date?: string;
    at?: string;
  }>;
  krisahInviteSentAt?: string;
  krisahDone?: boolean;
  krisahScore?: number;
  krisahCompletedAt?: string;
  /** Long website form track + answers (merged from saleleads). */
  formTrack?: 'coaching' | 'consulting' | 'realty' | string;
  formAnswers?: Record<string, unknown>;
  saleLeadId?: string;
  formSubmittedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt?: string;
  lastCallId?: string;
  lastCallStatus?: string;
  lastCallOutcome?: string;
  lastCallSummary?: string;
  lastCallRecordingUrl?: string;
  lastCallAt?: string;
}

/** Same rule as the API: coaching enquiries get Priti. */
export function isCoachingLead(lead: Pick<Lead, 'type' | 'formTrack' | 'recommendedService'>): boolean {
  if (lead.type === 'coaching') return true;
  if (lead.formTrack === 'coaching') return true;
  if (lead.recommendedService === 'coaching') return true;
  return false;
}

/** Consulting enquiries get Meera. */
export function isConsultingLead(lead: Pick<Lead, 'type' | 'formTrack' | 'recommendedService'>): boolean {
  if (lead.type === 'consulting') return true;
  if (lead.formTrack === 'consulting') return true;
  if (lead.recommendedService === 'consulting') return true;
  return false;
}

export function isCallableLead(lead: Pick<Lead, 'type' | 'formTrack' | 'recommendedService'>): boolean {
  return isCoachingLead(lead) || isConsultingLead(lead);
}

export function callAgentLabel(lead: Pick<Lead, 'type' | 'formTrack' | 'recommendedService'>): string {
  if (isConsultingLead(lead) && !isCoachingLead(lead)) return 'Call with Meera';
  if (isConsultingLead(lead) && lead.formTrack === 'consulting') return 'Call with Meera';
  return 'Call with Priti';
}

export const CALL_STATUS_LABEL: Record<string, string> = {
  queued: 'Queued',
  in_progress: 'Calling',
  completed: 'Completed',
  no_answer: 'No answer',
  voicemail: 'Voicemail',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

/** True only for a live dial. Must stay above Outpero's 5 min cap + summary delay. */
const ACTIVE_CALL_MAX_AGE_MS = 12 * 60 * 1000;
export function isLeadCallInFlight(
  lead: Pick<Lead, 'lastCallStatus' | 'lastCallAt'>,
): boolean {
  if (lead.lastCallStatus !== 'queued' && lead.lastCallStatus !== 'in_progress') {
    return false;
  }
  if (!lead.lastCallAt) return false;
  const started = new Date(lead.lastCallAt).getTime();
  if (Number.isNaN(started)) return false;
  return Date.now() - started < ACTIVE_CALL_MAX_AGE_MS;
}

/** Desk label: aged-out In progress (busy / no webhook) reads as No answer, not Calling. */
export function leadCallStatusLabel(
  lead: Pick<Lead, 'lastCallStatus' | 'lastCallAt'>,
): string {
  const raw = lead.lastCallStatus || '';
  if (
    (raw === 'queued' || raw === 'in_progress') &&
    !isLeadCallInFlight(lead)
  ) {
    return 'No answer';
  }
  return CALL_STATUS_LABEL[raw] || raw || '-';
}

/** Labels for the guided-finder keys stored on a lead. */
export const VISITOR_LABEL: Record<string, string> = {
  developer: 'Developer / Builder',
  sales_leader: 'Sales head / manager',
  sales_pro: 'Sales professional',
  investor: 'Investor / Buyer',
  unsure: 'Not sure',
};
export const SERVICE_LABEL: Record<string, string> = {
  coaching: 'Coaching',
  consulting: 'Consulting',
  realty: 'Mandate',
  realty_portfolio: 'Portfolio',
  strategy_call: 'Strategy call',
};
export const SOURCE_LABEL: Record<string, string> = {
  guided_finder: 'Guided finder',
  finder_skip: 'Finder (skipped)',
  site_cta: 'Site CTA',
  contact: 'Contact page',
  project: 'Project page',
  admin: 'Admin',
  assessment: 'Assessment',
  content_library: 'Content Library',
  sale_form: 'Service form',
};

export const INTENT_LABEL: Record<string, string> = {
  enquiry: 'Enquiry',
  nurture: 'Nurture',
  assessment: 'Assessment',
};

export const FORM_TRACK_LABEL: Record<string, string> = {
  coaching: 'Coaching form',
  consulting: 'Consulting form',
  realty: 'Realty form',
};

/** Human labels for /form question ids (admin detail view). */
export const FORM_ANSWER_LABELS: Record<string, string> = {
  name: 'Full name',
  phone: 'Phone',
  email: 'Email',
  role: 'Role',
  experience: 'Experience',
  projectType: 'Project type',
  challenges: 'Challenges',
  goal: 'Goal',
  timeline: 'Timeline',
  notes: 'Notes',
  orgName: 'Organisation',
  businessStage: 'Business stage',
  servicesNeeded: 'Services needed',
  biggestChallenge: 'Biggest challenge',
  challengeSeverity: 'Challenge severity',
  primaryGoal: 'Primary goal',
  hasSalesTeam: 'In-house sales team',
  triedSolutions: 'Tried solutions',
  decisionMaker: 'Decision maker',
  reachOutReason: 'Why they reached out',
  investmentPlan: 'Investment timeline',
  successLooksLike: 'What success looks like',
  projectName: 'Project name',
  location: 'Project location',
  website: 'Website',
  socialLinks: 'Social links',
  unitsAvailable: 'Units available',
  objective: 'Primary objective',
  projectStage: 'Project stage',
  enquirySource: 'Enquiry sources',
  finalizeTimeline: 'Partner timeline',
  reasonNow: 'Why partner now',
};

/** Locked funnel — must match merchandising_backend LEAD_STAGES. */
export const STAGE_OPTIONS = [
  { value: 'new_lead', label: 'New Lead' },
  { value: 'attempted_contact', label: 'Attempted Contact' },
  { value: 'connected', label: 'Connected' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'site_visit_planned', label: 'Site Visit Planned' },
  { value: 'site_visit_done', label: 'Site Visit Done' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'booking_token', label: 'Booking / Token' },
  { value: 'won_booked', label: 'Won / Booked' },
  { value: 'lost', label: 'Lost' },
  { value: 'nurture', label: 'Nurture' },
] as const;

export const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  STAGE_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * Interim telecaller words on top of mandate stages (same values underneath).
 * Heat (hot / warm / cold) stays on the temperature field.
 */
export const TELECALLER_STAGE_LABEL: Record<string, string> = {
  new_lead: 'Incoming',
  attempted_contact: 'Pending',
  connected: 'In process',
  qualified: 'In process',
  site_visit_planned: 'Visit planned',
  site_visit_done: 'Visit done',
  negotiation: 'In process',
  booking_token: 'Closing',
  won_booked: 'Closed won',
  lost: 'Closed lost',
  nurture: 'Cold hold',
};

/** Desk label: telecaller word first, CRM stage in brackets. */
export function stageDeskLabel(stage?: string): string {
  if (!stage) return '-';
  const desk = TELECALLER_STAGE_LABEL[stage];
  const crm = STAGE_LABEL[stage] || stage;
  return desk ? `${desk} (${crm})` : crm;
}

/** Locked temperatures — separate from stage. */
export const TEMPERATURE_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
] as const;

export const TEMPERATURE_LABEL: Record<string, string> = Object.fromEntries(
  TEMPERATURE_OPTIONS.map((o) => [o.value, o.label]),
);

export const LOST_REASON_OPTIONS = [
  { value: 'budget', label: 'Budget' },
  { value: 'price', label: 'Price' },
  { value: 'location', label: 'Location' },
  { value: 'project_not_suitable', label: 'Project not suitable' },
  { value: 'bought_elsewhere', label: 'Bought elsewhere' },
  { value: 'no_response', label: 'No response' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'future_requirement', label: 'Future requirement' },
  { value: 'other', label: 'Other' },
] as const;

export const CRM_SOURCE_LABEL: Record<string, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  whatsapp: 'WhatsApp',
  website: 'Website',
  referral: 'Referral',
  channel_partner: 'Channel partner',
  walk_in: 'Walk-in',
  housing: 'Housing / portal',
  manual: 'Manual',
  other: 'Other',
};

export const NEXT_ACTION_OPTIONS = [
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'site_visit', label: 'Site visit' },
  { value: 'send_brochure', label: 'Send brochure' },
  { value: 'send_cost_sheet', label: 'Send cost sheet' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow-up' },
] as const;

export const NEXT_ACTION_LABEL: Record<string, string> = Object.fromEntries(
  NEXT_ACTION_OPTIONS.map((o) => [o.value, o.label]),
);

export function leadSourceLabel(lead: Pick<Lead, 'source' | 'pageSource'>): string {
  if (lead.source === 'assessment' || /assessment/i.test(lead.pageSource || '')) return 'Assessment';
  if (lead.source) return SOURCE_LABEL[lead.source] || lead.source;
  return lead.pageSource || '-';
}

export type KrisahStatus = 'completed' | 'invite_sent' | 'not_started' | 'none';

export function krisahStatusKey(
  lead: Pick<Lead, 'source' | 'pageSource' | 'krisahDone' | 'krisahInviteSentAt'>,
): KrisahStatus {
  if (lead.krisahDone) return 'completed';
  if (lead.krisahInviteSentAt) return 'invite_sent';
  if (lead.source === 'assessment' || /assessment/i.test(lead.pageSource || '')) return 'not_started';
  return 'none';
}

export function krisahStatusLabel(lead: Pick<Lead, 'source' | 'pageSource' | 'krisahDone' | 'krisahScore' | 'krisahInviteSentAt'>): string {
  const key = krisahStatusKey(lead);
  if (key === 'completed') {
    return lead.krisahScore != null ? `Completed · ${lead.krisahScore}` : 'Completed';
  }
  if (key === 'invite_sent') return 'Invite sent';
  if (key === 'not_started') return 'Not started';
  return '-';
}

const KRISAH_CHIP: Record<Exclude<KrisahStatus, 'none'>, { label: string; bg: string; color: string }> = {
  completed: { label: 'Completed', bg: tokens.successSoft, color: tokens.success },
  invite_sent: { label: 'Invite sent', bg: tokens.infoSoft, color: tokens.info },
  not_started: { label: 'Not started', bg: tokens.warningSoft, color: tokens.warning },
};

function formatLeadDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Date in: form submit if present, else created. */
function leadDateIn(lead: Pick<Lead, 'formSubmittedAt' | 'createdAt'>): string {
  return formatLeadDate(lead.formSubmittedAt || lead.createdAt);
}

/**
 * Date out: closedAt when won / lost.
 * Falls back to updatedAt for older closed leads created before closedAt existed.
 */
function leadDateOut(
  lead: Pick<Lead, 'stage' | 'status' | 'closedAt' | 'updatedAt'>,
): string {
  if (lead.closedAt) return formatLeadDate(lead.closedAt);
  const closed =
    lead.stage === 'won_booked' ||
    lead.stage === 'lost' ||
    lead.status === 'won' ||
    lead.status === 'lost';
  if (!closed) return '-';
  return formatLeadDate(lead.updatedAt);
}

function leadCampaignLabel(lead: Pick<Lead, 'pageSource'>): string {
  const value = String(lead.pageSource || '').trim();
  return value || '-';
}

function csvEscape(value: unknown): string {
  const text = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  if (/[",]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** Build Excel-friendly CSV (BOM) for interim manager export. */
function buildLeadsCsv(
  rows: Lead[],
  ownerNameById: Map<string, string>,
): string {
  const headers = [
    'Name',
    'Phone',
    'Email',
    'Source',
    'Campaign',
    'Stage',
    'Heat',
    'Owner',
    'Project',
    'Date in',
    'Date out',
    'Next follow-up',
    'Type',
  ];
  const lines = rows.map((lead) =>
    [
      lead.name,
      lead.phoneNumber,
      lead.email,
      lead.crmSource
        ? CRM_SOURCE_LABEL[lead.crmSource] || lead.crmSource
        : leadSourceLabel(lead),
      leadCampaignLabel(lead),
      lead.stage ? stageDeskLabel(lead.stage) : '',
      lead.temperature
        ? TEMPERATURE_LABEL[lead.temperature] || lead.temperature
        : '',
      lead.ownerId
        ? ownerNameById.get(String(lead.ownerId)) || 'Assigned'
        : 'Unassigned',
      lead.projectName || '',
      leadDateIn(lead),
      leadDateOut(lead),
      formatLeadDate(lead.nextFollowUpAt),
      lead.formTrack
        ? FORM_TRACK_LABEL[lead.formTrack] || lead.formTrack
        : lead.type,
    ]
      .map(csvEscape)
      .join(','),
  );
  return `\uFEFF${[headers.join(','), ...lines].join('\n')}`;
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function KrisahStatusChip({ lead }: { lead: Pick<Lead, 'source' | 'pageSource' | 'krisahDone' | 'krisahScore' | 'krisahInviteSentAt'> }) {
  const key = krisahStatusKey(lead);
  if (key === 'none') {
    return <Typography variant="caption" sx={{ color: tokens.textMuted }}>-</Typography>;
  }
  const chip = KRISAH_CHIP[key];
  const label = key === 'completed' && lead.krisahScore != null ? `Completed · ${lead.krisahScore}` : chip.label;
  return (
    <Chip
      size="small"
      label={label}
      sx={{ height: 22, fontSize: '11px', fontWeight: 600, backgroundColor: chip.bg, color: chip.color }}
    />
  );
}

interface LeadsApiResponse {
  leads: Lead[];
  totalCount?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// ----------------------
// Component
// ----------------------
const rowsPerPage = 25;

/** Shared Autocomplete / search field chrome (Popper lists, not Menu modals). */
const FILTER_H = 40;
const filterFieldSx = {
  minWidth: 168,
  flex: '0 1 180px',
  '& .MuiOutlinedInput-root': {
    minHeight: FILTER_H,
    bgcolor: tokens.input,
    borderRadius: '8px',
    fontSize: 13,
    color: tokens.text,
    py: 0,
    '& fieldset': { borderColor: tokens.border },
    '&:hover fieldset': { borderColor: tokens.borderStrong },
    '&.Mui-focused fieldset': { borderColor: tokens.gold },
  },
  '& .MuiInputLabel-root': {
    fontSize: 13,
    color: tokens.textMuted,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: tokens.goldHover,
  },
  '& .MuiChip-root': {
    height: 22,
    fontSize: 11,
  },
} as const;

type StageOption = { value: string; label: string };
type KrisahOption = { value: KrisahStatus | ''; label: string };

const STAGE_FILTER_OPTIONS: StageOption[] = [
  { value: '', label: 'All statuses' },
  ...STAGE_OPTIONS.map((o) => ({
    value: o.value,
    label: stageDeskLabel(o.value),
  })),
];

const KRISAH_FILTER_OPTIONS: KrisahOption[] = [
  { value: '', label: 'All' },
  { value: 'not_started', label: 'Not started' },
  { value: 'invite_sent', label: 'Invite sent' },
  { value: 'completed', label: 'Completed' },
];

const AllLeads: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionsAnchor, setActionsAnchor] = useState<null | HTMLElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [callBusyId, setCallBusyId] = useState<string | null>(null);
  const [callError, setCallError] = useState('');
  const [callInfo, setCallInfo] = useState('');
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  /** Managers land on the open pool first (standard CRM assign desk). */
  const [ownerFilter, setOwnerFilter] = useState(() =>
    isLeadManagerSeat() ? 'unassigned' : '',
  );
  const [assignBusyId, setAssignBusyId] = useState<string | null>(null);
  const [exportRequestOpen, setExportRequestOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const canFilterOwners = isLeadManagerSeat();
  const canExportLeads = canFilterOwners;

  const ownersQuery = useQuery({
    queryKey: ['assignable-lead-owners'],
    queryFn: getAssignableLeadOwners,
    enabled: canFilterOwners,
  });
  const owners: AssignableOwner[] = ownersQuery.data || [];

  const ownerFilterOptions = useMemo<OwnerFilterOption[]>(() => {
    const people = owners.map((owner) => ({
      value: owner._id,
      label: owner.name || owner.email || owner._id,
    }));
    return [
      { value: '', label: 'All owners' },
      { value: 'unassigned', label: 'Unassigned pool' },
      ...people,
    ];
  }, [owners]);

  const ownerNameById = useMemo(() => {
    const map = new Map<string, string>();
    owners.forEach((owner) => {
      map.set(owner._id, owner.name || owner.email || owner._id);
    });
    return map;
  }, [owners]);

  // Day 11 — ask the server for one page (stage + phone + owner filters).
  const { data, isPending, error } = useQuery<LeadsApiResponse, Error>({
    queryKey: ['leads', currentPage, rowsPerPage, stageFilter, phoneFilter, ownerFilter],
    queryFn: () =>
      getLeads({
        page: currentPage,
        limit: rowsPerPage,
        ...(stageFilter ? { stage: stageFilter } : {}),
        ...(phoneFilter ? { phone: phoneFilter } : {}),
        ...(canFilterOwners && ownerFilter ? { ownerId: ownerFilter } : {}),
      }),
    placeholderData: (prev) => prev,
  });

  // Keep the open drawer on the freshest lead row after call / list refresh.
  React.useEffect(() => {
    if (!selectedLead?._id || !data?.leads?.length) return;
    const fresh = data.leads.find((row) => row._id === selectedLead._id);
    if (fresh) setSelectedLead(fresh);
  }, [data?.leads, selectedLead?._id]);

  // While a call is queued / in progress, refresh so status + summary land after hang-up.
  React.useEffect(() => {
    const hasActive =
      Boolean(callBusyId) || Boolean(data?.leads?.some((row) => isLeadCallInFlight(row)));
    if (!hasActive) return;
    const timer = window.setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [callBusyId, data?.leads, queryClient]);

  // Busy / no webhook often leaves queued/in_progress forever. Ask API to release aged rows.
  React.useEffect(() => {
    const stuck =
      data?.leads?.filter(
        (row) =>
          (row.lastCallStatus === 'queued' || row.lastCallStatus === 'in_progress') &&
          !isLeadCallInFlight(row),
      ) || [];
    if (!stuck.length) return;
    let cancelled = false;
    (async () => {
      let releasedAny = false;
      for (const row of stuck) {
        try {
          const result = await releaseLeadCall(row._id);
          if (result?.released) releasedAny = true;
        } catch {
          // Endpoint may not be live yet; desk label still ages out locally.
        }
        if (cancelled) return;
      }
      if (releasedAny && !cancelled) {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data?.leads, queryClient]);

  const assignMutation = useMutation({
    mutationFn: ({
      leadId,
      ownerId,
    }: {
      leadId: string;
      ownerId: string | null;
    }) => assignLeadOwner(leadId, ownerId),
    onMutate: ({ leadId }) => {
      setAssignBusyId(leadId);
    },
    onSuccess: (_result, variables) => {
      setAssignBusyId(null);
      toast.success(variables.ownerId ? 'Lead assigned' : 'Owner cleared');
      setSelectedLead((prev) =>
        prev && prev._id === variables.leadId
          ? { ...prev, ownerId: variables.ownerId || undefined }
          : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => {
      setAssignBusyId(null);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not assign owner.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : String(msg));
    },
  });

  const callMutation = useMutation({
    mutationFn: (leadId: string) => sendLeadCall(leadId),
    onMutate: (leadId) => {
      setCallBusyId(leadId);
      setCallError('');
      setCallInfo('');
    },
    onSuccess: (result, leadId) => {
      setCallBusyId(null);
      setCallInfo(result?.message || 'Call queued with Outpero.');
      setSelectedLead((prev) =>
        prev && prev._id === leadId
          ? {
              ...prev,
              lastCallStatus: result?.status || 'queued',
              lastCallAt: new Date().toISOString(),
            }
          : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => {
      setCallBusyId(null);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not start the call.';
      setCallError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const failed: string[] = [];
      for (const id of ids) {
        try {
          await deleteLead(id);
        } catch {
          failed.push(id);
        }
      }
      return failed;
    },
    onSuccess: (failed) => {
      setSelectedIds(failed);
      if (selectedLead && !failed.includes(selectedLead._id)) {
        setOpenModal(false);
        setSelectedLead(null);
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      if (failed.length) {
        setDeleteError(`${failed.length} lead${failed.length === 1 ? '' : 's'} could not be deleted.`);
        return;
      }
      setConfirmDelete(false);
      setDeleteError('');
    },
    onError: () => {
      setDeleteError('Could not delete the selected leads.');
    },
  });

  const LeadsData = [...(data?.leads || [])].sort((a, b) => {
    const byDate = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return byDate !== 0 ? byDate : String(b._id).localeCompare(String(a._id));
  });

  const sourceOptions = LeadsData.map((lead) => lead.source || '').filter(Boolean).filter(
    (value, index, self) => self.indexOf(value) === index
  );
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [krisahFilter, setKrisahFilter] = useState<KrisahStatus | ''>('');
  const serviceOptions = LeadsData.map((lead) => lead.recommendedService || '').filter(Boolean).filter(
    (value, index, self) => self.indexOf(value) === index
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    // Digits-heavy search goes to the server phone filter; name/email stay on this page.
    const digits = value.replace(/\D/g, '');
    const nextPhone = digits.length >= 4 ? digits : '';
    setPhoneFilter(nextPhone);
    setCurrentPage(1);
  };

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setSelectedLead(null);
  };

  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setCurrentPage(newPage);
  };

  // Page-local filters (source / service / KRISAH / name) on the server page.
  const filteredLeads = LeadsData.filter((lead) => {
    const q = searchText.trim().toLowerCase();
    const digits = searchText.replace(/\D/g, '');
    const phoneServerActive = digits.length >= 4;
    const matchesSearch =
      !q ||
      phoneServerActive ||
      lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.phoneNumber.includes(searchText);

    const matchesSource = selectedSources.length === 0 || selectedSources.includes(lead.source || '');
    const matchesService = selectedServices.length === 0 || selectedServices.includes(lead.recommendedService || '');
    const matchesKrisah = !krisahFilter || krisahStatusKey(lead) === krisahFilter;

    return matchesSearch && matchesSource && matchesService && matchesKrisah;
  });

  const totalPages = Math.max(1, data?.totalPages || Math.ceil((data?.totalCount || 0) / rowsPerPage) || 1);
  const paginatedRows = filteredLeads;
  const pageIds = paginatedRows.map((lead) => lead._id);
  const selectedCount = selectedIds.length;
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const somePageSelected = pageIds.some((id) => selectedIds.includes(id));

  const toggleOne = (leadId: string) => {
    setSelectedIds((current) => (
      current.includes(leadId)
        ? current.filter((id) => id !== leadId)
        : [...current, leadId]
    ));
  };

  const togglePage = () => {
    setSelectedIds((current) => (
      allPageSelected
        ? current.filter((id) => !pageIds.includes(id))
        : [...new Set([...current, ...pageIds])]
    ));
  };

  const runManagerExport = async () => {
    if (!canExportLeads) return;
    setExportBusy(true);
    setActionsAnchor(null);
    try {
      let rows: Lead[] = [];
      if (selectedIds.length) {
        const selectedSet = new Set(selectedIds);
        rows = LeadsData.filter((lead) => selectedSet.has(lead._id));
        if (!rows.length) {
          toast.error('Selected leads are not on this page. Select again, then export.');
          return;
        }
      } else {
        const response = await getLeads({
          page: 1,
          limit: 100,
          ...(stageFilter ? { stage: stageFilter } : {}),
          ...(phoneFilter ? { phone: phoneFilter } : {}),
          ...(ownerFilter ? { ownerId: ownerFilter } : {}),
        });
        rows = response?.leads || [];
      }

      if (!rows.length) {
        toast.error('No leads to export for the current filters.');
        return;
      }

      const stamp = new Date().toISOString().slice(0, 10);
      const csv = buildLeadsCsv(rows, ownerNameById);
      downloadTextFile(
        `rw-leads-${stamp}.csv`,
        csv,
        'text/csv;charset=utf-8;',
      );
      toast.success(
        selectedIds.length
          ? `Exported ${rows.length} selected lead${rows.length === 1 ? '' : 's'}`
          : `Exported ${rows.length} lead${rows.length === 1 ? '' : 's'} (up to 100 for current filters)`,
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Could not export leads.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setExportBusy(false);
    }
  };

  const copyExportRequestMessage = async () => {
    const bits = [
      'Please export leads from admin Leads for me.',
      stageFilter ? `Status: ${stageDeskLabel(stageFilter)}` : '',
      ownerFilter === 'unassigned'
        ? 'Owner: Unassigned pool'
        : ownerFilter
          ? `Owner: ${ownerNameById.get(ownerFilter) || ownerFilter}`
          : '',
      phoneFilter ? `Phone search: ${phoneFilter}` : '',
      selectedCount ? `Selected on my screen: ${selectedCount}` : '',
    ].filter(Boolean);
    const text = bits.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Request text copied. Send it to your manager.');
    } catch {
      toast.error('Could not copy. Ask your manager to use Actions → Export CSV.');
    }
    setExportRequestOpen(false);
  };

  // ----------------------
  // Loading / Error States
  // ---------------------- 
  if (isPending) return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <PageHeader title="Leads" description="Every enquiry from the website, sorted by source and service." crumbs={[{ label: 'Leads' }]} />
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableSkeleton rows={8} columns={6} />
      </Paper>
    </Box>
  );
  if (error) return <Typography color="error">Error fetching leads.</Typography>;

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <PageHeader
        title="Leads"
        description={
          canFilterOwners
            ? 'Open pool first. Assign to sales, then they only see their own leads. Export is manager-only.'
            : 'Your assigned leads only. Add a lead or ask a manager to assign from the open pool.'
        }
        crumbs={[{ label: 'Leads' }]}
        actions={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={`${filteredLeads.length} leads`} sx={{ bgcolor: tokens.goldSoft, color: tokens.goldText, fontWeight: 600 }} />
            <Button
              variant="contained"
              size="small"
              onClick={() => setAddLeadOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add Lead
            </Button>
          </Box>
        }
      />
      <AddLeadDialog open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      {/* Filter toolbar — Autocomplete (Popper) so lists are searchable + no scroll lock */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: 1.25,
          borderRadius: '10px',
          border: `1px solid ${tokens.border}`,
          bgcolor: tokens.panel,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.25,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            placeholder="Search name, email, or phone"
            variant="outlined"
            size="small"
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: tokens.textMuted }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: '1 1 220px',
              minWidth: { xs: '100%', sm: 220 },
              maxWidth: { sm: 320 },
              ...filterFieldSx,
              '& .MuiOutlinedInput-input': {
                py: '8.5px',
                fontSize: 13,
              },
            }}
          />

          {canFilterOwners && (
            <Autocomplete
              size="small"
              options={ownerFilterOptions}
              value={
                ownerFilterOptions.find((o) => o.value === ownerFilter) ||
                ownerFilterOptions.find((o) => o.value === 'unassigned') ||
                ownerFilterOptions[0]
              }
              onChange={(_e, next) => {
                setOwnerFilter(next?.value || '');
                setCurrentPage(1);
              }}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              disableClearable
              blurOnSelect
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Owner"
                  placeholder="Search owner"
                  helperText="Unassigned pool = open work. Sales never see peers’ leads."
                />
              )}
              sx={{
                ...filterFieldSx,
                minWidth: 200,
                alignSelf: 'flex-start',
                '& .MuiFormHelperText-root': {
                  mx: 0,
                  mt: 0.5,
                  fontSize: 11,
                  color: tokens.textMuted,
                },
              }}
            />
          )}

          {sourceOptions.length > 0 && (
            <Autocomplete
              multiple
              size="small"
              options={sourceOptions}
              value={selectedSources}
              onChange={(_e, next) => {
                setSelectedSources(next);
                setCurrentPage(1);
              }}
              getOptionLabel={(option) => SOURCE_LABEL[option] || option}
              limitTags={1}
              blurOnSelect
              renderInput={(params) => (
                <TextField {...params} label="Source" placeholder="Search sources" />
              )}
              sx={filterFieldSx}
            />
          )}

          <Autocomplete
            size="small"
            options={STAGE_FILTER_OPTIONS}
            value={
              STAGE_FILTER_OPTIONS.find((o) => o.value === stageFilter) ||
              STAGE_FILTER_OPTIONS[0]
            }
            onChange={(_e, next) => {
              setStageFilter(next?.value || '');
              setCurrentPage(1);
            }}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            disableClearable
            blurOnSelect
            renderInput={(params) => (
              <TextField {...params} label="Status" placeholder="Search status" />
            )}
            sx={{ ...filterFieldSx, minWidth: 176 }}
          />

          <Autocomplete
            size="small"
            options={KRISAH_FILTER_OPTIONS}
            value={
              KRISAH_FILTER_OPTIONS.find((o) => o.value === krisahFilter) ||
              KRISAH_FILTER_OPTIONS[0]
            }
            onChange={(_e, next) => {
              setKrisahFilter((next?.value || '') as KrisahStatus | '');
              setCurrentPage(1);
            }}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            disableClearable
            blurOnSelect
            renderInput={(params) => (
              <TextField {...params} label="KRISAH" placeholder="Search" />
            )}
            sx={{ ...filterFieldSx, minWidth: 150 }}
          />

          {serviceOptions.length > 0 && (
            <Autocomplete
              multiple
              size="small"
              options={serviceOptions}
              value={selectedServices}
              onChange={(_e, next) => {
                setSelectedServices(next);
                setCurrentPage(1);
              }}
              getOptionLabel={(option) => SERVICE_LABEL[option] || option}
              limitTags={1}
              blurOnSelect
              renderInput={(params) => (
                <TextField {...params} label="Service" placeholder="Search services" />
              )}
              sx={{ ...filterFieldSx, minWidth: 176 }}
            />
          )}

          <Box sx={{ flex: '1 1 auto', minWidth: 8 }} />

          <ClickAwayListener onClickAway={() => setActionsAnchor(null)}>
            <Box sx={{ position: 'relative' }}>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowDropDownIcon />}
                onClick={(event) => {
                  setActionsAnchor((prev) => (prev ? null : event.currentTarget));
                }}
                sx={{
                  height: FILTER_H,
                  minWidth: 112,
                  borderRadius: '8px',
                  borderColor: tokens.border,
                  color: tokens.text,
                  textTransform: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  px: 1.75,
                  bgcolor: tokens.input,
                  '&:hover': {
                    borderColor: tokens.borderStrong,
                    bgcolor: tokens.hover,
                  },
                }}
              >
                Actions{selectedCount ? ` (${selectedCount})` : ''}
              </Button>

              <Popper
                open={Boolean(actionsAnchor)}
                anchorEl={actionsAnchor}
                placement="bottom-end"
                style={{ zIndex: theme.zIndex.modal }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    mt: 0.75,
                    minWidth: 168,
                    borderRadius: '10px',
                    border: `1px solid ${tokens.borderStrong}`,
                    bgcolor: tokens.menu,
                    boxShadow: tokens.shadow,
                    overflow: 'hidden',
                  }}
                >
                  <MenuList dense autoFocusItem={false} sx={{ py: 0.5 }}>
                    {canExportLeads ? (
                      <MenuItem
                        disabled={exportBusy}
                        onClick={() => {
                          void runManagerExport();
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {exportBusy
                            ? 'Exporting…'
                            : selectedCount
                              ? `Export CSV (${selectedCount})`
                              : 'Export CSV'}
                        </Typography>
                      </MenuItem>
                    ) : (
                      <MenuItem
                        onClick={() => {
                          setActionsAnchor(null);
                          setExportRequestOpen(true);
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Request export
                        </Typography>
                      </MenuItem>
                    )}
                    <MenuItem
                      disabled={!selectedCount || deleteMutation.isPending}
                      onClick={() => {
                        setActionsAnchor(null);
                        setDeleteError('');
                        setConfirmDelete(true);
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: selectedCount ? tokens.dangerText : tokens.text,
                          fontWeight: 600,
                        }}
                      >
                        Delete{selectedCount ? ` (${selectedCount})` : ''}
                      </Typography>
                    </MenuItem>
                  </MenuList>
                </Paper>
              </Popper>
            </Box>
          </ClickAwayListener>
        </Box>
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Scroll the table sideways to see campaign, stage, heat, dates, and more.
      </Typography>

      {/* Wide interim columns: horizontal + vertical scroll */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '10px',
          width: '100%',
          maxWidth: '100%',
          maxHeight: { xs: '70vh', md: '72vh' },
          overflowX: 'auto',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          border: `1px solid ${tokens.border}`,
          '&::-webkit-scrollbar': { height: 10, width: 10 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: tokens.borderStrong,
            borderRadius: 8,
          },
        }}
      >
        {(callError || callInfo) && (
          <Box sx={{ px: 1.5, pt: 1.5 }}>
            {callError && (
              <Typography variant="body2" color="error" sx={{ mb: callInfo ? 0.5 : 0 }}>
                {callError}
              </Typography>
            )}
            {callInfo && (
              <Typography variant="body2" color="success.main">
                {callInfo}
              </Typography>
            )}
          </Box>
        )}

        <Table stickyHeader sx={{ minWidth: 1680 }}>
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                sx={{ padding: '6px 8px', bgcolor: tokens.panelAlt, zIndex: 3 }}
              >
                <Checkbox
                  size="small"
                  checked={allPageSelected}
                  indeterminate={!allPageSelected && somePageSelected}
                  onChange={togglePage}
                  inputProps={{ 'aria-label': 'Select leads on this page' }}
                />
              </TableCell>
              {[
                'S.No',
                'Name',
                'Phone',
                'Email',
                'Source',
                'Campaign',
                'Status',
                'Heat',
                canFilterOwners ? 'Assign to' : 'Owner',
                'Project',
                'Date in',
                'Date out',
                'Next follow-up',
                'Type',
                'KRISAH',
                'Call',
              ].map((text) => (
                <TableCell
                  key={text}
                  align="left"
                  sx={{
                    padding: '8px 12px',
                    bgcolor: tokens.panelAlt,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {text}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17}>
                  <EmptyState
                    title="No leads found"
                    description={
                      searchText.trim() ||
                      stageFilter ||
                      ownerFilter ||
                      selectedSources.length ||
                      selectedServices.length ||
                      krisahFilter
                        ? 'Try changing or clearing the filters.'
                        : 'New website enquiries will appear here.'
                    }
                  />
                </TableCell>
              </TableRow>
            ) : null}
            {paginatedRows.map((lead, index) => (
              <TableRow
                key={lead._id}
                hover
                onClick={() => handleRowClick(lead)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell
                  padding="checkbox"
                  sx={{ padding: '6px 8px' }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Checkbox
                    size="small"
                    checked={selectedIds.includes(lead._id)}
                    onChange={() => toggleOne(lead._id)}
                    inputProps={{ 'aria-label': `Select ${lead.name || 'lead'}` }}
                  />
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                  <Typography variant="caption">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </Typography>
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', minWidth: 140 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                    {lead.name || '-'}
                  </Typography>
                  {lead.company && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {lead.company}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                  <Typography variant="caption">{lead.phoneNumber || '-'}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', minWidth: 160 }}>
                  <Typography variant="caption">{lead.email || '-'}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', minWidth: 120 }}>
                  <Typography variant="caption" display="block">
                    {lead.crmSource
                      ? CRM_SOURCE_LABEL[lead.crmSource] || lead.crmSource
                      : leadSourceLabel(lead)}
                  </Typography>
                  {lead.enquiries && lead.enquiries > 1 && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {lead.enquiries} touches
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', minWidth: 160 }}>
                  <Typography variant="caption">{leadCampaignLabel(lead)}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', minWidth: 130 }}>
                  {lead.stage ? (
                    <>
                      <Typography variant="caption" sx={{ fontWeight: 700 }} display="block">
                        {TELECALLER_STAGE_LABEL[lead.stage] ||
                          STAGE_LABEL[lead.stage] ||
                          lead.stage}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {STAGE_LABEL[lead.stage] || lead.stage}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="caption">-</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                  {lead.temperature ? (
                    <Chip
                      size="small"
                      label={TEMPERATURE_LABEL[lead.temperature] || lead.temperature}
                      sx={{ height: 22, fontSize: 11, textTransform: 'capitalize' }}
                    />
                  ) : (
                    <Typography variant="caption">-</Typography>
                  )}
                </TableCell>
                <TableCell
                  sx={{ padding: '8px 12px', minWidth: canFilterOwners ? 220 : 120 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {canFilterOwners ? (
                    <Autocomplete
                      size="small"
                      options={owners}
                      value={
                        owners.find((o) => o._id === String(lead.ownerId || '')) ||
                        null
                      }
                      loading={ownersQuery.isLoading}
                      disabled={
                        assignBusyId === lead._id ||
                        assignMutation.isPending ||
                        ownersQuery.isLoading
                      }
                      onChange={(_e, next) => {
                        const nextId = next?._id || null;
                        const currentId = lead.ownerId
                          ? String(lead.ownerId)
                          : null;
                        if (nextId === currentId) return;
                        assignMutation.mutate({
                          leadId: lead._id,
                          ownerId: nextId,
                        });
                      }}
                      getOptionLabel={(owner) =>
                        owner.name || owner.email || owner._id
                      }
                      isOptionEqualToValue={(a, b) => a._id === b._id}
                      blurOnSelect
                      clearOnBlur={false}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Assign…"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: tokens.input,
                              borderRadius: '8px',
                              fontSize: 12,
                            },
                          }}
                        />
                      )}
                      sx={{ minWidth: 200 }}
                    />
                  ) : lead.ownerId ? (
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {ownerNameById.get(String(lead.ownerId)) || 'Assigned'}
                    </Typography>
                  ) : (
                    <Chip
                      size="small"
                      label="Unassigned"
                      variant="outlined"
                      sx={{ height: 22, fontSize: 11 }}
                    />
                  )}
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', minWidth: 140 }}>
                  <Typography variant="caption">{lead.projectName || '-'}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                  <Typography variant="caption">{leadDateIn(lead)}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                  <Typography variant="caption">{leadDateOut(lead)}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                  <Typography variant="caption">
                    {formatLeadDate(lead.nextFollowUpAt)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                  <Chip
                    size="small"
                    label={
                      lead.formTrack
                        ? FORM_TRACK_LABEL[lead.formTrack] || lead.formTrack
                        : lead.type
                    }
                    sx={{
                      height: 22,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  />
                </TableCell>
                <TableCell sx={{ padding: '8px 12px' }}>
                  <KrisahStatusChip lead={lead} />
                </TableCell>
                <TableCell
                  sx={{ padding: '8px 12px', minWidth: 120 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {isCallableLead(lead) ? (
                    <Box>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={callBusyId === lead._id || isLeadCallInFlight(lead)}
                        onClick={() => callMutation.mutate(lead._id)}
                        sx={{ textTransform: 'none', fontWeight: 600, px: 1.25, minWidth: 0 }}
                      >
                        {callBusyId === lead._id
                          ? 'Calling…'
                          : isLeadCallInFlight(lead)
                            ? 'In progress'
                            : 'Call'}
                      </Button>
                      {lead.lastCallStatus && !isLeadCallInFlight(lead) && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          {leadCallStatusLabel(lead)}
                          {lead.lastCallOutcome &&
                          lead.lastCallStatus !== 'queued' &&
                          lead.lastCallStatus !== 'in_progress'
                            ? ` · ${lead.lastCallOutcome}`
                            : ''}
                        </Typography>
                      )}
                      {isLeadCallInFlight(lead) && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          {CALL_STATUS_LABEL[lead.lastCallStatus || ''] || 'Calling'}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination — server pages (Day 11) */}
      <Box display="flex" justifyContent="center" alignItems="center" flexWrap="wrap" gap={2} mt={3}>
        <Typography variant="caption" color="text.secondary">
          {data?.totalCount != null
            ? `${data.totalCount} lead${data.totalCount === 1 ? '' : 's'} · page ${currentPage} of ${totalPages}`
            : null}
        </Typography>
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handleChangePage}
            shape="rounded"
            sx={{
              "& .MuiPaginationItem-root": {
                height: "22px",
                minWidth: "22px",
                fontSize: "14px",
                fontWeight: "bold",
                backgroundColor: tokens.panelAlt,
              },
              "& .Mui-selected": {
                backgroundColor: theme.palette.primary.main,
                color: tokens.black,
              },
            }}
          />
        )}
      </Box>

      {/* Modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          open={openModal}
          handleClose={handleModalClose}
          onStartCall={() => callMutation.mutate(selectedLead._id)}
          callBusy={callBusyId === selectedLead._id}
          callError={callError}
          callInfo={callInfo}
        />
      )}

      <Dialog
        open={confirmDelete}
        onClose={() => { if (!deleteMutation.isPending) { setConfirmDelete(false); setDeleteError(''); } }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Delete {selectedCount} lead{selectedCount === 1 ? '' : 's'}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {selectedCount === 1
              ? 'This lead will be removed from the list. This cannot be undone.'
              : `${selectedCount} selected leads will be removed from the list. This cannot be undone.`}
          </Typography>
          {deleteError && (
            <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>{deleteError}</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => { setConfirmDelete(false); setDeleteError(''); }}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending || !selectedCount}
            onClick={() => deleteMutation.mutate(selectedIds)}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={exportRequestOpen}
        onClose={() => setExportRequestOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Request Excel export</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Only a manager (admin) can download the leads file. Copy a short request
            and send it to them on WhatsApp or email. They use Actions → Export CSV.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setExportRequestOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              void copyExportRequestMessage();
            }}
            sx={{
              bgcolor: tokens.gold,
              color: tokens.black,
              fontWeight: 600,
              '&:hover': { bgcolor: tokens.goldDark },
            }}
          >
            Copy request text
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AllLeads;

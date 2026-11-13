import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Drawer, Box, Typography, Button, Chip, Divider, Stack, Link, IconButton,
  TextField, CircularProgress, Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import Cookies from 'js-cookie';
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
import {
  addLeadNote,
  deleteLeadNote,
  getLeadActivities,
  updateLead,
  updateLeadNote,
} from '../../api/services';

interface LeadModalProps {
  open: boolean;
  handleClose: () => void;
  lead: Lead;
}

type LeadNoteActivity = {
  _id: string;
  type: string;
  note?: string;
  createdAt?: string;
  authorName?: string;
  authorEmail?: string;
  createdBy?: { name?: string; email?: string } | string | null;
};

function currentUserLabel(): string {
  return (Cookies.get('user_name') || Cookies.get('user_type') || 'Team').trim();
}

function looksLikeId(value: string): boolean {
  if (!value) return true;
  if (/^[a-f0-9]{24}$/i.test(value)) return true;
  // Binary ObjectId mis-decoded as text (e.g. "NVJXDhInXEMR")
  if (value.length <= 16 && !/\s/.test(value) && /[A-Z]/.test(value) && /[a-z]/.test(value)) {
    return !/[aeiou]{2}/i.test(value) && value.length >= 8;
  }
  return false;
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

function formatNoteWhen(iso?: string): { date: string; time: string; full: string } {
  if (!iso) return { date: '-', time: '', full: '-' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '-', time: '', full: '-' };
  return {
    date: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    full: d.toLocaleString(),
  };
}

function authorLabel(item: LeadNoteActivity): string {
  const fromSnapshot = item.authorName?.trim() || item.authorEmail?.trim();
  if (fromSnapshot && !looksLikeId(fromSnapshot)) return fromSnapshot;

  const createdBy = item.createdBy;
  if (createdBy && typeof createdBy === 'object') {
    const fromUser = createdBy.name?.trim() || createdBy.email?.trim();
    if (fromUser && !looksLikeId(fromUser)) return fromUser;
  }

  return 'Team';
}

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1.5, py: 0.85, alignItems: 'start' }}>
    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.02, pt: 0.2 }}>
      {label}
    </Typography>
    <Typography
      component="div"
      variant="body2"
      sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
    >
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
  const [notes, setNotes] = useState<LeadNoteActivity[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [noteBusyId, setNoteBusyId] = useState<string | null>(null);

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

  const loadNotes = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!lead?._id) return;
    if (!opts?.quiet) setNotesLoading(true);
    setNotesError('');
    try {
      const data = await getLeadActivities(String(lead._id));
      const rows = (data?.activities || []) as LeadNoteActivity[];
      setNotes(
        rows
          .filter((a) => a.type === 'note' && a.note?.trim())
          .map((a) => ({
            ...a,
            _id: String(a._id),
            note: String(a.note || ''),
            authorName: a.authorName ? String(a.authorName) : a.authorName,
            authorEmail: a.authorEmail ? String(a.authorEmail) : a.authorEmail,
          })),
      );
    } catch {
      setNotesError('Could not load notes. Try again.');
      if (!opts?.quiet) setNotes([]);
    } finally {
      if (!opts?.quiet) setNotesLoading(false);
    }
  }, [lead?._id]);

  useEffect(() => {
    if (!open || !lead?._id) return;
    setDraft('');
    setSaveError('');
    setEditingId(null);
    setEditDraft('');
    setNoteBusyId(null);
    setNotes([]);
    void loadNotes();
  }, [open, lead?._id, loadNotes]);

  const handleSaveNote = async () => {
    const text = draft.trim();
    if (!text || !lead?._id || saving) return;
    setSaving(true);
    setSaveError('');
    setNotesError('');

    const tempId = `temp-${Date.now()}`;
    const me = currentUserLabel();
    const optimistic: LeadNoteActivity = {
      _id: tempId,
      type: 'note',
      note: text,
      createdAt: new Date().toISOString(),
      authorName: me,
      createdBy: { name: me },
    };
    setNotes((prev) => [optimistic, ...prev]);
    setDraft('');

    try {
      let saved: LeadNoteActivity | undefined;
      try {
        const data = await addLeadNote(lead._id, text);
        saved = data?.activity as LeadNoteActivity | undefined;
      } catch (err: any) {
        // Older API without POST /notes — fall back to PATCH { note }.
        const status = err?.response?.status;
        if (status !== 404 && status !== 405) throw err;
        await updateLead(lead._id, { note: text });
      }
      if (saved?._id && saved.note?.trim()) {
        setNotes((prev) => [saved!, ...prev.filter((n) => n._id !== tempId && n._id !== saved!._id)]);
      } else {
        await loadNotes({ quiet: true });
      }
    } catch {
      setNotes((prev) => prev.filter((n) => n._id !== tempId));
      setDraft(text);
      setSaveError('Could not save the note. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const onNoteKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSaveNote();
    }
  };

  const startEditNote = (item: LeadNoteActivity) => {
    if (item._id.startsWith('temp-') || noteBusyId) return;
    setEditingId(item._id);
    setEditDraft(item.note || '');
    setSaveError('');
  };

  const cancelEditNote = () => {
    setEditingId(null);
    setEditDraft('');
  };

  const handleUpdateNote = async (noteId: string) => {
    const text = editDraft.trim();
    const leadId = String(lead?._id || '');
    const id = String(noteId || '');
    if (!text || !leadId || !id || noteBusyId) return;
    const previous = notes.find((n) => n._id === id)?.note;
    setNoteBusyId(id);
    setSaveError('');
    setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, note: text } : n)));
    try {
      const data = await updateLeadNote(leadId, id, text);
      const saved = data?.activity as LeadNoteActivity | undefined;
      if (saved) {
        setNotes((prev) =>
          prev.map((n) =>
            n._id === id
              ? {
                  ...n,
                  ...saved,
                  _id: String(saved._id || id),
                  note: String(saved.note || text),
                }
              : n,
          ),
        );
      }
      setEditingId(null);
      setEditDraft('');
    } catch (err: any) {
      setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, note: previous } : n)));
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not update the note. Try again.';
      setSaveError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setNoteBusyId(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const leadId = String(lead?._id || '');
    const id = String(noteId || '');
    if (!leadId || !id || noteBusyId || id.startsWith('temp-')) return;
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    const previous = notes;
    setNoteBusyId(id);
    setSaveError('');
    if (editingId === id) cancelEditNote();
    setNotes((prev) => prev.filter((n) => n._id !== id));
    try {
      await deleteLeadNote(leadId, id);
    } catch (err: any) {
      setNotes(previous);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete the note. Try again.';
      setSaveError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setNoteBusyId(null);
    }
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

          {lead.message?.trim() && (
            <Section title="Visitor message">
              <Box sx={{ py: 1.25 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                  {lead.message}
                </Typography>
              </Box>
            </Section>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, letterSpacing: 0.08, mb: 1 }}
            >
              Team notes
            </Typography>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#fff',
              }}
            >
              <Box sx={{ px: 2, pt: 2, pb: 1.5, bgcolor: '#fafbfc', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                  Log a call, summary, or follow-up
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={8}
                  placeholder="Example: Called at 3pm, interested in coaching, send KRISAH link..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onNoteKeyDown}
                  disabled={saving}
                  inputProps={{ maxLength: 4000 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      fontSize: '0.9rem',
                      lineHeight: 1.55,
                    },
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.25, gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {draft.trim().length > 0
                      ? `${draft.trim().length} / 4000 · Ctrl+Enter to save`
                      : 'Each save adds a dated entry below'}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    disableElevation
                    endIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SendOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => void handleSaveNote()}
                    disabled={!draft.trim() || saving}
                    sx={{ textTransform: 'none', fontWeight: 600, px: 1.75 }}
                  >
                    {saving ? 'Saving...' : 'Save note'}
                  </Button>
                </Box>
                {saveError && (
                  <Alert severity="error" sx={{ mt: 1.25, py: 0 }} onClose={() => setSaveError('')}>
                    {saveError}
                  </Alert>
                )}
              </Box>

              <Box sx={{ px: 2, py: 2 }}>
                {notesLoading && notes.length === 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={22} />
                  </Box>
                )}

                {!notesLoading && notesError && notes.length === 0 && (
                  <Alert severity="warning" sx={{ mb: 0 }} action={
                    <Button color="inherit" size="small" onClick={() => void loadNotes()}>Retry</Button>
                  }>
                    {notesError}
                  </Alert>
                )}

                {!notesLoading && !notesError && notes.length === 0 && (
                  <Box sx={{ py: 3.5, px: 1, textAlign: 'center', color: 'text.secondary' }}>
                    <NotesOutlinedIcon sx={{ fontSize: 28, opacity: 0.45, mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                      No team notes yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Add what you did on this lead. It shows here with date and time.
                    </Typography>
                  </Box>
                )}

                {notes.length > 0 && (
                  <Box sx={{ position: 'relative', pl: 0.5 }}>
                    {notes.map((item, index) => {
                      const when = formatNoteWhen(item.createdAt);
                      const isLast = index === notes.length - 1;
                      const isEditing = editingId === item._id;
                      const isBusy = noteBusyId === item._id;
                      const canManage = !item._id.startsWith('temp-');
                      return (
                        <Box
                          key={item._id}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '18px 1fr',
                            gap: 1.5,
                            position: 'relative',
                            pb: isLast ? 0 : 2.25,
                          }}
                        >
                          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                            {!isLast && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 14,
                                  bottom: -8,
                                  width: 2,
                                  bgcolor: 'divider',
                                  borderRadius: 1,
                                }}
                              />
                            )}
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                mt: 0.55,
                                boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)',
                                zIndex: 1,
                              }}
                            />
                          </Box>
                          <Box>
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 0.5,
                                mb: 0.6,
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {authorLabel(item)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" title={when.full}>
                                {when.date}
                                {when.time ? ` · ${when.time}` : ''}
                              </Typography>
                              {canManage && !isEditing && (
                                <Box sx={{ ml: 'auto', display: 'flex', gap: 0.25 }}>
                                  <IconButton
                                    size="small"
                                    aria-label="Edit note"
                                    onClick={() => startEditNote(item)}
                                    disabled={Boolean(noteBusyId)}
                                    sx={{ color: 'text.secondary' }}
                                  >
                                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    aria-label="Delete note"
                                    onClick={() => void handleDeleteNote(item._id)}
                                    disabled={Boolean(noteBusyId)}
                                    sx={{ color: 'text.secondary' }}
                                  >
                                    {isBusy ? <CircularProgress size={14} /> : <DeleteOutlineIcon sx={{ fontSize: 16 }} />}
                                  </IconButton>
                                </Box>
                              )}
                            </Box>
                            <Box
                              sx={{
                                border: '1px solid',
                                borderColor: isEditing ? 'primary.light' : 'divider',
                                borderRadius: 1.5,
                                px: 1.5,
                                py: 1.15,
                                bgcolor: '#fafbfc',
                              }}
                            >
                              {isEditing ? (
                                <>
                                  <TextField
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    maxRows={8}
                                    value={editDraft}
                                    onChange={(e) => setEditDraft(e.target.value)}
                                    disabled={isBusy}
                                    inputProps={{ maxLength: 4000 }}
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        bgcolor: '#fff',
                                        fontSize: '0.9rem',
                                      },
                                    }}
                                  />
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                    <Button
                                      size="small"
                                      onClick={cancelEditNote}
                                      disabled={isBusy}
                                      sx={{ textTransform: 'none' }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      disableElevation
                                      startIcon={isBusy ? <CircularProgress size={12} color="inherit" /> : <CheckIcon sx={{ fontSize: 14 }} />}
                                      disabled={!editDraft.trim() || isBusy || editDraft.trim() === (item.note || '').trim()}
                                      onClick={() => void handleUpdateNote(item._id)}
                                      sx={{ textTransform: 'none', fontWeight: 600 }}
                                    >
                                      {isBusy ? 'Saving...' : 'Save'}
                                    </Button>
                                  </Box>
                                </>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}
                                >
                                  {item.note}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

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

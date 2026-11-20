import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Close, DeleteOutline, Search, WorkOutline } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { deleteApplication, downloadApplicationResume, getApplications } from '../../api/services';
import PageHeader from '../../Components/PageHeader';
import EmptyState from '../../Components/EmptyState';
import ConfirmDialog from '../../Components/ConfirmDialog';
import { TableSkeleton } from '../../Components/LoadingState';
import { useTableSort, SortableHeadCell } from '../../Components/TableSort';
import { tokens } from '../../Theme/tokens';

export interface Application {
  _id: string;
  name: string;
  email: string;
  number: string;
  jobTitle: string;
  jobId?: string;
  experience?: string;
  currentCtc?: string;
  expectedCtc?: string;
  currentLocation?: string;
  noticePeriod?: string;
  relocation?: string;
  workMode?: string;
  applicationSource?: string;
  referredBy?: string;
  applicationSourceOther?: string;
  privacyConsent?: string;
  ref1Name?: string;
  ref1Number?: string;
  ref1Relationship?: string;
  ref2Name?: string;
  ref2Number?: string;
  ref2Relationship?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  socialMediaSavvy?: string;
  aiTools?: string[];
  coverLetter: string;
  resumeFileName?: string;
  resumeUrl?: string;
  createdAt: string;

  // Character / mindset short answers (careers apply page).
  qImpact?: string;
  qDuties?: string;
  qMotivation?: string;
  qIntegrity?: string;
  qSetback?: string;
  qLoyalty?: string;
  qFlexibility?: string;

  // HEXACO-style trait scores, computed server-side from the raw Likert answers.
  hexacoIntegrity?: string;
  hexacoLoyalty?: string;
  hexacoFlexibility?: string;
  hexacoMindset?: string;
  hexacoHonesty?: string;
  hexacoEmotionality?: string;
  hexacoExtraversion?: string;
  hexacoAgreeableness?: string;
  hexacoConscientiousness?: string;
  hexacoOpenness?: string;
  hexacoProblemSolving?: string;
  hexacoOverall?: string;
  hexacoAnswers?: string;
}

/** The short-answer prompts, in the order the applicant saw them. */
const CHARACTER_PROMPTS: { field: keyof Application; label: string }[] = [
  { field: 'qImpact', label: 'Biggest impact in the previous role' },
  { field: 'qDuties', label: 'Main duties and responsibilities' },
  { field: 'qMotivation', label: 'Why Team RW, and why this role now' },
  { field: 'qIntegrity', label: 'A time they chose not to bend the truth' },
  { field: 'qSetback', label: 'A target or deal they missed' },
  { field: 'qLoyalty', label: 'What keeps them long-term, and why moving on' },
  { field: 'qFlexibility', label: 'Adapting when plans changed' },
];

/**
 * Read-back for a trait score. Every band is written to be affirming — a lower
 * score reads as a working style and a place to grow, never as a failing. Bands
 * are 70+ / 45+ / below, matching how the backend computes the percentage.
 */
const TRAIT_BANDS: { min: number; tag: string; text: string }[][] = [
  [
    { min: 70, tag: 'A firm line', text: "Holds a clear line on honesty. Would flag an error against their own interest and will not cut corners to hit a number. This is the trust luxury clients pay for." },
    { min: 45, tag: 'Principled and practical', text: 'Values doing the right thing and weighs it against real-world pressure. Chooses the honest path and can talk openly through the grey areas.' },
    { min: 0, tag: 'Results-driven', text: "Pragmatic and outcome-focused. In a high-trust luxury environment, leaning a little more on transparency will pay back many times over." },
  ],
  [
    { min: 70, tag: 'Sees it through', text: 'Commits and finishes what they start. Employers can count on them to stay the course when the work stops being exciting.' },
    { min: 45, tag: 'Committed, with eyes open', text: 'Gives real commitment while staying honest about their own growth, a healthy and grounded balance.' },
    { min: 0, tag: 'Opportunity-led', text: 'Goes where the opportunity is and keeps options open. Channelling that drive into a longer runway is where it compounds.' },
  ],
  [
    { min: 70, tag: 'Adapts fast', text: 'Stays calm when plans change and steps outside their lane without hesitation. That adaptability is gold on a fast-moving sales floor.' },
    { min: 45, tag: 'Steady and adaptable', text: 'Adapts well and still values some structure. Can flex when it matters without losing their footing.' },
    { min: 0, tag: 'Structured', text: 'Does their sharpest work with clear structure and rhythm. Building comfort with sudden change will widen the rooms they can win in.' },
  ],
];

const TRAIT_KEYS: { label: string; field: keyof Application }[] = [
  { label: 'Integrity', field: 'hexacoIntegrity' },
  { label: 'Loyalty', field: 'hexacoLoyalty' },
  { label: 'Flexibility', field: 'hexacoFlexibility' },
  { label: 'Mindset', field: 'hexacoMindset' },
  { label: 'Honesty-Humility', field: 'hexacoHonesty' },
  { label: 'Emotionality', field: 'hexacoEmotionality' },
  { label: 'Extraversion', field: 'hexacoExtraversion' },
  { label: 'Agreeableness (versus Anger)', field: 'hexacoAgreeableness' },
  { label: 'Conscientiousness', field: 'hexacoConscientiousness' },
  { label: 'Openness to Experience', field: 'hexacoOpenness' },
  { label: 'Problem solving', field: 'hexacoProblemSolving' },
];

/** Stored scores arrive as strings like "83%". */
const pctToNumber = (value?: string): number => {
  const parsed = parseInt(String(value ?? ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const rowsPerPage = 12;
const EMPTY_APPLICATIONS: Application[] = [];

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString(undefined, {
  day: '2-digit', month: 'short', year: 'numeric',
}) : '-';

const errorMessage = (error: any): string =>
  error?.response?.data?.message ?? 'Something went wrong. Please try again.';

const APPLICATION_SORT = {
  candidate: (row: Application) => row.name,
  role: (row: Application) => row.jobTitle,
  experience: (row: Application) => row.experience,
  applied: (row: Application) => row.createdAt,
};

const Applications: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (applicationId: string) => deleteApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSelectedApplication(null);
      setDeleteTarget(null);
      toast.success('Application deleted');
    },
    onError: (error: any) => {
      setDeleteTarget(null);
      toast.error(errorMessage(error));
    },
  });
  const { data, isPending, error } = useQuery<Application[], Error>({
    queryKey: ['applications'],
    queryFn: getApplications,
  });

  const applications = data || EMPTY_APPLICATIONS;
  const filteredApplications = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter((application) => [
      application.name,
      application.email,
      application.number,
      application.jobTitle,
      application.experience,
      Array.isArray(application.aiTools) ? application.aiTools.join(' ') : '',
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [applications, searchText]);

  const { sorted: sortedApplications, order, orderBy, toggle: toggleSort } = useTableSort(filteredApplications, APPLICATION_SORT);
  const totalPages = Math.max(1, Math.ceil(sortedApplications.length / rowsPerPage));
  const visibleApplications = sortedApplications.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const filteredIds = filteredApplications.map((application) => application._id);
  const selectedCount = selectedIds.length;
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.includes(id));

  const toggleOne = (applicationId: string) => {
    setSelectedIds((current) => (
      current.includes(applicationId)
        ? current.filter((id) => id !== applicationId)
        : [...current, applicationId]
    ));
  };

  const toggleAllFiltered = () => {
    setSelectedIds((current) => (
      allFilteredSelected
        ? current.filter((id) => !filteredIds.includes(id))
        : [...new Set([...current, ...filteredIds])]
    ));
  };

  const confirmBulkDelete = async () => {
    if (!selectedIds.length || bulkDeleting) return;
    setBulkDeleting(true);
    try {
      const ids = [...selectedIds];
      const failed: string[] = [];
      for (const applicationId of ids) {
        try {
          await deleteApplication(applicationId);
        } catch {
          failed.push(applicationId);
        }
      }
      const deletedCount = ids.length - failed.length;
      setSelectedIds(failed);
      if (selectedApplication && !failed.includes(selectedApplication._id)) setSelectedApplication(null);
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      if (failed.length) {
        toast.error(`${failed.length} application${failed.length === 1 ? '' : 's'} could not be deleted.`);
      }
      if (deletedCount) {
        toast.success(`${deletedCount} application${deletedCount === 1 ? '' : 's'} deleted.`);
      }
    } finally {
      setBulkDeleting(false);
      setBulkConfirmOpen(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    setCurrentPage(1);
  };

  const handleResumeDownload = async (application: Application) => {
    setDownloadingResume(true);
    try {
      const response = await downloadApplicationResume(application._id);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = application.resumeFileName || 'resume';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download the resume. Please try again.');
    } finally {
      setDownloadingResume(false);
    }
  };

  if (isPending) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <PageHeader title="Career applications" description="Review candidates who have applied to join the team." crumbs={[{ label: 'Applications' }]} />
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableSkeleton rows={7} columns={6} />
        </Paper>
      </Box>
    );
  }

  if (error) {
    return <Paper sx={{ p: 4, borderRadius: 3 }}><Typography color="error">Unable to load applications. Please try again.</Typography></Paper>;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <PageHeader
        title="Career applications"
        description="Review candidates who have applied to join the team."
        crumbs={[{ label: 'Applications' }]}
        actions={
          <Chip icon={<WorkOutline />} label={`${applications.length} total`} sx={{ bgcolor: tokens.goldSoft, color: tokens.goldText, fontWeight: 600 }} />
        }
      />

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: tokens.shadowSoft }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            value={searchText}
            onChange={handleSearch}
            placeholder="Search name, email, role or experience"
            size="small"
            sx={{ width: { xs: '100%', sm: 380 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">{filteredApplications.length} matching applications</Typography>
            {selectedCount > 0 && (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteOutline />}
                disabled={bulkDeleting}
                onClick={() => setBulkConfirmOpen(true)}
              >
                {bulkDeleting ? 'Deleting...' : `Delete selected (${selectedCount})`}
              </Button>
            )}
          </Box>
        </Box>
        <Divider />

        {visibleApplications.length === 0 ? (
          <EmptyState
            icon={WorkOutline}
            title="No applications found"
            description="New career submissions will appear here automatically. Try a different search."
          />
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 760 }}>
              <TableHead sx={{ bgcolor: tokens.surfaceAlt }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={allFilteredSelected}
                      indeterminate={!allFilteredSelected && someFilteredSelected}
                      onChange={toggleAllFiltered}
                      inputProps={{ 'aria-label': 'Select all matching applications' }}
                    />
                  </TableCell>
                  <SortableHeadCell label="Candidate" sortKey="candidate" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <SortableHeadCell label="Role" sortKey="role" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <SortableHeadCell label="Experience" sortKey="experience" order={order} activeKey={orderBy} onSort={toggleSort} />
                  <TableCell sx={{ fontWeight: 700, color: tokens.text }}>Resume</TableCell>
                  <SortableHeadCell label="Applied" sortKey="applied" order={order} activeKey={orderBy} onSort={toggleSort} />
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleApplications.map((application) => (
                  <TableRow key={application._id} hover onClick={() => setSelectedApplication(application)} sx={{ cursor: 'pointer' }}>
                    <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        size="small"
                        checked={selectedIds.includes(application._id)}
                        onChange={() => toggleOne(application._id)}
                        inputProps={{ 'aria-label': `Select ${application.name || 'application'}` }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{application.name || 'Unnamed candidate'}</Typography>
                      <Typography variant="caption" color="text.secondary">{application.email}</Typography>
                    </TableCell>
                    <TableCell>{application.jobTitle || 'General application'}</TableCell>
                    <TableCell>{application.experience || '-'}</TableCell>
                    <TableCell><Chip size="small" label={application.resumeFileName ? 'Attached' : 'Not attached'} color={application.resumeFileName ? 'success' : 'default'} variant={application.resumeFileName ? 'filled' : 'outlined'} /></TableCell>
                    <TableCell>{formatDate(application.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {filteredApplications.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={Math.min(currentPage, totalPages)} onChange={(_, page) => setCurrentPage(page)} color="primary" shape="rounded" />
        </Box>
      )}

      <ApplicationDetails
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onDelete={setDeleteTarget}
        onDownload={() => selectedApplication && handleResumeDownload(selectedApplication)}
        downloading={downloadingResume}
        deleting={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete application?"
        description="This application and its stored resume will be permanently removed. This cannot be undone."
        confirmLabel="Delete application"
        tone="danger"
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
      <ConfirmDialog
        open={bulkConfirmOpen}
        title={`Delete ${selectedCount} application${selectedCount === 1 ? '' : 's'}?`}
        description="The selected applications and any stored resumes will be permanently removed. This cannot be undone."
        confirmLabel={`Delete ${selectedCount} application${selectedCount === 1 ? '' : 's'}`}
        tone="danger"
        loading={bulkDeleting}
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={confirmBulkDelete}
      />
    </Box>
  );
};

const ApplicationDetails: React.FC<{
  application: Application | null;
  onClose: () => void;
  onDelete: (applicationId: string) => void;
  onDownload: () => void;
  downloading: boolean;
  deleting: boolean;
}> = ({ application, onClose, onDelete, onDownload, downloading, deleting }) => (
  <Dialog open={Boolean(application)} onClose={onClose} fullWidth maxWidth="sm">
    {application && <>
      <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
        {application.name || 'Candidate details'}
        <IconButton onClick={onClose} aria-label="Close" sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{application.jobTitle}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          <Detail label="Email" value={application.email} link={`mailto:${application.email}`} />
          <Detail label="Phone" value={application.number} link={`tel:${application.number}`} />
          <Detail label="Experience" value={application.experience} />
          <Detail label="Current CTC" value={application.currentCtc} />
          <Detail label="Expected CTC" value={application.expectedCtc} />
          <Detail label="Current location" value={application.currentLocation} />
          <Detail label="Notice period" value={application.noticePeriod} />
          <Detail label="Relocation" value={application.relocation} />
          <Detail label="Work mode" value={application.workMode} />
          <Detail
            label="Application source"
            value={application.applicationSourceOther && application.applicationSource === 'Other'
              ? `${application.applicationSource} · ${application.applicationSourceOther}`
              : application.applicationSource}
          />
          {application.referredBy ? <Detail label="Referred by" value={application.referredBy} /> : null}
          <Detail label="Applied" value={formatDate(application.createdAt)} />
          <Detail label="LinkedIn" value={application.linkedinUrl} link={application.linkedinUrl} />
          <Detail label="Portfolio" value={application.portfolioUrl} link={application.portfolioUrl} />
          <Detail label="Social media & AI" value={application.socialMediaSavvy === 'true' ? 'Yes' : application.socialMediaSavvy === 'false' ? 'No' : application.socialMediaSavvy} />
          <Detail label="AI tools they use" value={(Array.isArray(application.aiTools) ? application.aiTools : []).join(', ')} />
          <Detail label="Resume" value={application.resumeFileName || 'No resume attached'} />
        </Box>
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700 }}>Professional references</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, p: 2, bgcolor: tokens.surfaceAlt, border: `1px solid ${tokens.line}`, borderRadius: 1 }}>
          <Detail label="Reference 1" value={[application.ref1Name, application.ref1Number, application.ref1Relationship].filter(Boolean).join(' · ')} />
          <Detail label="Reference 2" value={[application.ref2Name, application.ref2Number, application.ref2Relationship].filter(Boolean).join(' · ')} />
        </Box>
        {application.resumeUrl && (
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
            <Box component="a" href={application.resumeUrl} target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 1, borderRadius: 1.5, bgcolor: tokens.gold, color: tokens.black, textDecoration: 'none', fontSize: 14, fontWeight: 600, '&:hover': { bgcolor: tokens.goldDark } }}>
              View Resume
            </Box>
            <Button onClick={onDownload} disabled={downloading} variant="outlined" sx={{ borderRadius: 1.5, borderColor: tokens.gold, color: tokens.goldText, fontWeight: 600, '&:hover': { bgcolor: tokens.goldSoft, borderColor: tokens.gold } }}>
              {downloading ? 'Downloading...' : 'Download Resume'}
            </Button>
          </Box>
        )}
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700 }}>Cover letter / message</Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: tokens.surfaceAlt, whiteSpace: 'pre-wrap' }}>
          <Typography variant="body2">{application.coverLetter?.replace('Résumé attached.', 'Resume attached.') || 'No message provided.'}</Typography>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          color="error"
          startIcon={<DeleteOutline />}
          onClick={() => onDelete(application._id)}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete Application'}
        </Button>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </DialogActions>
    </>}
  </Dialog>
);

const Detail: React.FC<{ label: string; value?: string; link?: string }> = ({ label, value, link }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.4 }}>{label}</Typography>
    {link && value ? <Typography component="a" href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noreferrer" variant="body2" sx={{ color: tokens.goldText, wordBreak: 'break-word' }}>{value}</Typography> : <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{value || '-'}</Typography>}
  </Box>
);

export default Applications;
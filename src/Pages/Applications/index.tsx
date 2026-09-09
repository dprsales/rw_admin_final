import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { deleteApplication, downloadApplicationResume, getApplications } from '../../api/services';

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
  privacyConsent?: string;
  ref1Name?: string;
  ref1Number?: string;
  ref1Relationship?: string;
  ref2Name?: string;
  ref2Number?: string;
  ref2Relationship?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  coverLetter: string;
  resumeFileName?: string;
  resumeUrl?: string;
  createdAt: string;
}

const rowsPerPage = 12;
const EMPTY_APPLICATIONS: Application[] = [];

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString(undefined, {
  day: '2-digit', month: 'short', year: 'numeric',
}) : '-';

const Applications: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const queryClient = useQueryClient();
  const deleteMutation = useMutation((applicationId: string) => deleteApplication(applicationId), {
    onSuccess: () => {
      queryClient.invalidateQueries('applications');
      setSelectedApplication(null);
    },
  });
  const { data, isLoading, error } = useQuery<Application[], Error>({
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
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [applications, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / rowsPerPage));
  const visibleApplications = filteredApplications.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
    } finally {
      setDownloadingResume(false);
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Paper sx={{ p: 4, borderRadius: 3 }}><Typography color="error">Unable to load applications. Please try again.</Typography></Paper>;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Career applications</Typography>
          <Typography variant="body2" color="text.secondary">Review candidates who have applied to join the team.</Typography>
        </Box>
        <Chip icon={<WorkOutline />} label={`${applications.length} total`} sx={{ bgcolor: '#e7f1f7', color: '#0f63a5', fontWeight: 600 }} />
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 99, 165, 0.08)' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            value={searchText}
            onChange={handleSearch}
            placeholder="Search name, email, role or experience"
            size="small"
            sx={{ width: { xs: '100%', sm: 380 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <Typography variant="caption" color="text.secondary">{filteredApplications.length} matching applications</Typography>
        </Box>
        <Divider />

        {visibleApplications.length === 0 ? (
          <Box sx={{ py: 10, px: 3, textAlign: 'center' }}>
            <WorkOutline sx={{ fontSize: 42, color: '#9bb9ca', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>No applications found</Typography>
            <Typography variant="body2" color="text.secondary">New career submissions will appear here automatically.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 760 }}>
              <TableHead sx={{ bgcolor: '#f3f8fb' }}>
                <TableRow>
                  {['Candidate', 'Role', 'Experience', 'Resume', 'Applied'].map((heading) => <TableCell key={heading} sx={{ fontWeight: 700, color: '#355466' }}>{heading}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleApplications.map((application) => (
                  <TableRow key={application._id} hover onClick={() => setSelectedApplication(application)} sx={{ cursor: 'pointer' }}>
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
        onDelete={(applicationId) => {
          if (window.confirm('Delete this application and its stored resume permanently?')) {
            deleteMutation.mutate(applicationId);
          }
        }}
        onDownload={() => selectedApplication && handleResumeDownload(selectedApplication)}
        downloading={downloadingResume}
        deleting={deleteMutation.isLoading}
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
          <Detail label="Application source" value={application.applicationSource} />
          <Detail label="Applied" value={formatDate(application.createdAt)} />
          <Detail label="LinkedIn" value={application.linkedinUrl} link={application.linkedinUrl} />
          <Detail label="Portfolio" value={application.portfolioUrl} link={application.portfolioUrl} />
          <Detail label="Resume" value={application.resumeFileName || 'No resume attached'} />
        </Box>
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700 }}>Professional references</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, p: 2, bgcolor: '#fafcfd', border: '1px solid #e4edf2', borderRadius: 1 }}>
          <Detail label="Reference 1" value={[application.ref1Name, application.ref1Number, application.ref1Relationship].filter(Boolean).join(' · ')} />
          <Detail label="Reference 2" value={[application.ref2Name, application.ref2Number, application.ref2Relationship].filter(Boolean).join(' · ')} />
        </Box>
        {application.resumeUrl && (
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
            <Box component="a" href={application.resumeUrl} target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 1, borderRadius: 1.5, bgcolor: '#0f63a5', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, '&:hover': { bgcolor: '#0b4f84' } }}>
              View Resume
            </Box>
            <Button onClick={onDownload} disabled={downloading} variant="outlined" sx={{ borderRadius: 1.5, borderColor: '#0f63a5', color: '#0f63a5', fontWeight: 600, '&:hover': { bgcolor: '#e7f1f7', borderColor: '#0f63a5' } }}>
              {downloading ? 'Downloading...' : 'Download Resume'}
            </Button>
          </Box>
        )}
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700 }}>Cover letter / message</Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafcfd', whiteSpace: 'pre-wrap' }}>
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
    {link && value ? <Typography component="a" href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noreferrer" variant="body2" sx={{ color: '#0f63a5', wordBreak: 'break-word' }}>{value}</Typography> : <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{value || '-'}</Typography>}
  </Box>
);

export default Applications;
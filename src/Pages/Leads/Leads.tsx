import React, { useState } from 'react';
import {
  Box, TextField, InputAdornment, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Pagination, Typography, Select, MenuItem, ListSubheader, Checkbox, FormControl,
  Button, Menu, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Search as SearchIcon, ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import LeadModal from './LeadModal'; // Adjust path
import { deleteLead, getLeads } from '../../api/services';

// ----------------------
// Type Declarations
// ----------------------
export interface Lead {
  _id: string;
  source?: string;
  type: string;
  name: string;
  email: string;
  phoneNumber: string;
  projectName?: string;
  message?: string;
  company?: string;
  visitorType?: string;
  challenge?: string;
  goal?: string;
  recommendedService?: string;
  pageSource?: string;
  enquiries?: number;
  krisahInviteSentAt?: string;
  krisahDone?: boolean;
  krisahScore?: number;
  krisahCompletedAt?: string;
  createdAt: string;
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
};

export function leadSourceLabel(lead: Pick<Lead, 'source' | 'pageSource'>): string {
  if (lead.source === 'assessment' || /assessment/i.test(lead.pageSource || '')) return 'Assessment';
  if (lead.source) return SOURCE_LABEL[lead.source] || lead.source;
  return lead.pageSource || '-';
}

export function krisahStatusLabel(lead: Pick<Lead, 'source' | 'pageSource' | 'krisahDone' | 'krisahScore' | 'krisahInviteSentAt'>): string {
  if (lead.krisahDone) {
    return lead.krisahScore != null ? `Completed · ${lead.krisahScore}` : 'Completed';
  }
  if (lead.krisahInviteSentAt) return 'Invite sent';
  if (lead.source === 'assessment' || /assessment/i.test(lead.pageSource || '')) return 'Not started';
  return '—';
}

interface LeadsApiResponse {
  leads: Lead[];
}

// ----------------------
// Component
// ----------------------
const rowsPerPage = 25;

const AllLeads: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [type, setType] = useState<string>('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionsAnchor, setActionsAnchor] = useState<null | HTMLElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ✅ useQuery with proper typing
  const { data, isPending, error } = useQuery<LeadsApiResponse, Error>({
    queryKey: ['leads'],
    queryFn: getLeads,
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
  const serviceOptions = LeadsData.map((lead) => lead.recommendedService || '').filter(Boolean).filter(
    (value, index, self) => self.indexOf(value) === index
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
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

  const handleTypeChange = (event: any) => {
    setType(event.target.value);
  };

  const handleSourceChange = (event: any) => {
    const value = event.target.value;
    setSelectedSources(typeof value === 'string' ? value.split(',') : value);
    setCurrentPage(1);
  };

  // ✅ Filter leads
  const filteredLeads = LeadsData.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchText.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchText.toLowerCase()) ||
      lead.phoneNumber.includes(searchText);

    const matchesType = !  type || lead.type.toLowerCase() === type.toLowerCase();
    const matchesSource = selectedSources.length === 0 || selectedSources.includes(lead.source || '');
    const matchesService = selectedServices.length === 0 || selectedServices.includes(lead.recommendedService || '');

    return matchesSearch && matchesType && matchesSource && matchesService;
  });

  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);
  const paginatedRows = filteredLeads.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
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

  // ----------------------
  // Loading / Error States
  // ---------------------- 
  if (isPending) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error fetching leads.</Typography>;

  return (
    <Box>
      {/* Search & Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TextField
            placeholder="Search for Leads..."
            variant="outlined"
            size="small"
            onChange={handleSearch}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ 
              width: { xs: '100%', sm: '350px' },
              backgroundColor: '#fff',
              boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.1)',
              height: '36px',
              borderRadius: '8px', // Added border radius as per the design
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '& .MuiOutlinedInput-input': {
                padding: '7px',
                marginLeft: '7px',
              },
              '& .MuiInputLabel-outlined': {
                transform: 'translate(14px, 12px) scale(0.5)',
              },
              '& .MuiInputLabel-shrink': {
                transform: 'translate(14px, -6px) scale(0.75)',
              },
              '& .MuiInputAdornment-positionEnd': {
                marginRight: '10px',
              },
              '& .MuiSvgIcon-root': {
                color: '#30779d',
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },          
            }}
          />

          {/* <FormControl sx={{ minWidth: 'auto',mr: 1 }}>
            <Select
              value={type}
              onChange={handleTypeChange}
              displayEmpty
              sx={{
                width: '100%',
                height: "40px",
                border: "1px solid #1212121A",
                borderRadius: "20px",
                opacity: 1,
                boxShadow: "0px 6px 14px #36408D08",
                fontSize: "12px",
                color: "#1D1D1D",
                textAlign: 'left',
              }}
            >
              <MenuItem value="">
                <Typography variant='caption' sx={{ color: '#1D1D1D', opacity: 0.6, fontWeight: 450 }}>
                  Type
                </Typography>
              </MenuItem>
              <MenuItem value="project">
                <Typography variant='caption' sx={{  color: '#1D1D1D' , fontWeight: 450 }}>
                  Project
                </Typography>
              </MenuItem>
              <MenuItem value="individual">
                <Typography variant='caption' sx={{ color: '#1D1D1D' , fontWeight: 450 }}>
                  Contact 
                </Typography>
              </MenuItem>
            </Select>
          </FormControl> */}

          {sourceOptions.length > 0 && (
            <FormControl sx={{ minWidth: 120 }}>
              <Select
                multiple
                value={selectedSources}
                onChange={handleSourceChange}
                IconComponent={ArrowDropDownIcon}
                displayEmpty
                renderValue={(selected) => (
                  <Box display="flex" alignItems="center">
                    {selected.length > 0 ? (
                      <>
                        <Typography variant='caption' sx={{ fontSize: '10px', color: '#1D1D1D', opacity: 0.6 }}>Sources</Typography>
                        <Box
                           component="span"
                          borderRadius="50%"
                          fontSize="10px"
                          marginLeft="5px"
                          width="15px"
                          height="15px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"

                          sx={{
                            backgroundColor: '#30779d',
                            color: '#FFFFFF',
                          }}
                        >
                          {selected.length}
                        </Box>
                      </>
                    ) : (
                      <Typography variant='caption' sx={{ fontSize: '10px', color: '#1D1D1D', opacity: 0.6 }}>Select Sources</Typography>
                    )}
                  </Box>
                )}
                sx={{
                  width: '100%',
                  height: "40px",
                  border: "1px solid #1212121A",
                  borderRadius: "20px",
                  opacity: 1,
                  boxShadow: "0px 6px 14px #36408D08",
                  fontSize: "12px",
                  color: "#1D1D1D",
                  textAlign: 'left',
                }}
              >
                <ListSubheader sx={{ background: 'transparent' }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, color: '#1D1D1D' }}>
                    Sources
                  </Typography>
                </ListSubheader>
                {sourceOptions.map((source) => (
                  <MenuItem key={source} value={source}>
                    <Checkbox checked={selectedSources.indexOf(source) > -1} size="small"   sx={{ color: '#1D1D1D', fontSize: "10px" }}/>
                    <Typography variant="caption" sx={{ fontWeight: 500, color: '#1D1D1D' }}>{source}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {serviceOptions.length > 0 && (
            <FormControl sx={{ minWidth: 150 }}>
              <Select
                multiple
                value={selectedServices}
                onChange={(event: any) => { const v = event.target.value; setSelectedServices(typeof v === 'string' ? v.split(',') : v); setCurrentPage(1); }}
                IconComponent={ArrowDropDownIcon}
                displayEmpty
                renderValue={(selected) => (
                  <Typography variant='caption' sx={{ fontSize: '10px', color: '#1D1D1D', opacity: selected.length ? 1 : 0.6 }}>
                    {selected.length ? `Recommended (${selected.length})` : 'Recommended service'}
                  </Typography>
                )}
                sx={{ height: "40px", border: "1px solid #1212121A", borderRadius: "20px", boxShadow: "0px 6px 14px #36408D08", fontSize: "12px", color: "#1D1D1D" }}
              >
                {serviceOptions.map((key) => (
                  <MenuItem key={key} value={key}>
                    <Checkbox checked={selectedServices.indexOf(key) > -1} size="small" sx={{ color: '#1D1D1D' }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, color: '#1D1D1D' }}>{SERVICE_LABEL[key] || key}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
        <Button
          variant="outlined"
          endIcon={<ArrowDropDownIcon />}
          onClick={(event) => setActionsAnchor(event.currentTarget)}
          sx={{
            height: '40px',
            borderRadius: '20px',
            borderColor: '#1212121A',
            boxShadow: '0px 6px 14px #36408D08',
            fontSize: '12px',
            color: '#1D1D1D',
            textTransform: 'none',
            px: 2,
          }}
        >
          Actions{selectedCount ? ` (${selectedCount})` : ''}
        </Button>
        <Menu
          anchorEl={actionsAnchor}
          open={Boolean(actionsAnchor)}
          onClose={() => setActionsAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem disabled>
            <Typography variant="caption" sx={{ fontWeight: 500, color: '#1D1D1D', opacity: 0.5 }}>Export CSV</Typography>
          </MenuItem>
          <MenuItem
            disabled={!selectedCount || deleteMutation.isPending}
            onClick={() => {
              setActionsAnchor(null);
              setDeleteError('');
              setConfirmDelete(true);
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 500, color: selectedCount ? '#c62828' : '#1D1D1D' }}>
              Delete{selectedCount ? ` (${selectedCount})` : ''}
            </Typography>
          </MenuItem>
        </Menu>
      </Box>

      {/* Leads Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '10px' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#30779d40' }}>
            <TableRow>
              <TableCell padding="checkbox" sx={{ padding: '6px 8px' }}>
                <Checkbox
                  size="small"
                  checked={allPageSelected}
                  indeterminate={!allPageSelected && somePageSelected}
                  onChange={togglePage}
                  inputProps={{ 'aria-label': 'Select leads on this page' }}
                />
              </TableCell>
              {['S.No', 'Project Name', 'Type', 'Name', 'Email', 'Phone Number', 'Source', 'Recommended', 'Test', 'Date'].map((text) => (
                <TableCell key={text} align="left" sx={{ padding: "8px" }}>
                  <Typography variant="caption"  sx={{ marginLeft: "20px", fontWeight: '600' }} >{text}</Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((lead, index) => (
              <TableRow
                key={lead._id}
                hover
                onClick={() => handleRowClick(lead)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell padding="checkbox" sx={{ padding: '6px 8px' }} onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    size="small"
                    checked={selectedIds.includes(lead._id)}
                    onChange={() => toggleOne(lead._id)}
                    inputProps={{ 'aria-label': `Select ${lead.name || 'lead'}` }}
                  />
                </TableCell>
                <TableCell align="left" sx={{ padding: "6px" }}>
                  <Typography variant="caption" sx={{ marginLeft: "25px", fontWeight: 400 }}>{(currentPage - 1) * rowsPerPage + index + 1}</Typography>
                  </TableCell>
                <TableCell align="left" sx={{ padding: "6px" }}>
                  <Typography variant="caption" sx={{ marginLeft: "25px", fontWeight: 400 }}>
                    {lead.projectName ? (lead.projectName.length > 12 ? `${lead.projectName.slice(0, 12)}...` : lead.projectName) : '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ padding: '6px' }}>
                  <Typography variant="caption" sx={{ marginLeft: "25px", fontWeight: 400 }}>{lead.type}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '6px' }}>
                  <Typography variant="caption" sx={{ marginLeft: "25px", fontWeight: 400 }}>{lead.name}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '6px' }}>
                  <Typography variant="caption" sx={{ marginLeft: "25px", fontWeight: 400 }}>{lead.email}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '6px' }}>
                  <Typography variant="caption" sx={{ marginLeft: "25px", fontWeight: 400 }}>{lead.phoneNumber}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '6px' }}>
                  <Typography variant="caption" sx={{ marginLeft: "25px", fontWeight: 400 }}>{leadSourceLabel(lead)}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '6px' }}>
                  <Typography variant="caption" sx={{ marginLeft: "25px", fontWeight: 400 }}>
                    {lead.recommendedService ? (SERVICE_LABEL[lead.recommendedService] || lead.recommendedService) : '-'}
                    {lead.enquiries && lead.enquiries > 1 ? ` ×${lead.enquiries}` : ''}
                  </Typography>
                </TableCell>
                <TableCell sx={{ padding: '6px' }}>
                  <Typography variant="caption" sx={{ marginLeft: "25px", fontWeight: 400 }}>{krisahStatusLabel(lead)}</Typography>
                </TableCell>
                <TableCell sx={{ padding: '6px' }}>
                  <Typography variant="caption" sx={{ marginLeft: "25px", fontWeight: 400 }}>{new Date(lead.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={3}>
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
              backgroundColor: "#EFEFEF",
            },
            "& .Mui-selected": {
              backgroundColor: theme.palette.primary.main,
              color: "#fff",
            },
          }}
        />
      </Box>

      {/* Modal */}
      {selectedLead && (
        <LeadModal lead={selectedLead} open={openModal} handleClose={handleModalClose} />
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

    </Box>
  );
};

export default AllLeads;

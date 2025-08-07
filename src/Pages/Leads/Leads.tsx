import React, { useState } from 'react';
import {
  Box, TextField, InputAdornment, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Pagination, Typography, Select, MenuItem, ListSubheader, Checkbox, FormControl
} from '@mui/material';
import { Search as SearchIcon, ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useQuery } from 'react-query';

import LeadModal from './LeadModal'; // Adjust path
import { getLeads } from '../../api/services';

// ----------------------
// Type Declarations
// ----------------------
export interface Lead {
  _id: string;
  source: string;
  type: string;
  name: string;
  email: string;
  phoneNumber: string;
  projectName?: string;
  message?: string;
  createdAt: string;
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

  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [type, setType] = useState<string>('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showSourceSelect, setShowSourceSelect] = useState(false);

  // ✅ useQuery with proper typing
  const { data, isLoading, error } = useQuery<LeadsApiResponse, Error>({
    queryKey: ['leads'],
    queryFn: getLeads,
  });

  const LeadsData = data?.leads || [];

  const sourceOptions = LeadsData.map((lead) => lead.source).filter(Boolean).filter(
    (value, index, self) => self.indexOf(value) === index
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value);

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
    setShowSourceSelect(event.target.value === 'project');
  };

  const handleSourceChange = (event: any) => {
    const value = event.target.value;
    setSelectedSources(typeof value === 'string' ? value.split(',') : value);
  };

  // ✅ Filter leads
  const filteredLeads = LeadsData.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchText.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchText.toLowerCase()) ||
      lead.phoneNumber.includes(searchText);

    const matchesType = !  type || lead.type.toLowerCase() === type.toLowerCase();
    const matchesSource = selectedSources.length === 0 || selectedSources.includes(lead.source);

    return matchesSearch && matchesType && matchesSource;
  });

  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);
  const paginatedRows = filteredLeads.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // ----------------------
  // Loading / Error States
  // ---------------------- 
  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error fetching leads.</Typography>;

  return (
    <Box>
      {/* Search & Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
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

          {showSourceSelect && (
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
        </Box>
      </Box>

      {/* Leads Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '10px' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#30779d40' }}>
            <TableRow>
              {['S.No', 'Project Name', 'Type', 'Name', 'Email', 'Phone Number', 'Date'].map((text) => (
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

    </Box>
  );
};

export default AllLeads;

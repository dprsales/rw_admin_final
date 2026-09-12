import React, { useState } from 'react';
import {
  Box, TextField, InputAdornment, Button, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Pagination, Typography,
  Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions
} from '@mui/material';
import { Search as SearchIcon, Add as Plus, Delete as DeleteIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { Project } from './ProjectInterface';
import AddProject from './Drawers/AddProject';
import { deleteProject } from '../../api/services';
import { toast } from 'react-toastify';
import AddAllProjects from './Drawers/AddAllProjects';

const rowsPerPage = 100;

interface ProjectsProps {
  ProjectsData: Project[];
  onDelete: () => void;
}

const Projects1: React.FC<ProjectsProps> = ({ ProjectsData, onDelete }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteProjectTitle, setDeleteProjectTitle] = useState('');

  const queryClient = useQueryClient();

  const deleteMutation = useMutation(deleteProject, {
    onSuccess: () => {
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries('getProjects');
      onDelete();
      setDeleteProjectId(null);
      setDeleteProjectTitle('');
    },
    onError: () => {
      toast.error('Error deleting project');
    }
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleRowClick = (slug: string) => {
    navigate(`/projects/${slug}`);
  };

  const handleDeleteConfirm = () => {
    if (deleteProjectId) {
      deleteMutation.mutate(deleteProjectId);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, projectId: string, title: string) => {
    e.stopPropagation();
    setDeleteProjectId(projectId);
    setDeleteProjectTitle(title);
  };

  const handleDeleteCancel = () => {
    setDeleteProjectId(null);
    setDeleteProjectTitle('');
  };

  const safeToLower = (v: any) => (typeof v === 'string' ? v.toLowerCase() : '');
  const filtered = ProjectsData?.filter(p => safeToLower(p.name).includes(safeToLower(searchText))) || [];
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  return (
    <Box>
      {/* Header and Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          placeholder="Search Projects..."
          size="small"
          onChange={handleSearch}
          sx={{
            width: 350,
            backgroundColor: '#fff',
            borderRadius: '8px',
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <Button
          variant="contained"
          startIcon={<Plus />}
          sx={{ color: '#fff', ml: 2 }}
         onClick={() => setIsAddDrawerOpen(true)}
        >
          Add New Project
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#30779d40' }}>
            <TableRow>
              <TableCell align="left" sx={{ padding: "8px" }}>
                <Typography variant="caption" sx={{ marginLeft: "20px", fontWeight: '600' }}>S.No</Typography>
              </TableCell>
              <TableCell align="left" sx={{ padding: "8px" }}>
                <Typography variant="caption" sx={{ marginLeft: "20px", fontWeight: '600' }}>Name</Typography>
              </TableCell>
              <TableCell align="left" sx={{ padding: "8px" }}>
                <Typography variant="caption" sx={{ marginLeft: "20px", fontWeight: '600' }}>Location</Typography>
              </TableCell>
              <TableCell align="left" sx={{ padding: "8px" }}>
                <Typography variant="caption" sx={{ marginLeft: "20px", fontWeight: '600' }}>Towers</Typography>
              </TableCell>

              <TableCell align="left" sx={{ padding: "8px" }}>
                <Typography variant="caption" sx={{ marginLeft: "20px", fontWeight: '600' }}>BHK</Typography>
              </TableCell>
              <TableCell align="left" sx={{ padding: "8px" }}>
                <Typography variant="caption" sx={{ marginLeft: "20px", fontWeight: '600' }}>Parking Area</Typography>
              </TableCell>
              <TableCell align="left" sx={{ padding: "8px" }}>
                <Typography variant="caption" sx={{ marginLeft: "20px", fontWeight: '600' }}>Status</Typography>
              </TableCell>
              <TableCell align="left" sx={{ padding: "8px" }}>
                <Typography variant="caption" sx={{ marginLeft: "20px", fontWeight: '600' }}>Action</Typography>
              </TableCell>

            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((row, idx) => {
              const isPending = !row.amenities?.length || !row.bankOffers?.length;
              const status = isPending
                ? { text: 'Pending', color: 'red', bg: '#FF000020' }
                : { text: 'Completed', color: 'green', bg: '#00800020' };

              return (
                <TableRow
                  key={row._id}
                  onClick={() => handleRowClick(row.projectId)}
                  sx={{ cursor: 'pointer','&:hover': {
                        backgroundColor: '#f5f5f5',
                      } }}>

                  <TableCell sx={{ padding: '6px' }}>
                    <Typography variant="caption" sx={{ marginLeft: "25px" }}>
                      {(currentPage - 1) * rowsPerPage + idx + 1}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ padding: '6px' }}>
                    <Typography variant="caption" sx={{ marginLeft: "25px" }}>{row.title}</Typography>
                  </TableCell>
                  <TableCell sx={{ padding: '6px' }}>
                    <Typography variant="caption" sx={{ marginLeft: "25px" }}>{row.location}</Typography>
                  </TableCell>
                  {/* <TableCell sx={{ padding: '6px' }}>
                    <Typography variant="caption" sx={{ marginLeft: "25px" }}>{row.sqft}</Typography>
                  </TableCell> */}
                  <TableCell sx={{ padding: '6px' }}>
                    <Typography variant="caption" sx={{ marginLeft: "25px" }}>{row.towers}</Typography>
                  </TableCell>
                  <TableCell sx={{ padding: '6px' }}>
                    <Typography variant="caption" sx={{ marginLeft: "25px" }}>{Array.isArray(row.bhk) ? row.bhk.join(', ') : ''}</Typography>
                    </TableCell>
                  <TableCell sx={{ padding: '6px' }}>
                     <Typography variant="caption" sx={{ marginLeft: "25px" }}>{row.parkingarea}</Typography>
                  </TableCell>
                  <TableCell sx={{ padding: '6px' }}>
                    <Tooltip title={status.text}>
                      <Box sx={{
                        backgroundColor: status.bg,
                        px: 2,
                        borderRadius: '20px',
                        display: 'inline-block'
                      }}>
                        <Typography variant="caption" sx={{ color: status.color }}>
                          {status.text}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '6px' }}>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteClick(e, row.projectId, row.title)}
                        sx={{ color: '#d32f2f' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}


          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(e, val) => setCurrentPage(val)}
          shape="rounded"
        />
      </Box>

      {/* Add Drawer Integration */}
      <AddProject
        open={isAddDrawerOpen}
        onClose={() => {
          setIsAddDrawerOpen(false);
          onDelete();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteProjectId} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "<strong>{deleteProjectTitle}</strong>"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteMutation.isLoading}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteMutation.isLoading}>
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects1;

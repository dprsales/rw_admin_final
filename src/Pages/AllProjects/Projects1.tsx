import React, { useState } from 'react';
import {
  Box, TextField, InputAdornment, Button, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Pagination, Typography,
  Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, CircularProgress
} from '@mui/material';
import { Search as SearchIcon, Add as Plus, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, Projects } from './ProjectInterface';
import AddProject from './Drawers/AddProject';
import { deleteProject } from '../../api/services';
import { toast } from 'react-toastify';
import AddAllProjects from './Drawers/AddAllProjects';

const rowsPerPage = 100;

interface ProjectsProps {
  ProjectsData: Project[];
  onDelete: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isSearching?: boolean;
}

const Projects1: React.FC<ProjectsProps> = ({
  ProjectsData,
  onDelete,
  page,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  isSearching = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [editProject, setEditProject] = useState<Projects | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteProjectTitle, setDeleteProjectTitle] = useState('');

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['getProjects'] });
      onDelete();
      setDeleteProjectId(null);
      setDeleteProjectTitle('');
    },
    onError: () => {
      toast.error('Error deleting project');
    }
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
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

  const handleEditClick = (e: React.MouseEvent, row: Project) => {
    e.stopPropagation();
    setEditProject({
      title: row.title,
      bhk: row.bhk,
      towers: row.towers,
      parkingarea: row.parkingarea,
      location: row.location,
      sqft: row.sqft,
      highlights: row.highlights || [],
      slug: row.projectId,
      projectimage: row.projectimage || '',
      rera: row.rera || '',
      date: row.date || 0,
    });
  };

  const handleDeleteCancel = () => {
    setDeleteProjectId(null);
    setDeleteProjectTitle('');
  };

  return (
    <Box>
      {/* Header and Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          placeholder="Search Projects..."
          size="small"
          value={search}
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
                {isSearching ? <CircularProgress size={18} /> : <SearchIcon />}
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
            {ProjectsData.map((row, idx) => {
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
                      {(page - 1) * rowsPerPage + idx + 1}
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
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(e) => handleEditClick(e, row)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
          page={page}
          onChange={(e, val) => onPageChange(val)}
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

      {/* Edit Drawer Integration */}
      <AddAllProjects
        open={!!editProject}
        onClose={() => {
          setEditProject(null);
          onDelete();
        }}
        initialData={editProject || undefined}
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
          <Button onClick={handleDeleteCancel} disabled={deleteMutation.isPending}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects1;

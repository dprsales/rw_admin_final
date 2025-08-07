import React, { useState } from 'react';
import { Projects } from '../ProjectInterface';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Divider,
  Card,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddAllProjects from '../Drawers/AddAllProjects';

interface Props {
  data: Projects;
}

const CDN_URL = process.env.NEXT_PUBLIC_STORAGE_DN_URL || 'https://dprstorage.b-cdn.net';

const resolveImageUrl = (path: string) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${CDN_URL}${path}`;
};

const AllProjectsDetails: React.FC<Props> = ({ data }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [details, setDetails] = useState<Projects>(data);

  // ✅ Debug log
  console.log('📦 AllProjectsDetails received:', details);

  // ✅ Show fallback if data is incomplete
  if (!details || !details.title) {
    return <Typography color="error">Project details not found.</Typography>;
  }

  const highlights = details.highlights || [];
  const layoutImage = resolveImageUrl(details.projectimage || '');

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box display="flex" justifyContent="flex-start" alignItems="center">
        <Typography variant="h5" sx={{ fontWeight: 550, mr: 1 }}>
          <b style={{ color: 'black' }}>Project Details:</b>
        </Typography>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
          {details.title}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Card sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>Main Details</Typography>
          <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: 'primary.main' }}>
            <EditIcon />
          </IconButton>
        </Box>

        <Box mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><b>Title:</b> {details.title}</Grid>
            <Grid item xs={12} md={3}><b>BHK:</b> {details.bhk?.join(', ')}</Grid>
            <Grid item xs={12} md={3}><b>Sqft:</b> {details.sqft?.join(', ')}</Grid>
            <Grid item xs={12} md={3}><b>Slug:</b> {details.slug}</Grid>
            <Grid item xs={12} md={3}><b>Launch Date:</b> {details.date}</Grid>
            <Grid item xs={12} md={3}><b>RERA:</b> {details.rera}</Grid>
            <Grid item xs={12} md={3}><b>Towers:</b> {details.towers}</Grid>
            <Grid item xs={12} md={3}><b>Parking Area:</b> {details.parkingarea}</Grid>
            <Grid item xs={12} md={6}><b>Location:</b> {details.location}</Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 3 }}>
            Highlights:
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {highlights.length > 0 ? highlights.map((point, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box component="li" sx={{ pl: 2 }}>
                  <Typography variant="body2">{point}</Typography>
                </Box>
              </Grid>
            )) : (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">No highlights provided.</Typography>
              </Grid>
            )}
          </Grid>

          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600}>Layout Image:</Typography>
              <Card sx={{ p: 1, mt: 1 }}>
                <img
                  src={layoutImage}
                  alt="Layout"
                  style={{ width: '100%', borderRadius: 4 }}
                  onError={(e) => (e.currentTarget.src = '/fallback.jpg')}
                />
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Drawer to edit project */}
      <AddAllProjects
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialData={details}
        // Optional onSubmit
        // onSubmit={(newData: Projects) => {
        //   setDetails(newData);
        //   setDrawerOpen(false);
        // }}
      />
    </Paper>
  );
};

export default AllProjectsDetails;

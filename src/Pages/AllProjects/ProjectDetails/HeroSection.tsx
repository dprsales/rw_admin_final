import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Divider, Grid, IconButton, CircularProgress, Card
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import HeroSectionDrawer from '../Drawers/HeroSection';
import { HeroSection as HeroSectionType } from '../ProjectInterface';
import { getProjectDetails } from '../../../api/services';

interface Props {
  slug: string;
  refetch: () => void;
  data: HeroSectionType | null;
}

const CDN_URL = process.env.NEXT_PUBLIC_STORAGE_DN_URL || 'https://dprstorage.b-cdn.net';

const resolveImageUrl = (path: string) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${CDN_URL}${path}`;
};

const HeroSection: React.FC<Props> = ({ slug, refetch, data }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [heroData, setHeroData] = useState<HeroSectionType | null>(data);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!data) {
      fetchData();
    } else {
      setHeroData(data);
      setLoading(false);
    }
  }, [data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getProjectDetails(slug);
      setHeroData(res.data.herosection || null);
    } catch (err) {
      console.error('Failed to fetch Hero Section:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    fetchData();
    refetch();
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Always show header and edit icon */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={550}>Hero Section</Typography>
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: 'primary.main' }}>
          <EditIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Content logic */}
      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : !heroData ? (
        <Typography variant="body2" color="text.secondary">
          No Hero Section data found. Please click the edit icon to add it.
        </Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4} textAlign='start'><Typography variant='body2'><strong>H1:</strong> {heroData.h1}</Typography></Grid>
            <Grid item xs={12} md={4} textAlign='start'><Typography variant='body2'><strong>H2:</strong> {heroData.h2}</Typography></Grid>
            <Grid item xs={12} md={4} textAlign='start'><Typography variant='body2'><strong>H3:</strong> {heroData.h3}</Typography></Grid>
            <Grid item xs={12} md={4} textAlign='start'><Typography variant='body2'><strong>RERA:</strong> {heroData.rera}</Typography></Grid>
            <Grid item xs={12} md={4} textAlign='start'><Typography variant='body2'><strong>Location:</strong> {heroData.loc}</Typography></Grid>
            <Grid item xs={12} md={4} textAlign='start'><Typography variant='body2'><strong>Align:</strong> {heroData.alig}</Typography></Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" mb={1} textAlign='start'>Background Image :</Typography>
              <Card sx={{ height: 150 }}>
                <img src={resolveImageUrl(heroData.backgroundimage)} alt="Background" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" mb={1} textAlign='start'>Project Image :</Typography>
              <Card sx={{ height: 150 }}>
                <img src={resolveImageUrl(heroData.projectimage)} alt="Project" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" mb={1} textAlign='start'>Project Logo :</Typography>
              <Card sx={{ height: 150 }}>
                <img src={resolveImageUrl(heroData.projectlogo)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Drawer to Add/Edit */}
      <HeroSectionDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        slug={slug}
        refetch={refetch}
        existingData={heroData}
      />
    </Paper>
  );
};

export default HeroSection;

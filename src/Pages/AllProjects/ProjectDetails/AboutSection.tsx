import React, { useEffect, useState } from 'react';
import {
  Paper, Typography, Box, Divider, Grid, Card, IconButton, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { AboutSection as AboutSectionType } from '../ProjectInterface';
import AboutSectionDrawer from '../Drawers/AboutSection';
import { getProjectDetails } from '../../../api/services';

interface Props {
  slug: string;
  refetch: () => void;
  data: AboutSectionType | null;
}

const CDN_URL = process.env.NEXT_PUBLIC_STORAGE_DN_URL || 'https://dprstorage.b-cdn.net';

const resolveImageUrl = (path: string) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${CDN_URL}${path}`;
};

const AboutSectionDetails: React.FC<Props> = ({ slug, refetch, data }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aboutData, setAboutData] = useState<AboutSectionType | null>(data);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!data) {
      fetchData();
    } else {
      setAboutData(data);
      setLoading(false);
    }
  }, [data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getProjectDetails(slug);
      setAboutData(res.data.aboutsection || null);
    } catch (err) {
      console.error('Failed to fetch About Section:', err);
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
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={600}>About Section</Typography>
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: 'primary.main' }}>
          <EditIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Loading Spinner */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : !aboutData ? (
        <Typography variant="body2" color="text.secondary">
          No About Section data found. Click the edit icon to add it.
        </Typography>
      ) : (
        <>
          <Typography variant="body2" mb={1} textAlign='start' sx={{ fontWeight: 700 }}>
            Description:
          </Typography>
          <Typography variant="body2" mb={2} textAlign='start'>
            {aboutData.des}
          </Typography>


          <Typography variant="subtitle2" mt={3} mb={1} textAlign='start'>Images :</Typography>
          <Grid container spacing={2}>
            {aboutData.images.map((img, idx) => (
              <Grid item xs={12} sm={4} key={idx}>
                <Card sx={{ p: 1, height: '150px' }}>
                  {img.h1 && <Typography variant="subtitle2" textAlign='start'>{img.h1}</Typography>}
                  <img src={resolveImageUrl(img.img)} alt={`About ${idx}`} style={{ width: '100%', borderRadius: 4 }} />
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle2" mt={3} mb={1} textAlign='start'>Highlights :</Typography>
          <Grid container spacing={2}>
            {aboutData.highlights.map((hl, idx) => (
              <Grid item xs={12} sm={3} key={idx} alignItems='flex-start'>
                <Box sx={{ p: 2 }}>
                  <Typography fontWeight={600} textAlign='start'>{hl.h1}</Typography>
                  <Typography variant="body2" textAlign='start'>{hl.d1}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )
      }

      {/* Drawer */}
      <AboutSectionDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        slug={slug}
        refetch={refetch}
        existingData={aboutData}
      />
    </Paper>
  );
};

export default AboutSectionDetails;

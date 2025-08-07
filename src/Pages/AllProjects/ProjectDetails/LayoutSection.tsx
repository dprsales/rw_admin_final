import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Card,
  Grid,
  IconButton,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LayoutDrawer from '../Drawers/LayoutDrawer';
import { getProjectDetails } from '../../../api/services';

interface LayoutApiType {
  d1: string;
  img: string;
  highlights?: string[];
}

interface LayoutDrawerType {
  d1: string;
  img: string;
  highlights: { value: string }[];
}

interface Props {
  slug: string;
  refetch: () => void;
  data: LayoutApiType | null;
}


const CDN_URL = process.env.NEXT_PUBLIC_STORAGE_DN_URL || 'https://dprstorage.b-cdn.net';

const resolveImageUrl = (path: string) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${CDN_URL}${path}`;
};

const LayoutSectionDetails: React.FC<Props> = ({ slug, refetch, data }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [layoutData, setLayoutData] = useState<LayoutApiType | null>(data);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!data) fetchData();
    else {
      setLayoutData(data);
      setLoading(false);
    }
  }, [data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getProjectDetails(slug);
      setLayoutData(res.data.layout || null);
    } catch (err) {
      console.error('Failed to load layout:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    fetchData();
    refetch();
  };

  const transformedForDrawer: LayoutDrawerType | null = layoutData
    ? {
        ...layoutData,
        highlights: (layoutData.highlights || []).map(h => ({ value: h })),
      }
    : null;

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={600}>Layout Section</Typography>
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: 'primary.main' }}>
          <EditIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !layoutData ? (
        <Typography variant="body2" color="text.secondary">
          No layout data available. Click the edit icon to add it.
        </Typography>
      ) : (
        <>
          <Typography variant="body2" mb={2} textAlign='start'>
            <strong>Description:</strong> {layoutData.d1}
          </Typography>

          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }} textAlign="start">
            Highlights :
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {(layoutData.highlights || []).map((point, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box component="li" sx={{ listStyleType: 'disc', pl: 2,textAlign:'start' }}>
                  <Typography variant="body2" fontWeight={500} component="span" textAlign='start'>
                    {point}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Grid container sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600} textAlign="start">Layout Image :</Typography>
              <Card sx={{ p: 1, mt: 1 }}>
                <img
                  src={resolveImageUrl(layoutData.img)}
                  alt="Layout"
                  style={{ width: '100%', height: 'auto', borderRadius: 4 }}
                />
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      <LayoutDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        slug={slug}
        refetch={refetch}
        existingData={transformedForDrawer}
      />
    </Paper>
  );
};

export default LayoutSectionDetails;

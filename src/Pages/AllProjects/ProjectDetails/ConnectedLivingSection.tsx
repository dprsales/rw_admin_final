import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Card,
  IconButton,
  CircularProgress,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { getProjectDetails } from '../../../api/services';
import ConnectedLivingDrawer from '../Drawers/ConnectedLivingDrawer';
import { ConnectedLiving } from '../ProjectInterface';

interface ConnectedLivingProps {
  slug: string;
  refetch: () => void;
  data: ConnectedLiving | null;
}

const CDN_URL = process.env.NEXT_PUBLIC_STORAGE_DN_URL || 'https://dprstorage.b-cdn.net';

const resolveImageUrl = (path: string) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${CDN_URL}${path}`;
};

const ConnectedLivingSection: React.FC<ConnectedLivingProps> = ({ slug, refetch, data }) => {
  const [connectedData, setConnectedData] = useState<ConnectedLiving | null>(data);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!data) {
      fetchData();
    } else {
      setConnectedData(data);
      setLoading(false);
    }
  }, [data]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getProjectDetails(slug);
      setConnectedData(res.data.connectedliving || null);
    } catch (err) {
      console.error('Failed to fetch connected living:', err);
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
      {/* Heading and Edit Icon */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={550}>Connected Living</Typography>
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: 'primary.main' }}>
          <EditIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Loading State */}
      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : !connectedData ? (
        <Typography variant="body2" color="text.secondary">
          No connected living data available. Click the edit icon to add.
        </Typography>
      ) : (
        <>
          {/* Location Groups */}
          {connectedData.data.map((group, idx) => (
            <Box key={idx} mb={3}>
              <Typography variant="subtitle1" sx={{ textAlign: 'start', color: 'black' }} fontWeight={600}>
                {group.type} :
              </Typography>
              <Grid container spacing={2} mt={1}>
                {group.data.map((item, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Box display="flex" alignItems="center" justifyContent="start">
                      <Typography variant="body2" sx={{ fontWeight: '600' }}>
                        {item.h1} : &nbsp;
                      </Typography>
                      <Typography variant="body2" sx={{ textAlign: 'justify' }}>
                        {item.time} min away
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}

          {/* Location Image */}
          <Box>
            <Typography variant="subtitle1" fontWeight={550} textAlign="start">
              Location Image :
            </Typography>
            <Card sx={{ p: 1, mb: 3, height: '150px', width: '200px', mt: 2 }}>
              <img
                src={resolveImageUrl(connectedData.locationimage)}
                alt="Connected Living Map"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
              />
            </Card>
          </Box>
        </>
      )}

      {/* Drawer */}
      <ConnectedLivingDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        slug={slug}
        refetch={refetch}
        existingData={connectedData}
      />
    </Paper>
  );
};

export default ConnectedLivingSection;

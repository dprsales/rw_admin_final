import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Divider, Grid, IconButton, CircularProgress, Card
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Amenities } from '../ProjectInterface';
import { getProjectDetails } from '../../../api/services';
import AmenitiesDrawer from '../Drawers/AmenitiesDrawer';

interface Props {
  slug: string;
  refetch: () => void;
  data: Amenities | null;
}

const CDN_URL = process.env.NEXT_PUBLIC_STORAGE_DN_URL || 'https://dprstorage.b-cdn.net';

const resolveImageUrl = (path: string) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${CDN_URL}${path}`;
};

const AmenitiesSection: React.FC<Props> = ({ slug, refetch, data }) => {
  const [amenities, setAmenities] = useState<Amenities | null>(data);
  const [loading, setLoading] = useState(!data);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!data) fetchData();
    else {
      setAmenities(data);
      setLoading(false);
    }
  }, [data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getProjectDetails(slug);
      setAmenities(res.data.amenities || null);
    } catch (err) {
      console.error('Failed to fetch amenities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    fetchData();
    refetch();
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={550}>Amenities</Typography>
        <IconButton sx={{ color: 'primary.main' }} onClick={() => setDrawerOpen(true)}>
          <EditIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      {loading ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : !amenities ? (
        <Typography variant="body2" color="text.secondary">
          No amenities data available. Click the edit icon to add.
        </Typography>
      ) : (
        <>
          <Typography variant="body2" mb={3} textAlign='start'>
            <b>Description : </b> {amenities.d1}
          </Typography>

          <Grid container spacing={2}>
            {amenities.data.map((item, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                  <img
                    src={resolveImageUrl(item.logo)}
                    alt={item.h1}
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: 'contain',
                      borderRadius: 4,
                    }}
                  />
                  <Typography variant="body2">{item.h1}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <AmenitiesDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        slug={slug}
        refetch={refetch}
        existingData={amenities}
      />
    </Paper>
  );
};

export default AmenitiesSection;

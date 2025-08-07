import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  IconButton,
  Card,
  CardMedia,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GallerySectionDrawer from '../Drawers/GallerySectionDrawer';
import { getProjectDetails } from '../../../api/services';

interface GalleryGrid {
  c0r0?: string[];
  c0r1?: string[];
  c1r0?: string[];
  c2r0?: string[];
  c2r1?: string[];
}

interface GallerySection {
  interior?: GalleryGrid;
  exterior?: GalleryGrid;
}

interface GallerySectionProps {
  slug: string;
  refetch: () => void;
  data: GallerySection | null;
}

const sectionOrder = ['c0r0', 'c0r1', 'c1r0', 'c2r0', 'c2r1'] as const;

const GallerySectionComponent: React.FC<GallerySectionProps> = ({ slug, refetch, data }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [galleryData, setGalleryData] = useState<GallerySection | null>(data);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!data) {
      fetchData();
    } else {
      setGalleryData(data);
      setLoading(false);
    }
  }, [data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getProjectDetails(slug);
      setGalleryData(res.data.gallerysection || null);
    } catch (err) {
      console.error('Failed to load gallery section:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    fetchData();
    refetch();
  };

  const CDN_URL = process.env.NEXT_PUBLIC_STORAGE_DN_URL || 'https://dprstorage.b-cdn.net';

const resolveImageUrl = (path: string) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${CDN_URL}${path}`;
};

  const renderGalleryGrid = (title: string, grid?: GalleryGrid) => {
    const hasImages = grid && sectionOrder.some((key) => grid[key]?.length);

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 ,textAlign:'start'}}>{title}</Typography>
        {hasImages ? (
          <Grid container spacing={2}>
            {sectionOrder.map((key) =>
              (grid?.[key] || []).map((img, idx) => (
                <Grid item xs={12} sm={6} md={4} key={`${title}-${key}-${idx}`}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image= {resolveImageUrl(img)}
                      alt={`${title} ${key} - ${idx + 1}`}
                      sx={{ objectFit: 'cover' }}
                    />
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No {title.toLowerCase()} images available.
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={600}>Gallery Section</Typography>
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: 'primary.main' }}>
          <EditIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Content */}
      {loading ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : !galleryData ? (
        <Typography variant="body2" color="text.secondary">
          No gallery data found. Click the edit icon to add images.
        </Typography>
      ) : (
        <>
          {renderGalleryGrid('Interior', galleryData.interior)}
          {renderGalleryGrid('Exterior', galleryData.exterior)}
        </>
      )}

      {/* Drawer */}
      <GallerySectionDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        slug={slug}
        refetch={refetch}
        existingData={
    galleryData
      ? {
          interior: galleryData.interior || {},
          exterior: galleryData.exterior || {},
        }
      : undefined
  }
      />
    </Paper>
  );
};

export default GallerySectionComponent;

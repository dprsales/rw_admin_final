import React, { FC, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, FormControl, FormHelperText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import FileUploadContainer from '../../../Components/FileUploadContainer';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { gallerySection ,updateProjectSection} from '../../../api/services';

export interface GalleryGrid {
  c0r0?: string[];
  c0r1?: string[];
  c1r0?: string[];
  c2r0?: string[];
  c2r1?: string[];
}

export interface GallerySection {
  interior: GalleryGrid;
  exterior: GalleryGrid;
}

interface GallerySectionDrawerProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  refetch: () => void;
  existingData?: GallerySection | null;
}

const gridKeys = ['c0r0', 'c0r1', 'c1r0', 'c2r0', 'c2r1'] as const;

const GallerySectionDrawer: FC<GallerySectionDrawerProps> = ({ open, onClose, slug, refetch, existingData }) => {
  const { control, handleSubmit, reset } = useForm<GallerySection>({
    defaultValues: {
      interior: {},
      exterior: {}
    }
  });

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (formData: GallerySection) => updateProjectSection(slug, 'gallerysection', formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('project');
        toast.success('Gallery Section updated successfully');
        onClose();
        refetch();
      },
      onError: () => {
        toast.error('Failed to update Gallery Section');
      }
    }
  );

  const onSubmit = (data: GallerySection) => {
    mutation.mutate(data);
  };

  useEffect(() => {
    if (open && existingData) {
      reset(existingData);
    }
  }, [open, existingData, reset]);

const renderGridUploader = (
  label: string,
  section: 'interior' | 'exterior',
  key: keyof GalleryGrid
) => (
  <FormControl fullWidth sx={{ mb: 3 }}>
    <Typography fontWeight={600} mb={1}>{label}</Typography>
    <Controller
      name={`${section}.${key}` as const}
      control={control}
      render={({ field }) => {
        const images = field.value || [];
        return (
          <>
            <Box display="flex" flexWrap="wrap" justifyContent='center' gap={2}>
              {images.map((img: string, idx: number) => (
                <FileUploadContainer
                  key={idx}
                  existingImage={img}
                  onFileSelect={(url) => {
                    if (url) {
                      const newArr = [...images];
                      newArr[idx] = url;
                      field.onChange(newArr);
                    }
                  }}
                  onDelete={() => {
                    const newArr = [...images];
                    newArr.splice(idx, 1);
                    field.onChange(newArr);
                  }}
                  foldername="gallery"
                />
              ))}
            </Box>
            <Button
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={() => field.onChange([...(images || []), ''])}
            >
              Add Image
            </Button>
          </>
        );
      }}
    />
  </FormControl>
);


  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: '100%', maxWidth: '400px' } }}
    >
      {/* Header */}
      <Box sx={{
        height: '60px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', px: 2, bgcolor: 'primary.main'
      }}>
        <Typography color="white" fontWeight={600}>Edit Gallery Section</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Interior Section */}
          <Typography variant="h6" sx={{ mb: 2 }}>Interior</Typography>
          {gridKeys.map((key) => renderGridUploader(`Interior - ${key}`, 'interior', key))}

          {/* Exterior Section */}
          <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>Exterior</Typography>
          {gridKeys.map((key) => renderGridUploader(`Exterior - ${key}`, 'exterior', key))}

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            sx={{ mt: 3 }}
          >
            Save Gallery Section
          </Button>
        </form>
      </Box>
    </Drawer>
  );
};

export default GallerySectionDrawer;

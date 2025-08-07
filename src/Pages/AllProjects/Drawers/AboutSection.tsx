import React, { FC, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, FormControl, FormHelperText, InputLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import FileUploadContainer from '../../../Components/FileUploadContainer';
import CustomInput from '../../../Components/Inputs/CustomInput';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { aboutSection ,updateProjectSection} from '../../../api/services';

export interface AboutSection {
  des: string;
  images: {
    img: string;
    h1?: string;
  }[];
  highlights: {
    h1: string;
    d1: string;
  }[];
}


interface AboutSectionDrawerProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  refetch: () => void;
  existingData?: AboutSection | null;
}

const AboutSectionDrawer: FC<AboutSectionDrawerProps> = ({ open, onClose, slug, refetch, existingData }) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<AboutSection>({
    defaultValues: {
      des: '',
      images: [{ img: '', h1: '' }],
      highlights: [{ h1: '', d1: '' }],
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: 'images',
  });

  const { fields: highlightFields, append: appendHighlight, remove: removeHighlight } = useFieldArray({
    control,
    name: 'highlights',
  });

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (formData: AboutSection) => updateProjectSection(slug, 'aboutsection', formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('project');
        toast.success('About Section updated successfully');
        onClose();
        refetch();
      },
      onError: () => {
        toast.error('Failed to update About Section');
      }
    }
  );

   useEffect(() => {
      if (open && existingData) {
        reset(existingData);
      }
    }, [open, existingData, reset]);

  const onSubmit = (data: AboutSection) => {
    mutation.mutate(data);
  };



  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: '100%', maxWidth: '500px', backgroundColor: '#fff' } }}
    >
      <Box sx={{
        height: '60px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', px: 2, bgcolor: 'primary.main'
      }}>
        <Typography variant="body1" color="white" fontWeight={600}>Edit About Section</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>

          {/* Description */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink>Description</InputLabel>
            <Controller
              name="des"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field }) => (
                <CustomInput placeholder="Enter description..." {...field} />
              )}
            />
            <FormHelperText error={!!errors.des}>{errors.des?.message}</FormHelperText>
          </FormControl>

          {/* Images */}
          <Typography variant="h6" sx={{ mb: 1 }}>Images</Typography>
          {imageFields.map((item, index) => (
            <Box key={item.id} sx={{ mb: 2, border: '1px solid #ccc', p: 2, borderRadius: 1 }}>
              <Typography fontWeight={500}>Image {index + 1}</Typography>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <Controller
                  name={`images.${index}.img`}
                  control={control}
                  rules={{ required: 'Image is required' }}
                  render={({ field }) => (
                    <FileUploadContainer
                      onFileSelect={(url) => field.onChange(url)}
                      onDelete={() => field.onChange('')}
                      foldername="aboutImages"
                      existingImage={field.value}
                    />
                  )}
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <Controller
                  name={`images.${index}.h1`}
                  control={control}
                  render={({ field }) => (
                    <CustomInput placeholder="Enter image heading (optional)" {...field} />
                  )}
                />
              </FormControl>
              <Button variant="outlined" color="error" onClick={() => removeImage(index)} fullWidth>
                Remove Image
              </Button>
            </Box>
          ))}
          <Button onClick={() => appendImage({ img: '', h1: '' })} fullWidth sx={{ mb: 2 }}>
            Add Image
          </Button>

          {/* Highlights */}
          <Typography variant="h6" sx={{ mb: 1 }}>Highlights</Typography>
          {highlightFields.map((item, index) => (
            <Box key={item.id} sx={{ mb: 2, border: '1px solid #ccc', p: 2, borderRadius: 1 }}>
              <Typography fontWeight={500}>Highlight {index + 1}</Typography>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <Controller
                  name={`highlights.${index}.h1`}
                  control={control}
                  rules={{ required: 'Title is required' }}
                  render={({ field }) => (
                    <CustomInput placeholder="Enter highlight title" {...field} />
                  )}
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <Controller
                  name={`highlights.${index}.d1`}
                  control={control}
                  rules={{ required: 'Description is required' }}
                  render={({ field }) => (
                    <CustomInput placeholder="Enter highlight description" {...field} />
                  )}
                />
              </FormControl>
              <Button variant="outlined" color="error" onClick={() => removeHighlight(index)} fullWidth>
                Remove Highlight
              </Button>
            </Box>
          ))}
          <Button onClick={() => appendHighlight({ h1: '', d1: '' })} fullWidth sx={{ mb: 2 }}>
            Add Highlight
          </Button>
          <Box>

            {/* Submit */}
            <Button variant="contained" color="primary" type="submit" fullWidth>
              Save About Section
            </Button>
          </Box>

        </form>
      </Box>
    </Drawer>
  );
};

export default AboutSectionDrawer;

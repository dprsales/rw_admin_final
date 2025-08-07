import React, { FC, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, FormControl, FormHelperText, InputLabel, MenuItem, Select
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import FileUploadContainer from '../../../Components/FileUploadContainer';
import CustomInput from '../../../Components/Inputs/CustomInput';
import { HeroSection } from '../ProjectInterface';
import { heroSection, updateProjectSection } from '../../../api/services';

interface HeroSectionDrawerProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  refetch: () => void;
  existingData?: HeroSection | null;
}

const HeroSectionDrawer: FC<HeroSectionDrawerProps> = ({
  open,
  onClose,
  slug,
  refetch,
  existingData
}) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<HeroSection>({
    defaultValues: {
      backgroundimage: '',
      projectimage: '',
      projectlogo: '',
      h1: '',
      h2: '',
      h3: '',
      rera: '',
      loc: '',
      alig: 'left',
    }
  });



  const queryClient = useQueryClient();

const mutation = useMutation(
  (formData: HeroSection) => updateProjectSection(slug, 'herosection', formData),
  {
    onSuccess: () => {
      queryClient.invalidateQueries('project');
      toast.success('Hero section updated successfully');
      onClose();
      refetch();
    },
    onError: (err: any) => {
      toast.error('Failed to update hero section');
      console.error("Update error:", err?.response?.data || err);
    }
  }
);

  useEffect(() => {
    if (open && existingData) {
      reset(existingData);
    }
  }, [open, existingData, reset]);

  const onSubmit = (data: HeroSection) => mutation.mutate(data);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: '100%', maxWidth: 400 } }}
    >
      <Box sx={{
        height: '60px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', px: 2, bgcolor: 'primary.main'
      }}>
        <Typography color="white" fontWeight={600}>Edit Hero Section</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Text Fields */}
          {['h1', 'h2', 'h3', 'rera', 'loc'].map((fieldName) => (
            <FormControl fullWidth sx={{ mb: 2 }} key={fieldName}>
              <InputLabel shrink>{fieldName.toUpperCase()}</InputLabel>
              <Controller
                name={fieldName as keyof HeroSection}
                control={control}
                rules={{ required: `${fieldName.toUpperCase()} is required` }}
                render={({ field }) => (
                  <CustomInput placeholder={`Enter ${fieldName.toUpperCase()}...`} {...field} />
                )}
              />
              <FormHelperText error={!!errors[fieldName as keyof HeroSection]}>
                {errors[fieldName as keyof HeroSection]?.message}
              </FormHelperText>
            </FormControl>
          ))}

          {/* Image Uploads */}
          {[
            { name: 'backgroundimage', label: 'Background Image' },
            { name: 'projectimage', label: 'Project Image' },
            { name: 'projectlogo', label: 'Project Logo' }
          ].map(({ name, label }) => (
            <FormControl fullWidth sx={{ mb: 3 }} key={name}>
              <Typography fontWeight={600} mb={1}>{label}</Typography>
              <Controller
                name={name as keyof HeroSection}
                control={control}
                rules={{ required: `${label} is required` }}
                render={({ field }) => (
                  <FileUploadContainer
                    foldername="hero"
                    existingImage={field.value}
                    onFileSelect={(url) => field.onChange(url)}
                    onDelete={() => field.onChange('')}
                  />
                )}
              />
              <FormHelperText error={!!errors[name as keyof HeroSection]}>
                {errors[name as keyof HeroSection]?.message}
              </FormHelperText>
            </FormControl>
          ))}

          {/* Alignment Select */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="alig-label">Text Alignment</InputLabel>
            <Controller
              name="alig"
              control={control}
              render={({ field }) => (
                <Select labelId="alig-label" label="Text Alignment" {...field}>
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                </Select>
              )}
            />
          </FormControl>

          {/* Submit */}
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Save
          </Button>
        </form>
      </Box>
    </Drawer>
  );
};

export default HeroSectionDrawer;

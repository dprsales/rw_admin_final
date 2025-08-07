import React, { FC, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, FormControl, FormHelperText, InputLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import FileUploadContainer from '../../../Components/FileUploadContainer';
import CustomInput from '../../../Components/Inputs/CustomInput';
import { layoutSection,updateProjectSection } from '../../../api/services';

export interface Layout {
  d1: string;
  img: string;
  highlights: { value: string }[];
}
interface LayoutPayload {
  d1: string;
  img: string;
  highlights: string[];
}
interface LayoutDrawerProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  refetch: () => void;
  existingData?: Layout | null;
}

const LayoutDrawer: FC<LayoutDrawerProps> = ({ open, onClose, slug, refetch, existingData }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Layout>({
    defaultValues: {
      d1: '',
      img: '',
      highlights: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'highlights',
  });

  const queryClient = useQueryClient();

  // const mutation = useMutation(
  //   (formData: Layout) => {
  //     const formatted = {
  //       ...formData,
  //       highlights: formData.highlights.map(h => h.value),
  //     };
  //     return layoutSection(slug, formatted);
  //   },
  //   {
  //     onSuccess: () => {
  //       queryClient.invalidateQueries('project');
  //       toast.success('Layout updated successfully');
  //       onClose();
  //       refetch();
  //     },
  //     onError: () => {
  //       toast.error('Failed to update Layout');
  //     },
  //   }
  // );

  // const onSubmit = (data: Layout) => {
  //   mutation.mutate(data);
  // };

const mutation = useMutation(
  (formData: LayoutPayload) => updateProjectSection(slug, 'layout', formData),
  {
    onSuccess: () => {
      queryClient.invalidateQueries('project');
      toast.success('Layout Section updated successfully');
      onClose();
      refetch();
    },
    onError: () => {
      toast.error('Failed to update Layout Section');
    },
  }
);

// onSubmit
const onSubmit = (data: Layout) => {
  const formattedData: LayoutPayload = {
    d1: data.d1,
    img: data.img,
    highlights: data.highlights.map((h) => h.value),
  };

  mutation.mutate(formattedData);
};

useEffect(() => {
  if (open && existingData) {
    const highlightsArray = Array.isArray(existingData.highlights)
      ? existingData.highlights.map((val) =>
          typeof val === 'string' ? { value: val } : val
        )
      : [];

    reset({
      ...existingData,
      highlights: highlightsArray,
    });
  }
}, [open, existingData, reset]);


  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: '100%', maxWidth: '400px' } }}
    >
      <Box
        sx={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          bgcolor: 'primary.main',
        }}
      >
        <Typography color="white" fontWeight={600}>Edit Layout Section</Typography>
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
              name="d1"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field }) => (
                <CustomInput placeholder="Enter layout description..." {...field} />
              )}
            />
            <FormHelperText error={!!errors.d1}>{errors.d1?.message}</FormHelperText>
          </FormControl>

          {/* Layout Image */}
          <FormControl fullWidth sx={{ mb: 3 ,textAlign:'center',display:'flex',justifyContent:'center'}}>
            <Typography variant='h6' mb={1} sx={{textAlign:'start'}}>Layout Image</Typography>
            <Controller
              name="img"
              control={control}
              rules={{ required: 'Image is required' }}
              render={({ field }) => (
                <FileUploadContainer
                  existingImage={field.value}
                  onFileSelect={(url) => url && field.onChange(url)}
                  onDelete={() => field.onChange('')}
                  foldername="layout"
                />
              )}
            />
            <FormHelperText error={!!errors.img}>{errors.img?.message}</FormHelperText>
          </FormControl>

          {/* Highlights */}
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Highlights</Typography>
          {fields.map((item, index) => (
            <Box key={item.id} sx={{ mb: 2 }}>
              <FormControl fullWidth>
                <Controller
                  name={`highlights.${index}.value`}
                  control={control}
                  rules={{ required: 'Highlight is required' }}
                  render={({ field }) => (
                    <CustomInput placeholder={`Highlight ${index + 1}`} {...field} />
                  )}
                />
              </FormControl>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                sx={{ mt: 1 }}
                onClick={() => remove(index)}
              >
                Remove
              </Button>
            </Box>
          ))}
          <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => append({ value: '' })}>
            Add Highlight
          </Button>

          <Box>
          {/* Submit */}
          <Button variant="contained" color="primary" type="submit" fullWidth sx={{ mt: 3 }}>
            Save Layout Section
          </Button>

          </Box>
        </form>
      </Box>
    </Drawer>
  );
};

export default LayoutDrawer;

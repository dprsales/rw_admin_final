import React, { FC, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, FormControl, Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import FileUploadContainer from '../../../Components/FileUploadContainer';
import CustomInput from '../../../Components/Inputs/CustomInput';
import { ConnectedLiving } from '../ProjectInterface';
import { getConnectedLiving, updateProjectSection } from '../../../api/services';

interface Props {
  open: boolean;
  onClose: () => void;
  slug: string;
  refetch: () => void;
  existingData?: ConnectedLiving | null;
}

const ConnectedLivingDrawer: FC<Props> = ({ open, onClose, slug, refetch, existingData }) => {
  const { control, handleSubmit, reset, watch } = useForm<ConnectedLiving>({
    defaultValues: {
      locationimage: '',
      data: [],
    }
  });

  const queryClient = useQueryClient();

  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control,
    name: 'data'
  });

  const mutation = useMutation(
    (formData: ConnectedLiving) => updateProjectSection(slug, 'connectedliving', formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('project');
        toast.success('Connected Living updated');
        onClose();
        refetch();
      },
      onError: () => {
        toast.error('Failed to update Connected Living');
      }
    }
  );

  useEffect(() => {
    if (open && existingData) {
      reset(existingData);
    }
  }, [open, existingData, reset]);

  // Fix: Ensure all time fields are numbers before submit
  const onSubmit = (data: ConnectedLiving) => {
    const fixedData: ConnectedLiving = {
      ...data,
      data: (data.data || []).map(group => ({
        ...group,
        data: (group.data || []).map(loc => ({
          ...loc,
          time: typeof loc.time === 'string' ? Number(loc.time) : loc.time
        }))
      }))
    };
    mutation.mutate(fixedData);
  };

  const groups = watch('data');

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 400 } }}>
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography color="white" fontWeight={600}>Edit Connected Living</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
      </Box>

      <Box sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Location Image */}
          <Typography fontWeight={600} mb={1}>Location Image</Typography>
          <Controller
            name="locationimage"
            control={control}
            render={({ field }) => (
              <FileUploadContainer
                foldername="connectedliving"
                existingImage={field.value}
                onFileSelect={(url) => field.onChange(url)}
                onDelete={() => field.onChange('')}
              />
            )}
          />

          {/* Location Groups */}
          <Typography variant="h6" mt={3} mb={2}>Location Groups</Typography>
          {groupFields.map((group, groupIdx) => (
            <Box key={group.id} sx={{ border: '1px solid #ccc', p: 2, mb: 3, borderRadius: 2 }}>
              {/* Group Title */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Typography fontWeight={600}>Group Title</Typography>
                <Controller
                  name={`data.${groupIdx}.type`}
                  control={control}
                  render={({ field }) => (
                    <CustomInput placeholder="e.g. Hospitals, IT Hubs" {...field} />
                  )}
                />
              </FormControl>

              {/* Locations */}
              <Typography fontWeight={600} mb={1}>Locations</Typography>
              {(groups?.[groupIdx]?.data || []).map((_, locIdx) => (
                <Box key={locIdx} sx={{ mb: 2 }}>
                  <FormControl fullWidth sx={{ mb: 1 }}>
                    <Controller
                      name={`data.${groupIdx}.data.${locIdx}.h1`}
                      control={control}
                      render={({ field }) => (
                        <CustomInput placeholder="Location name" {...field} />
                      )}
                    />
                  </FormControl>
                  <FormControl fullWidth>
                    <Controller
                      name={`data.${groupIdx}.data.${locIdx}.time`}
                      control={control}
                      render={({ field }) => (
                        <CustomInput type="number" placeholder="Time (mins)" {...field} />
                      )}
                    />
                  </FormControl>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    sx={{ mt: 1 }}
                    onClick={() => {
                      const newData = [...groups];
                      newData[groupIdx].data.splice(locIdx, 1);
                      reset({ ...watch(), data: newData });
                    }}
                  >
                    Remove Location
                  </Button>
                </Box>
              ))}

              <Button
                variant="outlined"
                onClick={() => {
                  const newData = [...groups];
                  newData[groupIdx].data = [...(newData[groupIdx].data || []), { h1: '', time: 0 }];
                  reset({ ...watch(), data: newData });
                }}
                fullWidth
              >
                Add Location
              </Button>
                <Box>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={() => removeGroup(groupIdx)}
                    fullWidth
                    sx={{ mt: 2 }}
                >
                    Remove Group
                </Button>
                    
                </Box>
            </Box>
          ))}

          <Button
            variant="outlined"
            onClick={() => appendGroup({ type: '', data: [] })}
            fullWidth
          >
            Add Group
          </Button>
          <Box>
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }}>
                Save
            </Button>
          </Box>
        </form>
      </Box>
    </Drawer>
  );
};

export default ConnectedLivingDrawer;

import React, { FC, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, FormControl, FormHelperText, Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import FileUploadContainer from '../../../Components/FileUploadContainer';
import CustomInput from '../../../Components/Inputs/CustomInput';
import { floorPlans, updateProjectSection } from '../../../api/services';
import { FloorPlans } from '../ProjectInterface';


interface FloorPlansDrawerProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  refetch: () => void;
  existingData?: FloorPlans | null;
}

const FloorPlansDrawer: FC<FloorPlansDrawerProps> = ({
  open,
  onClose,
  slug,
  refetch,
  existingData
}) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FloorPlans>({
    defaultValues: {
      layoutimage: '',
      data: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'data',
  });

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (formData: FloorPlans) => updateProjectSection(slug, 'floorplans', formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('project');
        toast.success('Floor plans updated');
        onClose();
        refetch();
      },
      onError: () => {
        toast.error('Failed to update floor plans');
      }
    }
  );

  // const onSubmit = (data: FloorPlans) => {
  //   mutation.mutate(data);
  // };

  // useEffect(() => {
  //   if (open && existingData) {
  //     reset(existingData);
  //   }
  // }, [open, existingData, reset]);

  const onSubmit = (data: FloorPlans) => {
  const cleaned: FloorPlans = {
    layoutimage: data.layoutimage,
    data: data.data.map(d => ({
      ...d,
      bhk: Number(d.bhk), // ✅ convert to number
      sft: Number(d.sft), // ✅ convert to number
    })),
  };
  mutation.mutate(cleaned);
};
  const onSubmitError = () => {
    toast.error('Please fill all required fields');
  };

  useEffect(() => {
  if (open && existingData) {
    const patched = {
      ...existingData,
      data: existingData.data.map(d => ({
        ...d,
        sft: d.sft ?? 0, // ✅ default if missing
      }))
    };
    reset(patched);
  }
}, [open, existingData, reset]);


  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: '100%', maxWidth: 400 } }}
    >
      {/* Header */}
      <Box sx={{ height: 60, px: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography color="white" fontWeight={600}>Edit Floor Plans</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3 }}>
       <form onSubmit={handleSubmit(onSubmit, onSubmitError)}>

          {/* Layout Image */}
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Master Layout Image</Typography>
          <Controller
            name="layoutimage"
            control={control}
            rules={{ required: 'Layout image is required' }}
            render={({ field }) => (
              <FileUploadContainer
                foldername="floorplans"
                existingImage={field.value}
                onFileSelect={url => url && field.onChange(url)}
                onDelete={() => field.onChange('')}
              />
            )}
          />
          <FormHelperText error={!!errors.layoutimage}>
            {errors.layoutimage?.message}
          </FormHelperText>

          {/* Floor Plan Entries */}
          <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Floor Plan Entries</Typography>
          {fields.map((item, index) => (
            <Box key={item.id} sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name={`data.${index}.gid`}
                    control={control}
                    rules={{ required: 'gid is required' }}
                    render={({ field }) => (
                      <CustomInput {...field} placeholder="gid name" />
                    )}
                  />
                  <FormHelperText error={!!errors?.data?.[index]?.gid}>
                    {errors?.data?.[index]?.gid?.message}
                  </FormHelperText>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name={`data.${index}.tower`}
                    control={control}
                    rules={{ required: 'Tower is required' }}
                    render={({ field }) => (
                      <CustomInput {...field} placeholder="Tower name" />
                    )}
                  />
                   <FormHelperText error={!!errors?.data?.[index]?.tower}>
                    {errors?.data?.[index]?.tower?.message}
                  </FormHelperText>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name={`data.${index}.bhk`}
                    control={control}
                    rules={{ required: 'BHK is required' }}
                    render={({ field }) => (
                      <CustomInput {...field} type="number" placeholder="BHK" />
                    )}
                  />
                   <FormHelperText error={!!errors?.data?.[index]?.bhk}>
                    {errors?.data?.[index]?.bhk?.message}
                  </FormHelperText>
                </Grid>
                    {/* //sft */}
                <Grid item xs={12} sm={6}>
                  <Controller
                    name={`data.${index}.sft`}
                    control={control}
                    rules={{ required: 'sft is required' }}
                    render={({ field }) => (
                      <CustomInput {...field} type="number" placeholder="sqft" />
                    )}
                  />
                   <FormHelperText error={!!errors?.data?.[index]?.sft}>
                    {errors?.data?.[index]?.sft?.message}
                  </FormHelperText>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name={`data.${index}.facing`}
                    control={control}
                    rules={{ required: 'Facing is required' }}
                    render={({ field }) => (
                      <CustomInput {...field} placeholder="Facing (e.g. East)" />
                    )}
                  />
                   <FormHelperText error={!!errors?.data?.[index]?.facing}>
                    {errors?.data?.[index]?.facing?.message}
                  </FormHelperText>
                </Grid>

                {/* Floorplan Image */}
                <Grid item xs={12}>
                  <Typography fontWeight={500} mb={1}>Floorplan Image</Typography>
                  <Controller
                    name={`data.${index}.floorplanimage`}
                    control={control}
                    render={({ field }) => (
                      <FileUploadContainer
                        foldername="floorplans"
                        existingImage={field.value}
                        onFileSelect={url => field.onChange(url)}
                        onDelete={() => field.onChange('')}
                      />
                    )}
                  />
                </Grid>

                {/* Table Image */}
                <Grid item xs={12}>
                  <Typography fontWeight={500} mb={1}>Table Image</Typography>
                  <Controller
                    name={`data.${index}.tableimage`}
                    control={control}
                    render={({ field }) => (
                      <FileUploadContainer
                        foldername="floorplans"
                        existingImage={field.value}
                        onFileSelect={url => field.onChange(url)}
                        onDelete={() => field.onChange('')}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Button
                color="error"
                variant="outlined"
                sx={{ mt: 2 }}
                fullWidth
                onClick={() => remove(index)}
              >
                Remove Entry
              </Button>
            </Box>
          ))}
          <Box>


          <Button
            onClick={() => append({
              gid: '',
              tower: '',
              bhk: 0,
              facing: '',
              sft:0,
              floorplanimage: '',
              tableimage: ''
            })}
            sx={{ mb: 3 }}
            variant="outlined"
            fullWidth
          >
            Add Floor Plan
          </Button>
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            Save Floor Plans
          </Button>
        </form>
      </Box>
    </Drawer>
  );
};

export default FloorPlansDrawer;

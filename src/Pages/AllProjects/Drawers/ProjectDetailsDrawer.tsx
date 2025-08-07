import React, { FC } from 'react';
import {
  Drawer, Box, Typography, Button, IconButton, FormControl, InputLabel, FormHelperText, MenuItem, Select, Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import CustomInput from '../../../Components/Inputs/CustomInput';
import { ProjectDetails } from '../ProjectInterface';

interface ProjectDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  initialData: ProjectDetails;
  onSubmit: (data: ProjectDetails) => void;

}

const zoneOptions = ['east', 'west', 'north', 'south'];
const propertyTypeOptions = ['Apartments', 'Villas'];

const ProjectDetailsDrawer: FC<ProjectDetailsDrawerProps> = ({ open, onClose, initialData, onSubmit }) => {
 const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<any>({
    defaultValues: {
      ...initialData,
  highlights: {
    items: initialData.highlights?.items?.map((item: string) => ({ value: item })) || []
  }
    }
  });


  const { fields, append, remove } = useFieldArray({
    control,
    name: 'highlights.items'
  });

  const onSubmitHandler = (data: any) => {
    const finalData: ProjectDetails = {
      ...data,
      bhk: data.bhk,
      sqft: data.sqft,
      highlights: {
        items: data.highlights.items.map((item: { value: string }) => item.value)
      },
      bankOffers: data.bankOffers
    };
    onSubmit(finalData);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{
        width: '100%',
        height: '60px',
        backgroundColor: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 550 }}>
          Edit Project Details
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white', marginRight: 3 }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ padding: '20px' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            {/* Title */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Title</InputLabel>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: 'Title is required' }}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter title..."
                      {...field}
                      error={!!errors.title}
                    />
                  )}
                />
                <FormHelperText error={!!errors.title}>{typeof errors.title?.message === 'string' ? errors.title?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Description */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Description</InputLabel>
                <Controller
                  name="description"
                  control={control}
                  rules={{ required: 'Description is required' }}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter description..."
                      multiline
                      rows={3}
                      {...field}
                      error={!!errors.description}
                    />
                  )}
                />
                <FormHelperText error={!!errors.description}>{typeof errors.description?.message === 'string' ? errors.description?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* BHK */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>BHK (comma separated)</InputLabel>
                <Controller
                  name="bhk"
                  control={control}
                  rules={{ required: 'BHK is required' }}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="e.g. 2,3,4"
                      {...field}
                      error={!!errors.bhk}
                      onChange={e => field.onChange(e.target.value.split(',').map((v: string) => Number(v.trim())))}
                      value={Array.isArray(field.value) ? field.value.join(',') : ''}
                    />
                  )}
                />
                <FormHelperText error={!!errors.bhk}>{typeof errors.bhk?.message === 'string' ? errors.bhk?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Sqft */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Sqft (comma separated)</InputLabel>
                <Controller
                  name="sqft"
                  control={control}
                  rules={{ required: 'Sqft is required' }}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="e.g. 1000,1200"
                      {...field}
                      error={!!errors.sqft}
                      onChange={e => field.onChange(e.target.value.split(',').map((v: string) => Number(v.trim())))}
                      value={Array.isArray(field.value) ? field.value.join(',') : ''}
                    />
                  )}
                />
                <FormHelperText error={!!errors.sqft}>{typeof errors.sqft?.message === 'string' ? errors.sqft?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>

            {/* slug */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Slug</InputLabel>
                <Controller
                  name="slug"
                  control={control}
                  rules={{ required: 'Title is required' }}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter title..."
                      {...field}
                      error={!!errors.title}
                    />
                  )}
                />
                <FormHelperText error={!!errors.slug}>{typeof errors.slug?.message === 'string' ? errors.slug?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Visits */}
            <Grid item xs={6}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Visits</InputLabel>
                <Controller
                  name="visits"
                  control={control}
                  rules={{ required: 'Visits is required' }}
                  render={({ field }) => (
                    <CustomInput
                      type="number"
                      placeholder="Enter visits..."
                      {...field}
                      error={!!errors.visits}
                    />
                  )}
                />
                <FormHelperText error={!!errors.visits}>{typeof errors.visits?.message === 'string' ? errors.visits?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Leads */}
            <Grid item xs={6}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Leads</InputLabel>
                <Controller
                  name="leads"
                  control={control}
                  rules={{ required: 'Leads is required' }}
                  render={({ field }) => (
                    <CustomInput
                      type="number"
                      placeholder="Enter leads..."
                      {...field}
                      error={!!errors.leads}
                    />
                  )}
                />
                <FormHelperText error={!!errors.leads}>{typeof errors.leads?.message === 'string' ? errors.leads?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* SFT Price */}
            <Grid item xs={6}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>SFT Price</InputLabel>
                <Controller
                  name="sftPrice"
                  control={control}
                  rules={{ required: 'SFT Price is required' }}
                  render={({ field }) => (
                    <CustomInput
                      type="number"
                      placeholder="Enter SFT Price..."
                      {...field}
                      error={!!errors.sftPrice}
                    />
                  )}
                />
                <FormHelperText error={!!errors.sftPrice}>{typeof errors.sftPrice?.message === 'string' ? errors.sftPrice?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Launch Date */}
            <Grid item xs={6}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Launch Date</InputLabel>
                <Controller
                  name="launchdate"
                  control={control}
                  rules={{ required: 'Launch Date is required' }}
                  render={({ field }) => (
                    <CustomInput
                      type="number"
                      placeholder="Enter launch year..."
                      {...field}
                      error={!!errors.launchdate}
                    />
                  )}
                />
                <FormHelperText error={!!errors.launchdate}>{typeof errors.launchdate?.message === 'string' ? errors.launchdate?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Zone */}
            <Grid item xs={6}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Zone</InputLabel>
                <Controller
                  name="zone"
                  control={control}
                  rules={{ required: 'Zone is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Zone"
                      error={!!errors.zone}
                      value={field.value || ''}
                    >
                      {zoneOptions.map((z) => (
                        <MenuItem key={z} value={z}>{z}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <FormHelperText error={!!errors.zone}>{typeof errors.zone?.message === 'string' ? errors.zone?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Towers */}
            <Grid item xs={6}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Towers</InputLabel>
                <Controller
                  name="towers"
                  control={control}
                  rules={{ required: 'Towers is required' }}
                  render={({ field }) => (
                    <CustomInput
                      type="number"
                      placeholder="Enter towers..."
                      {...field}
                      error={!!errors.towers}
                    />
                  )}
                />
                <FormHelperText error={!!errors.towers}>{typeof errors.towers?.message === 'string' ? errors.towers?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Parking Area */}
            <Grid item xs={6}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Parking Area</InputLabel>
                <Controller
                  name="parkingarea"
                  control={control}
                  rules={{ required: 'Parking Area is required' }}
                  render={({ field }) => (
                    <CustomInput
                      type="number"
                      placeholder="Enter parking area..."
                      {...field}
                      error={!!errors.parkingarea}
                    />
                  )}
                />
                <FormHelperText error={!!errors.parkingarea}>{typeof errors.parkingarea?.message === 'string' ? errors.parkingarea?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Property Type */}
            <Grid item xs={6}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Property Type</InputLabel>
                <Controller
                  name="propertyType"
                  control={control}
                  rules={{ required: 'Property Type is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Property Type"
                      error={!!errors.propertyType}
                      value={field.value || ''}
                    >
                      {propertyTypeOptions.map((z) => (
                        <MenuItem key={z} value={z}>{z}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <FormHelperText error={!!errors.propertyType}>{typeof errors.propertyType?.message === 'string' ? errors.propertyType?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Street */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Street</InputLabel>
                <Controller
                  name="street"
                  control={control}
                  rules={{ required: 'Street is required' }}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter street..."
                      {...field}
                      error={!!errors.street}
                    />
                  )}
                />
                <FormHelperText error={!!errors.street}>{typeof errors.street?.message === 'string' ? errors.street?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Location */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Location</InputLabel>
                <Controller
                  name="location"
                  control={control}
                  rules={{ required: 'Location is required' }}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter location..."
                      {...field}
                      error={!!errors.location}
                    />
                  )}
                />
                <FormHelperText error={!!errors.location}>{typeof errors.location?.message === 'string' ? errors.location?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            {/* Location Iframe */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Location Iframe</InputLabel>
                <Controller
                  name="locationiframe"
                  control={control}
                  rules={{ required: 'Location iframe is required' }}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter location iframe..."
                      {...field}
                      error={!!errors.locationiframe}
                    />
                  )}
                />
                <FormHelperText error={!!errors.locationiframe}>{typeof errors.locationiframe?.message === 'string' ? errors.locationiframe?.message : ''}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}></Grid>

            {/* Bank Offers */}
            {/* <Grid item xs={12}>
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel shrink>Bank Offers (comma separated names)</InputLabel>
                <Controller
                  name="bankOffers"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="e.g. HDFC,ICICI"
                      {...field}
                      onChange={e => field.onChange(e.target.value.split(',').map((v: string) => ({ bankName: v.trim(), bankIcon: '' })))}
                      value={Array.isArray(field.value) ? field.value.map((b: any) => b.bankName).join(',') : ''}
                    />
                  )}
                />
              </FormControl>
            </Grid> */}

            {/* Highlights */}
            {/* <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Highlights</Typography>
              {fields.map((item, index) => (
                <Box key={item.id} sx={{ mb: 2 }}>
                  <FormControl fullWidth>
                    <Controller
                      name={`highlights.items.${index}.value`}
                      control={control}
                      rules={{ required: 'Highlight is required' }}
                      render={({ field }) => (
                        <CustomInput
                          placeholder={`Highlight ${index + 1}`}
                          {...field}
                        />
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
              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => append({ value: '' })}
              >
                Add Highlight
              </Button>
            </Grid> */}


          </Grid>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            sx={{ marginTop: 2 }}
          >
            Save
          </Button>
        </form>
      </Box>
    </Drawer>
  );
};

export default ProjectDetailsDrawer;

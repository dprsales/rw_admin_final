import { FC } from 'react';
import {
  Drawer, Box, Typography, Button, IconButton, FormControl, InputLabel, FormHelperText,
  MenuItem,
  Select,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import CustomInput from '../../../Components/Inputs/CustomInput';
import FileUploadContainer from '../../../Components/FileUploadContainer';
import { toast } from 'react-toastify';
import { addProject } from '../../../api/services';
import { ArrowDropDown } from '@mui/icons-material';

interface AddProjectProps {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  title: string;
  description: string;
  bhk: number[];
  sqft: number[];
  visits: number;
  leads: number;
  slug: string;
  launchdate: number;
  sftPrice: number;
  location: string;
  zone: string;
  street: string;
  towers: number;
  locationiframe: string;
  parkingarea: number;
  propertyType: string;
  bankOffers: {
    bankIcon: string;
    bankName: string;
  }[];
  highlights: {
    items: { value: string }[]; // 💡 Each highlight is an object with a value key
  };
}
const PROPERTY_TYPES = [
  'Apartments',
  'Villas',
];

const AddProject: FC<AddProjectProps> = ({ open, onClose }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      bhk: [],
      sqft: [],
      visits: 0,
      leads: 0,
      slug: '',
      launchdate: 0,
      sftPrice: 0,
      location: '',
      zone: '',
      street: '',
      towers: 0,
      locationiframe: '',
      parkingarea: 0,
      propertyType: '',
      bankOffers: [],
    }
  });
  const {
    fields: highlightFields,
    append: appendHighlight,
    remove: removeHighlight
  } = useFieldArray({
    control,
    name: 'highlights.items',
  });

  const queryClient = useQueryClient();

  const mutation = useMutation(addProject, {
    onSuccess: () => {
      queryClient.invalidateQueries('getProjects');
      toast.success('Project added successfully');
      onClose();
    },
    onError: () => {
      toast.error('Error adding project');
    }
  });

  const { fields: bankFields, append, remove } = useFieldArray({
    control,
    name: 'bankOffers'
  });

  const onSubmit = (data: FormValues) => {
    // Ensure all numeric fields are numbers and not empty strings or NaN
    const parsedData = {
      ...data,
      visits: Number(data.visits) || 0,
      leads: Number(data.leads) || 0,
      launchdate: Number(data.launchdate) || 0,
      sftPrice: Number(data.sftPrice) || 0,
      towers: Number(data.towers) || 0,
      parkingarea: Number(data.parkingarea) || 0,
      propertyType: data.propertyType || '', // Ensure not undefined
      highlights: {
        items: data.highlights.items.map(h => h.value.trim()).filter(Boolean),
      },
    };

    // Optionally, you can validate propertyType here if you have a set of allowed values

    mutation.mutate({ projectdetails: parsedData });
  };

  const handleSubmitWithValidation = async (data: FormValues) => {
    let hasError = false;
    if (!data.title) {
      toast.error('Project Name is required');
      hasError = true;
    }
    if (!data.location) {
      toast.error('Location is required');
      hasError = true;
    }
    if (!data.sftPrice) {
      toast.error('SFT Price is required');
      hasError = true;
    }
    if (!data.bhk || data.bhk.length === 0) {
      toast.error('At least one BHK is required');
      hasError = true;
    }
    if (!data.sqft || data.sqft.length === 0) {
      toast.error('At least one Sqft is required');
      hasError = true;
    }
    if (!data.bankOffers || data.bankOffers.length === 0) {
      toast.error('At least one Bank Offer is required');
      hasError = true;
    }
    if (hasError) return;

    onSubmit(data);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '360px',
          backgroundColor: '#FFFFFF',
          borderRadius: '0px',
          border: 'none',
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
        <Typography variant="body1" sx={{ color: '#fff', fontWeight: '550' }}>
          Add Project
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white', mr: 2 }}>
          <CloseIcon sx={{ color: "white" }} />
        </IconButton>
      </Box>
      <Box sx={{ p: 2 }}>
        <form onSubmit={handleSubmit(handleSubmitWithValidation)}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-title-input">Title</InputLabel>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-title-input" placeholder="Enter Title..." {...field} />
              )}
            />
            <FormHelperText>{errors.title?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-description-input">Description</InputLabel>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-description-input" placeholder="Enter Description..." multiline rows={3} {...field} />
              )}
            />
            <FormHelperText>{errors.description?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-bhk-input">BHK (comma separated)</InputLabel>
            <Controller
              name="bhk"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-bhk-input" placeholder="e.g. 3,4,5" {...field} onChange={e => field.onChange(e.target.value.split(',').map((v: string) => Number(v.trim())))} />
              )}
            />
            <FormHelperText>{errors.bhk?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-sqft-input">Sqft (comma separated)</InputLabel>
            <Controller
              name="sqft"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-sqft-input" placeholder="e.g. 1000,1200" {...field} onChange={e => field.onChange(e.target.value.split(',').map((v: string) => Number(v.trim())))} />
              )}
            />
            <FormHelperText>{errors.sqft?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-visits-input">Visits</InputLabel>
            <Controller
              name="visits"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-visits-input" placeholder="Enter number of visits" type="number" {...field} />
              )}
            />
            <FormHelperText>{errors.visits?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-leads-input">Leads</InputLabel>
            <Controller
              name="leads"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-leads-input" placeholder="Enter number of leads" type="number" {...field} />
              )}
            />
            <FormHelperText>{errors.leads?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-slug-input">Slug</InputLabel>
            <Controller
              name="slug"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-slug-input" placeholder="Enter slug" {...field} />
              )}
            />
            <FormHelperText>{errors.slug?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-launchdate-input">Launch Date (YYYYMMDD)</InputLabel>
            <Controller
              name="launchdate"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-launchdate-input" placeholder="Enter launch date" type="number" {...field} />
              )}
            />
            <FormHelperText>{errors.launchdate?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-sftPrice-input">SFT Price</InputLabel>
            <Controller
              name="sftPrice"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-sftPrice-input" placeholder="Enter SFT Price" type="number" {...field} />
              )}
            />
            <FormHelperText>{errors.sftPrice?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-location-input">Location</InputLabel>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-location-input" placeholder="Enter location" {...field} />
              )}
            />
            <FormHelperText>{errors.location?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-zone-input">Zone</InputLabel>
            <Controller
              name="zone"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-zone-input" placeholder="Enter zone" {...field} />
              )}
            />
            <FormHelperText>{errors.zone?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-street-input">Street</InputLabel>
            <Controller
              name="street"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-street-input" placeholder="Enter street" {...field} />
              )}
            />
            <FormHelperText>{errors.street?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-towers-input">Towers</InputLabel>
            <Controller
              name="towers"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-towers-input" placeholder="Enter number of towers" type="number" {...field} />
              )}
            />
            <FormHelperText>{errors.towers?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-locationiframe-input">Location Iframe</InputLabel>
            <Controller
              name="locationiframe"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-locationiframe-input" placeholder="Enter location iframe" {...field} />
              )}
            />
            <FormHelperText>{errors.locationiframe?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink htmlFor="project-parkingarea-input">Parking Area</InputLabel>
            <Controller
              name="parkingarea"
              control={control}
              render={({ field }) => (
                <CustomInput id="project-parkingarea-input" placeholder="Enter parking area" type="number" {...field} />
              )}
            />
            <FormHelperText>{errors.parkingarea?.message}</FormHelperText>
          </FormControl>
          <FormControl fullWidth sx={{ marginBottom: 2, mt: 2 }}>
            <InputLabel shrink sx={{ ml: -1, mt: -2 }} htmlFor="builder-property-type-input">
              Property Type
            </InputLabel>
            <Controller
              name="propertyType"
              control={control}
              rules={{ required: 'Property Type is required' }}
              render={({ field }) => (
                <Select
                  id="builder-property-type-input"
                  displayEmpty
                  {...field}
                  error={!!errors.propertyType}
                  IconComponent={ArrowDropDown}
                  renderValue={(selected) =>
                    selected ? (
                      <Box display="flex" alignItems="center">
                        {selected}
                      </Box>
                    ) : (
                      'Property Types'
                    )
                  }
                  style={{
                    width: "100%",
                    height: "45px",
                    border: "1px solid #1212121A",
                    borderRadius: "10px",
                    opacity: 0.6,
                    boxShadow: "0px 6px 14px #36408D08",
                    fontSize: "14px",
                    color: "#1D1D1D",
                    textAlign: 'left',

                  }}
                  inputProps={{
                    style: {
                      fontSize: "14px",
                    },
                  }}
                  SelectDisplayProps={{
                    style: {
                      fontSize: "14px",
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    Select property type...
                  </MenuItem>
                  <MenuItem value="Apartments">Apartments</MenuItem>
                  <MenuItem value="Villas">Villas</MenuItem>

                </Select>
              )}
            />
            <FormHelperText error>{errors.propertyType?.message}</FormHelperText>
          </FormControl>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Highlights</Typography>
          {highlightFields.map((item, index) => (
            <Box key={item.id} sx={{ mb: 2 }}>
              <FormControl fullWidth>
                <Controller
                  name={`highlights.items.${index}.value`}
                  control={control}
                  rules={{ required: 'Highlight is required' }}
                  render={({ field }) => (
                    <CustomInput placeholder={`Highlight ${index + 1}`} {...field} />
                  )}
                />
              </FormControl>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                sx={{ mt: 1 }}
                onClick={() => removeHighlight(index)}
              >
                Remove Highlight
              </Button>
            </Box>
          ))}
          <Button
            fullWidth
            variant="outlined"
            onClick={() => appendHighlight({ value: '' })}
          >
            Add Highlight
          </Button>


          <Typography variant="h6" sx={{ mb: 1 }}>Bank Offers</Typography>
          {bankFields.map((item, index) => (
            <Box key={item.id} sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, mb: 2 }}>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={500} mb={1}>Bank Icon</Typography>
                <Controller
                  name={`bankOffers.${index}.bankIcon`}
                  control={control}
                  render={({ field }) => (
                    <FileUploadContainer
                      foldername="banks"
                      existingImage={field.value}
                      onFileSelect={(url) => field.onChange(url)}
                      onDelete={() => field.onChange('')}
                    />
                  )}
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <Controller
                  name={`bankOffers.${index}.bankName`}
                  control={control}
                  render={({ field }) => (
                    <CustomInput placeholder="Enter bank name" {...field} />
                  )}
                />
                <FormHelperText>{errors.bankOffers?.[index]?.bankName?.message}</FormHelperText>
              </FormControl>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => remove(index)}
              >
                Remove Bank
              </Button>
            </Box>
          ))}
          <Button
            variant="outlined"
            fullWidth
            onClick={() => append({ bankIcon: '', bankName: '' })}
          >
            Add Bank Offer
          </Button>
          <Box>
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={mutation.isLoading}>
              Add Project
            </Button>
          </Box>
        </form>
      </Box>
    </Drawer>
  );
};

export default AddProject;

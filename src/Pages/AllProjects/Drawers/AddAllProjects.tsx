import { FC, useEffect } from 'react';
import {
    Drawer, Box, Typography, Button, IconButton, FormControl, InputLabel, FormHelperText,
    MenuItem,
    Select,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CustomInput from '../../../Components/Inputs/CustomInput';
import FileUploadContainer from '../../../Components/FileUploadContainer';
import { toast } from 'react-toastify';
import { addProject, updateProject } from '../../../api/services';
import { ArrowDropDown } from '@mui/icons-material';
import { Projects } from '../ProjectInterface';

interface AddProjectProps {
    open: boolean;
    onClose: () => void;
      initialData?: Projects;
    //   onSubmit: (data: Projects) => void;
}

interface FormValues {
    title: string;
    bhk: number[];
    towers: number;
    parkingarea: number;
    location: string;
    sqft: number[];
    highlights:{ value: string }[];
    slug: string;
    projectimage: string;
    rera: string;
    date: number;
}


const AddAllProjects: FC<AddProjectProps> = ({ open, onClose, initialData }) => {
    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        defaultValues: {
            title: '',
            bhk: [],
            sqft: [],
            slug: '',
            location: '',
            projectimage: '',
            towers: 0,
            parkingarea: 0,
            highlights: [{ value: '' }],
            rera: '',
            date: 0,
        }
    });

    useEffect(() => {
        if (open) {
            reset({
                title: initialData?.title || '',
                bhk: initialData?.bhk || [],
                sqft: initialData?.sqft || [],
                slug: initialData?.slug || '',
                location: initialData?.location || '',
                projectimage: initialData?.projectimage || '',
                towers: initialData?.towers || 0,
                parkingarea: initialData?.parkingarea || 0,
                highlights: (initialData?.highlights?.map((h) => ({ value: h }))) || [{ value: '' }],
                rera: initialData?.rera || '',
                date: initialData?.date || 0,
            });
        }
    }, [open, initialData, reset]);
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'highlights'
    });

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: initialData
            ? (data: any) => updateProject(initialData.slug, data)
            : addProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['getProjects'] });
            toast.success(initialData ? 'Project updated successfully' : 'Project added successfully');
            onClose();
        },
        onError: () => {
            toast.error(initialData ? 'Error updating project' : 'Error adding project');
        }
    });

    // const { fields: bankFields, append, remove } = useFieldArray({
    //     control,
    //     name: 'bankOffers'
    // });

    const onSubmit = (data: FormValues) => {
        // Ensure all numeric fields are numbers and not empty strings or NaN
        const parsedData = {
            ...data,
            bhk: Array.isArray(data.bhk) ? data.bhk.map((v: any) => String(v).trim()).filter(Boolean).map(Number) : [],
            sqft: Array.isArray(data.sqft) ? data.sqft.map((v: any) => String(v).trim()).filter(Boolean).map(Number) : [],
            towers: Number(data.towers) || 0,
            parkingarea: Number(data.parkingarea) || 0,
            // propertyType: data.propertyType || '', // Ensure not undefined
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
        if (!data.bhk || data.bhk.filter((v: any) => String(v).trim() !== '').length === 0) {
            toast.error('At least one BHK is required');
            hasError = true;
        }
        if (!data.sqft || data.sqft.filter((v: any) => String(v).trim() !== '').length === 0) {
            toast.error('At least one Sqft is required');
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
                    {initialData ? 'Edit Project' : 'Add Project'}
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
                        <InputLabel shrink htmlFor="project-bhk-input">BHK (comma separated)</InputLabel>
                        <Controller
                            name="bhk"
                            control={control}
                            render={({ field }) => (
                                <CustomInput id="project-bhk-input" placeholder="e.g. 3,4,5" {...field} value={Array.isArray(field.value) ? field.value.join(',') : ''} onChange={e => field.onChange(e.target.value.split(',').map((v: string) => v.trim()))} />
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
                                <CustomInput id="project-sqft-input" placeholder="e.g. 1000,1200" {...field} value={Array.isArray(field.value) ? field.value.join(',') : ''} onChange={e => field.onChange(e.target.value.split(',').map((v: string) => v.trim()))} />
                            )}
                        />
                        <FormHelperText>{errors.sqft?.message}</FormHelperText>
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
                    <FormControl fullWidth sx={{ mb: 3, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                        <Typography variant='h6' mb={1} sx={{ textAlign: 'start' }}>Project Image</Typography>
                        <Controller
                            name="projectimage"
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
                        <FormHelperText error={!!errors.projectimage}>{errors.projectimage?.message}</FormHelperText>
                    </FormControl>



                    <Box>
                        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={mutation.isPending}>
                            {initialData ? 'Update Project' : 'Add Project'}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Drawer>
    );
};

export default AddAllProjects;

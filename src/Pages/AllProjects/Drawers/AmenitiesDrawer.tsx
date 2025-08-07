import React, { FC, useEffect } from 'react';
import {
    Drawer, Box, Typography, IconButton, Button, FormControl, FormHelperText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import CustomInput from '../../../Components/Inputs/CustomInput';
import FileUploadContainer from '../../../Components/FileUploadContainer';
import { Amenities } from '../ProjectInterface';
import { amenity, updateProjectSection } from '../../../api/services'; // replace with correct API call

interface Props {
    open: boolean;
    onClose: () => void;
    slug: string;
    refetch: () => void;
    existingData?: Amenities | null;
}

const AmenitiesDrawer: FC<Props> = ({ open, onClose, slug, refetch, existingData }) => {
    const { control, handleSubmit, reset, formState: { errors } } = useForm<Amenities>({
        defaultValues: {
            d1: '',
            data: [{ logo: '', h1: '' }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'data'
    });

    const queryClient = useQueryClient();

    const mutation = useMutation(
        (formData: Amenities) => updateProjectSection(slug, 'amenities', formData),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('project');
                toast.success('Amenities updated');
                onClose();
                refetch();
            },
            onError: () => {
                toast.error('Failed to update amenities');
            }
        }
    );

    useEffect(() => {
        if (open && existingData) {
            reset(existingData);
        }
    }, [open, existingData, reset]);

    const onSubmit = (data: Amenities) => mutation.mutate(data);

    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 400 } }}>
            <Box sx={{ px: 2, height: 60, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography color="white" fontWeight={600}>Edit Amenities</Typography>
                <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </Box>

            <Box sx={{ p: 3 }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Typography variant="subtitle1" mb={1}>Description</Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <Controller
                            name="d1"
                            control={control}
                            rules={{ required: 'Description is required' }}
                            render={({ field }) => (
                                <CustomInput placeholder="Enter description..." {...field} />
                            )}
                        />
                        <FormHelperText error={!!errors.d1}>{errors.d1?.message}</FormHelperText>
                    </FormControl>

                    <Typography variant="h6" sx={{ mb: 2 }}>Amenity Items</Typography>
                    {fields.map((item, index) => (
                        <Box key={item.id} sx={{ border: '1px solid #ccc', p: 2, borderRadius: 2, mb: 2 }}>
                            <FormControl fullWidth sx={{ mb: 1 }}>
                                <Typography fontWeight={500}>Icon</Typography>
                                <Controller
                                    name={`data.${index}.logo`}
                                    control={control}
                                    render={({ field }) => (
                                        <FileUploadContainer
                                            foldername="amenities"
                                            existingImage={field.value}
                                            onFileSelect={(url) => field.onChange(url)}
                                            onDelete={() => field.onChange('')}
                                        />
                                    )}
                                />
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 1 }}>
                                <Controller
                                    name={`data.${index}.h1`}
                                    control={control}
                                    rules={{ required: 'Title is required' }}
                                    render={({ field }) => (
                                        <CustomInput placeholder="Amenity name" {...field} />
                                    )}
                                />
                            </FormControl>

                            <Button variant="outlined" color="error" fullWidth onClick={() => remove(index)}>Remove</Button>
                        </Box>
                    ))}

                    <Button variant="outlined" fullWidth sx={{ mb: 2 }} onClick={() => append({ logo: '', h1: '' })}>
                        Add Amenity
                    </Button>
                    <Box>

                        <Button variant="contained" type="submit" color="primary" fullWidth>
                            Save Amenities
                        </Button>
                    </Box>
                </form>
            </Box>
        </Drawer>
    );
};

export default AmenitiesDrawer;

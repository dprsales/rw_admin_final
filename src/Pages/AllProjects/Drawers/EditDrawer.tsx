import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  Button,
  Typography,
  CircularProgress,
  InputLabel,
  FormControl,
  FormHelperText,
  Select,
  MenuItem,
  IconButton,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  updateProject,
  updateProjectSection,
} from '../../../api/services';
import { Project, FloorPlan, Amenity, HeroSection, AboutSection, GalleryGrid, GallerySection, Layout, FloorPlans, Amenities, NearbyLocation, ConnectedLocationGroup, ConnectedLiving, } from '../ProjectInterface';
import CustomInput from '../../../Components/Inputs/CustomInput';
import FileUploadContainer from '../../../Components/FileUploadContainer';
import { toast } from 'react-toastify';
import { Controller, useForm } from 'react-hook-form';
import { Form } from 'react-router-dom';
import { ArrowDropDown } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import HeroSectionDrawer from './HeroSection';

interface EditProjectProps {
  open: boolean;
  onClose: () => void;
  selectedItem: HeroSection | AboutSection | GalleryGrid | GallerySection | Layout | FloorPlan | FloorPlans | Amenity | Amenities | NearbyLocation | ConnectedLocationGroup | ConnectedLiving | Project;
  editType: string;
  projectId: string;
  refetch: () => void;
  slug: string;
}


const BHK_OPTIONS = [
  { value: 1, label: '1 BHK' },
  { value: 2, label: '2 BHK' },
  { value: 3, label: '3 BHK' },
  { value: 3.5, label: '3.5 BHK' },
  { value: 4, label: '4 BHK' },
  { value: 4.5, label: '4.5 BHK' },
  { value: 5, label: '5 BHK' },
];

const EditProject: React.FC<EditProjectProps> = ({ open, onClose, selectedItem, editType, projectId, refetch, slug }) => {
  const { control, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const [imageUploaded, setImageUploaded] = useState(false);



  const handleImageDeletefloorplan = () => {
    setFormData({ ...formData, floorImage: null });
    setImageUploaded(false);
  }

  const handleImageDeletebankoffer = () => {
    setFormData({ ...formData, bankIcon: null });
    setImageUploaded(false);
  }


  useEffect(() => {
    setFormData(selectedItem);
  }, [selectedItem]);

 const handleUpdate = async () => {
  setLoading(true);
  try {
    switch (editType) {
      case 'ProjectDetails':
        await updateProject(slug, formData);
        toast.success("Project details updated successfully");
        break;

      case 'HeroSection':
        await updateProjectSection(slug, 'herosection', formData);
        toast.success("Hero section updated successfully");
        break;

      case 'AboutSection':
        await updateProjectSection(slug, 'aboutsection', formData);
        toast.success("About section updated successfully");
        break;

      case 'GallerySection':
        await updateProjectSection(slug, 'gallerysection', formData);
        toast.success("Gallery section updated successfully");
        break;

      case 'Layout':
        await updateProjectSection(slug, 'layoutsection', formData);
        toast.success("Layout section updated successfully");
        break;

      case 'floorPlans':
        await updateProjectSection(slug, 'floorplans', formData);
        toast.success("Floor plans updated successfully");
        break;

      case 'amenities':
        await updateProjectSection(slug, 'amenities', formData);
        toast.success("Amenities updated successfully");
        break;

      case 'connectedliving':
        await updateProjectSection(slug, 'connectedliving', formData);
        toast.success("Connected Living updated successfully");
        break;

      case 'otherDetails':
        await updateProject(slug, formData);
        toast.success("Other details updated successfully");
        break;

      default:
        throw new Error("Unknown edit type");
    }

    refetch();
    onClose();
  } catch (error: any) {
    console.error("❌ Update error:", error);
    toast.error("Error updating project section");
  } finally {
    setLoading(false);
  }
};

  const renderEditFields = () => {
    switch (editType) {
      case 'ProjectDetails':
        return (
          <>
            {/* //name  */}

            <FormControl fullWidth sx={{ marginBottom: 3 }}>
              <InputLabel shrink sx={{ ml: -1.4 }} htmlFor="name">Name</InputLabel>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    placeholder="Name"
                    fullWidth
                    value={formData?.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  />
                )}
              />
            </FormControl>

            {/* //description  */}
            <FormControl fullWidth sx={{ marginBottom: 3 }}>
              <InputLabel shrink sx={{ ml: -1.4 }} htmlFor="description">Description</InputLabel>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    placeholder="Description"
                    fullWidth
                    multiline
                    rows={5}
                    value={formData?.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                  />
                )}
              />
            </FormControl>


            <FormControl fullWidth sx={{ marginBottom: 3 }}>
              <InputLabel shrink sx={{ ml: -1.4 }} htmlFor="establishedYear">Established Year</InputLabel>
              <Controller
                name="establishedYear"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    placeholder="Established Year"
                    fullWidth
                    value={formData?.establishedYear || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, establishedYear: e.target.value })}
                  />
                )}
              />
            </FormControl>


            <FormControl fullWidth sx={{ marginBottom: 3 }}>
              <InputLabel shrink sx={{ ml: -1.4 }} htmlFor="sftPrice">SFT Price</InputLabel>
              <Controller
                name="sftPrice"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    placeholder="SFT Price"
                    fullWidth
                    type="number"
                    value={formData?.sftPrice || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sftPrice: e.target.value })}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth sx={{ marginBottom: 3 }}>
              <InputLabel shrink sx={{ ml: -1.4 }} htmlFor="builderName">Builder Name</InputLabel>
              <Controller
                name="builderName"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    placeholder="Builder Name"
                    fullWidth
                    value={formData?.builderName || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, builderName: e.target.value })}
                  />
                )}
              />
            </FormControl>

          </>
        );



      case "HeroSection":
        return (
          <>
            {/* <HeroSectionDrawer/> */}

          </>
        )


      case 'AboutSection':
        return (
          <>

          </>
        );


      case 'GallerySection':
        return (
          <>

           

          </>
        );

      
               case 'Layout':
        return (
          <>

            

          </>
        );
        case 'floorPlans':
        return (
          <>
            

          </>
        );


      case 'amenities':
        return (
          <>
           

          </>
        );

      case 'connectedliving':
        return (
          <>
            
          </>
        );


      case 'otherDetails':
        return (
          <>

           


          </>
        );

      default:
        return null;
    }
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
          overflowX: 'hidden',
        },
      }}
    >
      {/* Header */}
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
          Edit {editType.charAt(0).toUpperCase() + editType.slice(1)}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white', marginRight: 3 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ padding: '20px' }}>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {renderEditFields()}
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdate}
              sx={{ mt: 3 }}
              fullWidth
            >
              Update
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default EditProject;

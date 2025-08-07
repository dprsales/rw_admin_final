// MultiFileUploadContainer.tsx
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { toast } from 'react-toastify';
import { FileUpload } from '../api/services'; // Adjust the import path

interface MultiFileUploadContainerProps {
  onImagesUpload: (urls: string[]) => void; // Callback for uploaded image URLs
  foldername: string;
  existingImages?: string[]; // Existing images to load initially, if any
}

const MultiFileUploadContainer: React.FC<MultiFileUploadContainerProps> = ({
  onImagesUpload,
  foldername,
  existingImages = [],
}) => {
  const [previews, setPreviews] = useState<string[]>(existingImages); // Image previews
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingImages); // Uploaded URLs
  const [uploading, setUploading] = useState(false);

  // Initialize dropzone
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 10, // Maximum of 10 images
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length + uploadedUrls.length > 10) {
        toast.error("You can upload up to 10 images only.");
        return;
      }
      
      setUploading(true);
      const newUrls: string[] = [];

      for (const file of acceptedFiles) {
        const previewUrl = URL.createObjectURL(file);
        setPreviews((prev) => [...prev, previewUrl]);

        try {
          const response = await FileUpload(foldername, file);
          const imageUrl = response.data.url;
          newUrls.push(imageUrl);
        } catch (error) {
          toast.error('Error uploading image. Please try again.');
        }
      }

      setUploadedUrls((prev) => [...prev, ...newUrls]);
      onImagesUpload([...uploadedUrls, ...newUrls]);
      setUploading(false);
    },
  });

  // Remove an image
  const handleRemoveImage = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    const updatedUrls = uploadedUrls.filter((_, i) => i !== index);

    setPreviews(updatedPreviews);
    setUploadedUrls(updatedUrls);
    onImagesUpload(updatedUrls); // Update parent with new URL list
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed #24272C90',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          textAlign: 'center',
          height: '100px',
        }}
      >
        <input {...getInputProps()} />
        <AddPhotoAlternateIcon sx={{ fontSize: '40px', color: "#6563FF" }} />
        <Typography variant="body2" sx={{ color: "#6563FF" }}>
          Drag & drop images here, or click to select up to 10
        </Typography>
      </Box>

      {uploading && <CircularProgress sx={{ margin: '10px auto' }} />}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {previews.map((preview, index) => (
          <Box key={index} sx={{ position: 'relative', width: '100px', height: '100px' }}>
            <img
              src={preview}
              alt={`Preview ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
            />
            <IconButton
              onClick={() => handleRemoveImage(index)}
              sx={{ position: 'absolute', top: -8, right: -8, color: 'red' }}
            >
              <RemoveCircleOutlineIcon />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default MultiFileUploadContainer;

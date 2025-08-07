import React, { useState, useEffect, ChangeEvent } from 'react';
import { Box, IconButton, Typography, Button } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

interface FileUploadContainerMultipleProps {
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  existingImageUrls?: string[]; // URLs of images already uploaded to the backend
}

const FileUploadContainerMultiple: React.FC<FileUploadContainerMultipleProps> = ({ images, setImages, existingImageUrls = [] }) => {
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  useEffect(() => {
    // Generate preview URLs for new images using URL.createObjectURL
    const newImagePreviews = images
      .filter(image => image instanceof File) // Ensure only File instances are processed
      .map(image => URL.createObjectURL(image));

    // Update state with both new image previews and existing image URLs
    setPreviewImages([...existingImageUrls, ...newImagePreviews]);

    // Cleanup function to avoid memory leaks
    return () => {
      newImagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images, existingImageUrls]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length + images.length > 10) {
      alert("You can only upload up to 10 images.");
      return;
    }
    setImages(prevImages => [...prevImages, ...newFiles]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="h6">Project Images</Typography>
      <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
        {previewImages.map((src, index) => (
          <Box key={index} position="relative">
            <img src={src} alt={`preview-${index}`} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
            <IconButton
              onClick={() => handleRemoveImage(index)}
              sx={{ position: 'absolute', top: 0, right: 0, color: 'red' }}
            >
              <RemoveCircleOutlineIcon />
            </IconButton>
          </Box>
        ))}
        {images.length < 10 && (
          <Box>
            <Button
              component="label"
              variant="outlined"
              startIcon={<AddPhotoAlternateIcon />}
            >
              Add Images
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FileUploadContainerMultiple;

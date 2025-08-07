import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { FileUpload } from '../api/services'; // Ensure the path is correct
import { toast } from 'react-toastify';

interface FileUploadContainerProps {
  onFileSelect: (url: string | null) => void; 
  foldername: string;
  existingImage?: string | null; // Prop for existing image
  onDelete: () => void; // Function to handle image deletion
}

const FileUploadContainer: React.FC<FileUploadContainerProps> = ({
  onFileSelect,
  foldername,
  existingImage,
  onDelete,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle'); // Track upload status

  // Effect to set the preview if there is an existing image
  useEffect(() => {
    if (existingImage) {
      const imageUrl = `https://dprstorage.b-cdn.net${existingImage}`;
      setPreview(imageUrl); 
    }
  }, [existingImage]);

  // Initialize dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/avif': [],    
      'image/webp': [], 
       'image/svg+xml': [], // ✅ SVG support added here
    },
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        setUploadStatus('uploading'); // Set status to uploading

        try {
          const response = await FileUpload(foldername, file); 
          const fileUrl = response.data.url; 
          onFileSelect(fileUrl); 
          setUploadStatus('success'); 
        } catch (error) {
          console.error('Error uploading image:', error);
          setUploadStatus('error'); // Update status to error
          toast.error('Error uploading image. Please try again.');
          onFileSelect(null); // Notify parent that image upload failed
        }
      }
    },
  });

  // Determine border color based on upload status
  const borderColor =
    uploadStatus === 'success' ? '#4CAF50' : 
    uploadStatus === 'error' ? '#F44336' : 
    isDragActive ? '#2196f3' : '#24272C90';

  const handleRemoveImage = () => {
    setPreview(null); // Clear the preview
    onDelete(); // Call the delete function passed from props
    onFileSelect(null); // Notify parent that the image has been removed
  };

  return (
    <Box
      {...getRootProps()} // Props for dropzone functionality
      sx={{
        height: '110px',
        border: `2px dashed ${borderColor}`,
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        textAlign: 'center',
      }}
    >
      <input {...getInputProps()} />
      {uploadStatus === 'uploading' ? (
        <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      ) : (
        <>
          {preview ? (
            <Box sx={{ position: 'relative', width: 'auto', height: '100px', maxWidth: '100%' }}>
              <img
                src={preview}
                alt="Selected"
                style={{ 
                  width: '95%', 
                  height: '95%', 
                  objectFit: 'cover',
                  borderRadius: '10px',
                }}
              />
              {/* Remove Icon for Deleting Image */}
              <IconButton
                onClick={handleRemoveImage}
                sx={{ position: 'absolute', top: 0, right: 0, color: 'red' }}
              >
                <RemoveCircleOutlineIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <AddPhotoAlternateIcon sx={{ fontSize: '40px', color: "#6563FF", marginRight: '8px' }} />
              <Typography variant="caption" sx={{ color: "#6563FF" }}>
                Drag & drop an image here, or click to select one
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default FileUploadContainer;

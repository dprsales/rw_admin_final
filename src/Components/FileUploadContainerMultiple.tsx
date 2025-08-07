import React, { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDropzone } from 'react-dropzone';
import { UploadIcon } from '../assets';

interface Image {
  file: File;
  preview: string;
}

interface FileUploadContainerMultipleProps {
  images: Image[];
  setImages: React.Dispatch<React.SetStateAction<Image[]>>;
}

const FileUploadContainerMultiple: React.FC<FileUploadContainerMultipleProps> = ({ images, setImages }) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: useCallback((acceptedFiles: File[]) => {
      const newImages: Image[] = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file), // For preview purpose
      }));
      setImages(prevImages => [...prevImages, ...newImages]);
    }, [setImages]),
  });

  const handleRemoveImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  return (
    <Box {...getRootProps()} sx={{ border: '2px dashed #24272C', borderRadius: '10px', padding: '16px' }}>
      <input {...getInputProps()} />
      {images.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <img src={UploadIcon} alt="Upload Icon" style={{ height: '40px' }} />
          <Typography variant="caption" sx={{ color: '#6563FF' }}>
            Drag and Drop files here or <u>Choose Files</u>
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {images.map((image, index) => (
            <Box key={index} sx={{ position: 'relative', width: '100px', height: '100px' }}>
              <img src={image.preview} alt={image.file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <Box sx={{ position: 'absolute', top: '5px', right: '5px', cursor: 'pointer' }} onClick={() => handleRemoveImage(index)}>
                <CloseIcon sx={{ color: 'white', fontSize: '16px' }} />
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileUploadContainerMultiple;

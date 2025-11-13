import React, { useCallback, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDropzone } from 'react-dropzone';
import { UploadIcon } from '../assets';

interface Image {
  file: File;
  preview: string;
}

interface FileUploadContainerMultipleProps {
  images: Image[] | { value: Image[] };
  setImages: React.Dispatch<React.SetStateAction<Image[] | { value: Image[] }>>;
}

const FileUploadContainerMultiple: React.FC<
  FileUploadContainerMultipleProps
> = ({ images, setImages }) => {
  const actualImages = Array.isArray(images) ? images : images.value || [];
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
    },
    onDrop: useCallback(
      (acceptedFiles: File[]) => {
        const newImages: Image[] = acceptedFiles.map((file) => ({
          file,
          preview: URL.createObjectURL(file), // For preview purpose
        }));
        setImages((prevImages) => {
          const prev = Array.isArray(prevImages)
            ? prevImages
            : prevImages.value || [];
          const updated = [...prev, ...newImages];
          return Array.isArray(prevImages) ? updated : { value: updated };
        });
      },
      [setImages],
    ),
  });

  useEffect(() => {
    return () => {
      actualImages.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, []);

  const handleRemoveImage = (index: number) => {
    setImages((prevImages) => {
      const prev = Array.isArray(prevImages)
        ? prevImages
        : prevImages.value || [];
      const imageToRemove = prev[index];
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      const updated = prev.filter((_, i) => i !== index);
      return Array.isArray(prevImages) ? updated : { value: updated };
    });
  };

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed #24272C',
        borderRadius: '10px',
        padding: '16px',
      }}
    >
      <input {...getInputProps()} />
      {actualImages.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <img src={UploadIcon} alt="Upload Icon" style={{ height: '40px' }} />
          <Typography variant="caption" sx={{ color: '#6563FF' }}>
            Drag and Drop files here or <u>Choose Files</u>
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {actualImages.map((image, index) => (
            <Box
              key={index}
              sx={{ position: 'relative', width: '100px', height: '100px' }}
            >
              <img
                src={image.preview}
                alt={image.file.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  cursor: 'pointer',
                }}
                onClick={() => handleRemoveImage(index)}
              >
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

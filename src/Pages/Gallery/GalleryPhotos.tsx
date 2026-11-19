import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DeleteOutline, EditOutlined, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import {
  FileUpload,
  createGalleryPhoto,
  deleteGalleryPhoto,
  getAdminGalleryPhotos,
  updateGalleryPhoto,
  type GalleryPhotoRecord,
} from '../../api/services';

const FOLDER = 'gallery';

const errorMessage = (error: any): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message || 'Something went wrong. Please try again.';
};

const resolveUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  return `https://dprstorage.b-cdn.net${path.startsWith('/') ? '' : '/'}${path}`;
};

type EditState = {
  id: string;
  title: string;
  caption: string;
  alt: string;
  published: boolean;
};

const GalleryPhotos: React.FC = () => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isPending, error, refetch } = useQuery<GalleryPhotoRecord[], Error>({
    queryKey: ['gallery-photos'],
    queryFn: getAdminGalleryPhotos,
  });

  const photos = useMemo(
    () => [...(data || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [data],
  );

  const createMutation = useMutation({
    mutationFn: createGalleryPhoto,
    onSuccess: () => {
      toast.success('Photo added to Team RW gallery');
      queryClient.invalidateQueries({ queryKey: ['gallery-photos'] });
    },
    onError: (requestError: any) => toast.error(errorMessage(requestError)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GalleryPhotoRecord> }) =>
      updateGalleryPhoto(id, payload),
    onSuccess: () => {
      toast.success('Photo updated');
      setEdit(null);
      queryClient.invalidateQueries({ queryKey: ['gallery-photos'] });
    },
    onError: (requestError: any) => toast.error(errorMessage(requestError)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGalleryPhoto,
    onSuccess: () => {
      toast.success('Photo deleted');
      setConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['gallery-photos'] });
    },
    onError: (requestError: any) => toast.error(errorMessage(requestError)),
  });

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    let ok = 0;
    try {
      for (const file of files) {
        const response = await FileUpload(FOLDER, file);
        const url = response.data?.url as string;
        const filename = response.data?.filename as string | undefined;
        if (!url) throw new Error('Upload returned no URL');
        await createMutation.mutateAsync({
          url,
          filename,
          title: '',
          caption: '',
          alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
          published: true,
        });
        ok += 1;
      }
      if (ok > 1) toast.success(`${ok} photos uploaded`);
    } catch (requestError: any) {
      toast.error(errorMessage(requestError));
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/avif': [],
    },
    multiple: true,
    disabled: uploading,
    onDrop: (accepted) => {
      void uploadFiles(accepted);
    },
  });

  const move = (photo: GalleryPhotoRecord, direction: -1 | 1) => {
    const index = photos.findIndex((row) => row._id === photo._id);
    const swap = photos[index + direction];
    if (!swap) return;
    const aOrder = photo.sortOrder ?? index;
    const bOrder = swap.sortOrder ?? index + direction;
    updateMutation.mutate({ id: photo._id, payload: { sortOrder: bOrder } });
    updateMutation.mutate({ id: swap._id, payload: { sortOrder: aOrder } });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Gallery · Team RW
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Photos for the website Gallery page. Stored in Bunny under gallery/.
          </Typography>
        </Box>
      </Stack>

      <Paper
        {...getRootProps()}
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          border: '1px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: uploading ? 'wait' : 'pointer',
          textAlign: 'center',
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Stack alignItems="center" gap={1}>
            <CircularProgress size={28} />
            <Typography variant="body2">Uploading…</Typography>
          </Stack>
        ) : (
          <>
            <Typography fontWeight={600}>Drop photos here, or click to upload</Typography>
            <Typography variant="body2" color="text.secondary">
              JPG, PNG, WebP, or AVIF. Multiple files allowed.
            </Typography>
          </>
        )}
      </Paper>

      {isPending && (
        <Box py={6} textAlign="center">
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Paper sx={{ p: 3 }}>
          <Typography color="error" mb={1}>
            Unable to load gallery photos.
          </Typography>
          <Button onClick={() => refetch()}>Try again</Button>
        </Paper>
      )}

      {!isPending && !error && photos.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No photos yet. Upload the first Team RW still above.</Typography>
        </Paper>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 2,
        }}
      >
        {photos.map((photo, index) => (
          <Paper key={photo._id} variant="outlined" sx={{ overflow: 'hidden' }}>
            <Box
              component="img"
              src={resolveUrl(photo.url)}
              alt={photo.alt || photo.title || 'Gallery photo'}
              sx={{ width: '100%', maxHeight: 280, objectFit: 'contain', display: 'block', bgcolor: '#111' }}
            />
            <Box sx={{ p: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="subtitle2" noWrap title={photo.title || 'Untitled'}>
                  {photo.title || 'Untitled'}
                </Typography>
                <Chip
                  size="small"
                  label={photo.published === false ? 'Hidden' : 'Live'}
                  color={photo.published === false ? 'default' : 'success'}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                {photo.caption || 'No caption'}
              </Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" disabled={index === 0 || updateMutation.isPending} onClick={() => move(photo, -1)}>
                    <KeyboardArrowUp fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={index === photos.length - 1 || updateMutation.isPending}
                    onClick={() => move(photo, 1)}
                  >
                    <KeyboardArrowDown fontSize="small" />
                  </IconButton>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setEdit({
                        id: photo._id,
                        title: photo.title || '',
                        caption: photo.caption || '',
                        alt: photo.alt || '',
                        published: photo.published !== false,
                      })
                    }
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setConfirmId(photo._id)}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>
          </Paper>
        ))}
      </Box>

      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit gallery photo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Title"
              value={edit?.title || ''}
              onChange={(e) => setEdit((current) => (current ? { ...current, title: e.target.value } : current))}
              fullWidth
            />
            <TextField
              label="Caption"
              value={edit?.caption || ''}
              onChange={(e) => setEdit((current) => (current ? { ...current, caption: e.target.value } : current))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Alt text"
              value={edit?.alt || ''}
              onChange={(e) => setEdit((current) => (current ? { ...current, alt: e.target.value } : current))}
              fullWidth
              helperText="Short description for screen readers"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={edit?.published !== false}
                  onChange={(e) => setEdit((current) => (current ? { ...current, published: e.target.checked } : current))}
                />
              }
              label="Published on website"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdit(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!edit || updateMutation.isPending}
            onClick={() => {
              if (!edit) return;
              updateMutation.mutate({
                id: edit.id,
                payload: {
                  title: edit.title,
                  caption: edit.caption,
                  alt: edit.alt,
                  published: edit.published,
                },
              });
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmId} onClose={() => setConfirmId(null)}>
        <DialogTitle>Delete this photo?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Removes it from the website and deletes the file from Bunny storage.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!confirmId || deleteMutation.isPending}
            onClick={() => confirmId && deleteMutation.mutate(confirmId)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GalleryPhotos;

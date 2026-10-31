import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, DeleteOutline, EditOutlined } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import FileUploadContainer from '../../Components/FileUploadContainer';
import {
  createBlog,
  deleteBlog,
  getAdminBlogs,
  importDprBlogs,
  updateBlog,
  type BlogInput,
  type BlogRecord,
  type BlogSection,
} from '../../api/services';
import { roleSatisfies } from '../../utils/roles';

const EMPTY_SECTION: BlogSection = { title: '', description: '', type: 'h6' };

const EMPTY_FORM: BlogInput = {
  title: '',
  slug: '',
  metaTitle: '',
  metaDescription: '',
  imageurl: '',
  posturl: '',
  embedposturl: '',
  Linkedinprofileurl: '',
  sections: [{ ...EMPTY_SECTION }],
  published: true,
};

const errorMessage = (error: any): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message || 'Something went wrong. Please try again.';
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

const toForm = (blog: BlogRecord): BlogInput => ({
  title: blog.title || '',
  slug: blog.slug || '',
  metaTitle: blog.metaTitle || '',
  metaDescription: blog.metaDescription || '',
  imageurl: blog.imageurl || '',
  posturl: blog.posturl || '',
  embedposturl: blog.embedposturl || '',
  Linkedinprofileurl: blog.Linkedinprofileurl || '',
  sections: blog.sections?.length ? blog.sections.map((section) => ({ ...section })) : [{ ...EMPTY_SECTION }],
  published: blog.published !== false,
});

const Blogs: React.FC = () => {
  const queryClient = useQueryClient();
  const actorRole = Cookies.get('user_type');
  const canDelete = roleSatisfies(actorRole, 'admin');
  const canImport = roleSatisfies(actorRole, 'admin');

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<BlogRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isPending, error, refetch } = useQuery<BlogRecord[], Error>({
    queryKey: ['blogs'],
    queryFn: getAdminBlogs,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: BlogInput) =>
      editing ? updateBlog(editing._id, payload) : createBlog(payload),
    onSuccess: () => {
      toast.success(editing ? 'Post updated' : 'Post created');
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
    onError: (requestError: any) => toast.error(errorMessage(requestError)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBlog,
    onSuccess: () => {
      toast.success('Post deleted');
      setConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
    onError: (requestError: any) => toast.error(errorMessage(requestError)),
  });

  const importMutation = useMutation({
    mutationFn: importDprBlogs,
    onSuccess: (result) => {
      toast.success(`Imported ${result.imported}, skipped ${result.skipped}`);
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
    onError: (requestError: any) => toast.error(errorMessage(requestError)),
  });

  const rows = data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (blog: BlogRecord) => {
    setEditing(blog);
    setForm(toForm(blog));
    setOpen(true);
  };

  const updateField = <K extends keyof BlogInput>(field: K, value: BlogInput[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSection = (index: number, field: keyof BlogSection, value: string) => {
    setForm((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((section, i) =>
        i === index ? { ...section, [field]: value } : section,
      ),
    }));
  };

  const submit = () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    saveMutation.mutate({
      ...form,
      title: form.title.trim(),
      slug: form.slug?.trim() || undefined,
      sections: (form.sections || []).filter(
        (section) => section.title?.trim() || section.description?.trim(),
      ),
    });
  };

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4, m: 2, borderRadius: 3 }}>
        <Typography color="error" sx={{ mb: 2 }}>
          Unable to load blogs. Please try again.
        </Typography>
        <Button variant="outlined" onClick={() => refetch()}>
          Try again
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Blogs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Write and publish articles for www.rajivwilliams.com. Drafts stay off the public site.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip label={`${rows.length} total`} sx={{ bgcolor: '#e7f1f7', color: '#0f63a5', fontWeight: 600 }} />
          {canImport && (
            <Button
              variant="outlined"
              disabled={importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              {importMutation.isPending ? 'Importing…' : 'Import old feed'}
            </Button>
          )}
          <Button
            onClick={openCreate}
            startIcon={<Add />}
            variant="contained"
            sx={{ borderRadius: 1.5, bgcolor: '#0f63a5', fontWeight: 600, '&:hover': { bgcolor: '#0b4f83' } }}
          >
            Add post
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 99, 165, 0.08)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      No posts yet. Add the first one, or import the old feed.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((blog) => (
                  <TableRow key={blog._id} hover>
                    <TableCell>{blog.title}</TableCell>
                    <TableCell>{blog.slug}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={blog.published === false ? 'Draft' : 'Published'}
                        color={blog.published === false ? 'default' : 'success'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(blog.updatedAt || blog.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(blog)} aria-label="Edit post">
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      {canDelete && (
                        <IconButton size="small" onClick={() => setConfirmId(blog._id)} aria-label="Delete post">
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? 'Edit post' : 'Add post'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Slug"
              value={form.slug}
              onChange={(event) => updateField('slug', event.target.value)}
              helperText="Leave blank to build it from the title."
              fullWidth
            />
            <TextField
              label="Meta title"
              value={form.metaTitle}
              onChange={(event) => updateField('metaTitle', event.target.value)}
              fullWidth
            />
            <TextField
              label="Meta description"
              value={form.metaDescription}
              onChange={(event) => updateField('metaDescription', event.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Cover image
              </Typography>
              <FileUploadContainer
                foldername="Blogs"
                existingImage={form.imageurl || null}
                onFileSelect={(url) => updateField('imageurl', url || '')}
                onDelete={() => updateField('imageurl', '')}
              />
            </Box>
            <TextField
              label="LinkedIn post URL (optional)"
              value={form.posturl}
              onChange={(event) => updateField('posturl', event.target.value)}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.published !== false}
                  onChange={(event) => updateField('published', event.target.checked)}
                />
              }
              label={form.published !== false ? 'Published' : 'Draft'}
            />
            <Typography variant="subtitle2">Sections</Typography>
            {(form.sections || []).map((section, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption">Section {index + 1}</Typography>
                    <Button
                      size="small"
                      onClick={() =>
                        updateField(
                          'sections',
                          (form.sections || []).filter((_, i) => i !== index),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </Stack>
                  <TextField
                    label="Heading"
                    value={section.title || ''}
                    onChange={(event) => updateSection(index, 'title', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Body"
                    value={section.description || ''}
                    onChange={(event) => updateSection(index, 'description', event.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                </Stack>
              </Paper>
            ))}
            <Button
              onClick={() => updateField('sections', [...(form.sections || []), { ...EMPTY_SECTION }])}
            >
              Add section
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmId)} onClose={() => setConfirmId(null)}>
        <DialogTitle>Delete this post?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">This cannot be undone. Unpublish instead if you only want it off the site.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>Cancel</Button>
          <Button
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => confirmId && deleteMutation.mutate(confirmId)}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Blogs;

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
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Pagination,
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
import { Add, ArticleOutlined, DeleteOutline, EditOutlined, Search } from '@mui/icons-material';
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
import PageHeader from '../../Components/PageHeader';
import ConfirmDialog from '../../Components/ConfirmDialog';
import EmptyState from '../../Components/EmptyState';
import { useTableSort, SortableHeadCell, type SortAccessors } from '../../Components/TableSort';
import { tokens } from '../../Theme/tokens';

type BlogStatusFilter = 'all' | 'published' | 'draft';

const BLOG_SORT: SortAccessors<BlogRecord> = {
  title: (blog) => blog.title || '',
  status: (blog) => (blog.published === false ? 'draft' : 'published'),
  date: (blog) => blog.updatedAt || blog.createdAt || '',
};

const ROWS_PER_PAGE = 10;

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
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlogStatusFilter>('all');
  const [titleError, setTitleError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((blog) => {
      if (statusFilter === 'published' && blog.published === false) return false;
      if (statusFilter === 'draft' && blog.published !== false) return false;
      if (!query) return true;
      return [blog.title, blog.slug]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [rows, searchText, statusFilter]);
  const { sorted, order, orderBy, toggle: toggleSort } = useTableSort(filteredRows, BLOG_SORT);
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const visibleRows = sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setTitleError('');
    setOpen(true);
  };

  const openEdit = (blog: BlogRecord) => {
    setEditing(blog);
    setForm(toForm(blog));
    setTitleError('');
    setOpen(true);
  };

  const updateField = <K extends keyof BlogInput>(field: K, value: BlogInput[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'title') setTitleError('');
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
      setTitleError('Title is required');
      toast.error('Title is required');
      return;
    }
    setTitleError('');
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
      <PageHeader
        title="Blogs"
        description="Write and publish articles for www.rajivwilliams.com. Drafts stay off the public site."
        crumbs={[{ label: 'Blogs' }]}
        actions={
          <>
            <Chip label={`${rows.length} total`} sx={{ bgcolor: tokens.goldSoft, color: tokens.goldText, fontWeight: 600 }} />
            {canImport && (
              <Button variant="outlined" disabled={importMutation.isPending} onClick={() => importMutation.mutate()}>
                {importMutation.isPending ? 'Importing…' : 'Import old feed'}
              </Button>
            )}
            <Button onClick={openCreate} startIcon={<Add />} variant="contained">
              Add post
            </Button>
          </>
        }
      />

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: tokens.shadowSoft }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search title or slug"
            size="small"
            sx={{ width: { xs: '100%', sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: tokens.textMuted }} />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {(['all', 'published', 'draft'] as BlogStatusFilter[]).map((value) => (
              <Chip
                key={value}
                label={value === 'all' ? 'All' : value === 'published' ? 'Published' : 'Draft'}
                color={value === 'published' ? 'success' : 'default'}
                variant={statusFilter === value ? 'filled' : 'outlined'}
                onClick={() => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              />
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {filteredRows.length} of {rows.length} posts
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <SortableHeadCell label="Title" sortKey="title" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
                <SortableHeadCell label="Status" sortKey="status" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <SortableHeadCell label="Updated" sortKey="date" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState
                      icon={ArticleOutlined}
                      title={rows.length === 0 ? 'No posts yet' : 'No posts found'}
                      description={
                        rows.length === 0
                          ? 'Add the first post, or import the old feed.'
                          : 'Try a different search or status filter.'
                      }
                      actionLabel={rows.length === 0 ? 'Add post' : undefined}
                      onAction={rows.length === 0 ? openCreate : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((blog) => (
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

      {sorted.length > ROWS_PER_PAGE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={Math.min(currentPage, totalPages)}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? 'Edit post' : 'Add post'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              error={Boolean(titleError)}
              helperText={titleError || ' '}
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

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Delete this post?"
        description="This cannot be undone. Unpublish instead if you only want it off the site."
        confirmLabel="Delete"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => confirmId && deleteMutation.mutate(confirmId)}
        onClose={() => setConfirmId(null)}
      />
    </Box>
  );
};

export default Blogs;

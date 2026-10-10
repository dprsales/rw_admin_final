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
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { PersonAddAlt1 } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createEmployee, getEmployees, type CreateEmployeeInput, type EmployeeRecord } from '../../api/services';

const EMPTY_FORM: CreateEmployeeInput = {
  firstName: '',
  lastName: '',
  personalEmail: '',
  phone: '',
  designation: '',
  department: '',
  joiningDate: '',
};

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

type FormErrors = Partial<Record<keyof CreateEmployeeInput, string>>;

const validate = (form: CreateEmployeeInput): FormErrors => {
  const errors: FormErrors = {};
  if (!form.firstName.trim()) errors.firstName = 'First name is required';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required';
  if (!form.personalEmail.trim()) errors.personalEmail = 'Email is required';
  else if (!EMAIL_PATTERN.test(form.personalEmail.trim())) errors.personalEmail = 'Enter a valid email';
  if (!form.phone.trim()) errors.phone = 'Phone is required';
  else if (form.phone.trim().length > 40) errors.phone = 'Phone is too long';
  if (!form.designation.trim()) errors.designation = 'Designation is required';
  if (!form.department.trim()) errors.department = 'Department is required';
  if (!form.joiningDate) errors.joiningDate = 'Joining date is required';
  return errors;
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

const fields: { key: keyof CreateEmployeeInput; label: string; type?: string }[] = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'personalEmail', label: 'Personal email', type: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'designation', label: 'Designation' },
  { key: 'department', label: 'Department' },
  { key: 'joiningDate', label: 'Joining date', type: 'date' },
];

const Employees: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const queryClient = useQueryClient();

  const { data, isPending, error, refetch } = useQuery<EmployeeRecord[], Error>({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      toast.success('Employee created');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (requestError: any) => toast.error(errorMessage(requestError)),
  });

  const rows = data ?? [];

  const updateField = (field: keyof CreateEmployeeInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submitCreate = () => {
    const errors = validate(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    createMutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      personalEmail: form.personalEmail.trim(),
      phone: form.phone.trim(),
      designation: form.designation.trim(),
      department: form.department.trim(),
      joiningDate: form.joiningDate,
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
          Unable to load employees. Please try again.
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
            Employees
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a draft employee record. The employee ID is assigned by the server.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip label={`${rows.length} total`} sx={{ bgcolor: '#e7f1f7', color: '#0f63a5', fontWeight: 600 }} />
          <Button
            onClick={() => {
              setForm(EMPTY_FORM);
              setFormErrors({});
              setCreateOpen(true);
            }}
            startIcon={<PersonAddAlt1 />}
            variant="contained"
            sx={{ borderRadius: 1.5, bgcolor: '#0f63a5', fontWeight: 600, '&:hover': { bgcolor: '#0b4f83' } }}
          >
            Add employee
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 99, 165, 0.08)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Employee ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Joining date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Onboarding</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      No employees yet. Add the first record.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((employee) => (
                  <TableRow key={employee._id} hover>
                    <TableCell>{employee.employeeCode}</TableCell>
                    <TableCell>{`${employee.firstName} ${employee.lastName}`.trim()}</TableCell>
                    <TableCell>{employee.personalEmail}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{formatDate(employee.joiningDate)}</TableCell>
                    <TableCell>{employee.onboardingStatus}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add employee</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {fields.map((field) => (
              <TextField
                key={field.key}
                label={field.label}
                type={field.type ?? 'text'}
                value={form[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                error={Boolean(formErrors[field.key])}
                helperText={formErrors[field.key] ?? ' '}
                fullWidth
                InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submitCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Saving…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;

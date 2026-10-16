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
import { ReceiptLong, Search } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getCoachingPayments, sendCoachingInvoice, type CoachingPayment } from '../../api/services';

type StatusFilter = 'all' | CoachingPayment['status'];

const STATUS_LABEL: Record<CoachingPayment['status'], string> = {
  completed: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
};

const STATUS_COLOR: Record<CoachingPayment['status'], 'success' | 'warning' | 'error'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'error',
};

const inr = (amount?: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

const errorMessage = (error: any): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message || 'Something went wrong. Please try again.';
};

const Payments: React.FC = () => {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected] = useState<CoachingPayment | null>(null);
  const queryClient = useQueryClient();

  const { data, isPending, error, refetch } = useQuery<CoachingPayment[], Error>({
    queryKey: ['coaching-payments'],
    queryFn: getCoachingPayments,
  });

  const invoiceMutation = useMutation({
    mutationFn: sendCoachingInvoice,
    onSuccess: (response: any) => {
      const updated = response?.data as CoachingPayment | undefined;
      toast.success(
        updated?.invoiceNumber
          ? `Invoice ${updated.invoiceNumber} emailed to ${updated.invoiceSentTo}`
          : 'Invoice emailed',
      );
      if (updated) setSelected(updated);
      queryClient.invalidateQueries({ queryKey: ['coaching-payments'] });
    },
    onError: (requestError: any) => toast.error(errorMessage(requestError)),
  });

  const payments = data ?? [];

  const totals = useMemo(() => {
    const paid = payments.filter((payment) => payment.status === 'completed');
    return {
      collected: paid.reduce((sum, payment) => sum + (payment.payableAmount || 0), 0),
      pending: payments.filter((payment) => payment.status === 'pending').length,
      failed: payments.filter((payment) => payment.status === 'failed').length,
      invoiced: payments.filter((payment) => payment.invoiceSentAt).length,
    };
  }, [payments]);

  const visible = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return payments.filter((payment) => {
      if (filter !== 'all' && payment.status !== filter) return false;
      if (!query) return true;
      const haystack = [
        payment.customer?.name,
        payment.customer?.email,
        payment.customer?.phone,
        payment.invoiceNumber,
        payment.razorpayOrderId,
        payment.razorpayPaymentId,
        ...(payment.modules || []).map((module) => module.title),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [payments, filter, searchText]);

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
          Unable to load coaching payments. Please try again.
        </Typography>
        <Button variant="outlined" onClick={() => refetch()}>
          Try again
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Coaching payments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Check each purchase, confirm the payment, then email the invoice to the buyer.
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Paper sx={{ px: 2, py: 1.5, minWidth: 160 }}>
          <Typography variant="caption" color="text.secondary">Collected</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{inr(totals.collected)}</Typography>
        </Paper>
        <Paper sx={{ px: 2, py: 1.5, minWidth: 120 }}>
          <Typography variant="caption" color="text.secondary">Pending</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{totals.pending}</Typography>
        </Paper>
        <Paper sx={{ px: 2, py: 1.5, minWidth: 120 }}>
          <Typography variant="caption" color="text.secondary">Failed</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{totals.failed}</Typography>
        </Paper>
        <Paper sx={{ px: 2, py: 1.5, minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">Invoices emailed</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{totals.invoiced}</Typography>
        </Paper>
      </Stack>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 99, 165, 0.08)' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search buyer, email, module, or payment id"
            size="small"
            sx={{ width: { xs: '100%', sm: 380 } }}
            InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <Stack direction="row" spacing={1}>
            {(['all', 'completed', 'pending', 'failed'] as StatusFilter[]).map((value) => (
              <Chip
                key={value}
                label={value === 'all' ? 'All' : STATUS_LABEL[value]}
                color={value === 'all' ? 'default' : STATUS_COLOR[value]}
                variant={filter === value ? 'filled' : 'outlined'}
                onClick={() => setFilter(value)}
              />
            ))}
          </Stack>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Buyer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Modules</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payable</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      {payments.length === 0
                        ? 'No coaching purchases yet.'
                        : 'No payments match that search.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((payment) => (
                  <TableRow key={payment._id} hover>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{payment.customer?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{payment.customer?.email}</Typography>
                    </TableCell>
                    <TableCell>{payment.count} · {(payment.modules || []).map((module) => module.title).join(', ')}</TableCell>
                    <TableCell>{inr(payment.payableAmount)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={STATUS_LABEL[payment.status]} color={STATUS_COLOR[payment.status]} />
                    </TableCell>
                    <TableCell>{payment.invoiceNumber || '—'}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => setSelected(payment)}>Open</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        {selected && (
          <>
            <DialogTitle>Purchase check</DialogTitle>
            <Divider />
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Buyer</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{selected.customer?.name}</Typography>
                  <Typography variant="body2">{selected.customer?.email}</Typography>
                  <Typography variant="body2">{selected.customer?.phone}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Coaching purchased</Typography>
                  {(selected.modules || []).map((module) => (
                    <Typography key={`${module.id}-${module.title}`} variant="body2">
                      {module.title}{module.category ? ` · ${module.category}` : ''}
                    </Typography>
                  ))}
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Amount</Typography>
                  <Typography variant="body2">Base {inr(selected.baseAmount)}</Typography>
                  <Typography variant="body2">
                    Discount {selected.discountPercent ? `${selected.discountPercent}% · ` : ''}{inr(selected.discountAmount)}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>Payable {inr(selected.payableAmount)}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Payment</Typography>
                  <Chip size="small" label={STATUS_LABEL[selected.status]} color={STATUS_COLOR[selected.status]} sx={{ mb: 1 }} />
                  <Typography variant="body2">Order {selected.razorpayOrderId}</Typography>
                  <Typography variant="body2">Payment {selected.razorpayPaymentId || 'Not received yet'}</Typography>
                  <Typography variant="body2">Started {formatDate(selected.createdAt)}</Typography>
                  {selected.webhookVerifiedAt && (
                    <Typography variant="body2">Confirmed by Razorpay {formatDate(selected.webhookVerifiedAt)}</Typography>
                  )}
                  {selected.failureReason && (
                    <Typography variant="body2" color="error">{selected.failureReason}</Typography>
                  )}
                </Box>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="overline" color="text.secondary">Invoice</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{selected.invoiceNumber || 'Not issued yet'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selected.invoiceSentAt
                      ? `Emailed to ${selected.invoiceSentTo} on ${formatDate(selected.invoiceSentAt)}`
                      : 'Email sends the invoice to the buyer and keeps this number.'}
                  </Typography>
                </Paper>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setSelected(null)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<ReceiptLong />}
                disabled={selected.status !== 'completed' || invoiceMutation.isPending}
                onClick={() => invoiceMutation.mutate(selected._id)}
                sx={{ bgcolor: '#0f63a5', '&:hover': { bgcolor: '#0b4f83' } }}
              >
                {selected.status !== 'completed'
                  ? 'Invoice after payment'
                  : invoiceMutation.isPending
                    ? 'Sending…'
                    : selected.invoiceSentAt
                      ? 'Email invoice again'
                      : 'Email invoice'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Payments;

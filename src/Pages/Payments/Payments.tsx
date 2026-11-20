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
  Pagination,
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
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import EmptyState from '../../Components/EmptyState';
import { useTableSort, SortableHeadCell, type SortAccessors } from '../../Components/TableSort';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { tokens } from '../../Theme/tokens';

type StatusFilter = 'all' | CoachingPayment['status'];

const PAYMENT_SORT: SortAccessors<CoachingPayment> = {
  date: (payment) => payment.createdAt || '',
  buyer: (payment) => payment.customer?.name || '',
  module: (payment) => (payment.modules || []).map((module) => module.title).join(', '),
  status: (payment) => payment.status,
  amount: (payment) => payment.payableAmount || 0,
};

const ROWS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);
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

  const { sorted, order, orderBy, toggle: toggleSort } = useTableSort(visible, PAYMENT_SORT);
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageRows = sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

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
      <PageHeader
        title="Coaching payments"
        description="Check each purchase, confirm the payment, then email the invoice to the buyer."
        crumbs={[{ label: 'Payments' }]}
        actions={
          <Chip
            label={`${payments.length} total`}
            sx={{ bgcolor: tokens.goldSoft, color: tokens.goldText, fontWeight: 600 }}
          />
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <StatCard label="Collected" value={inr(totals.collected)} icon={CheckCircleOutlineIcon} tone="green" hint="Payments confirmed" />
        <StatCard label="Pending" value={totals.pending} icon={HourglassEmptyIcon} tone="gold" hint="Awaiting confirmation" />
        <StatCard label="Failed" value={totals.failed} icon={ErrorOutlineIcon} tone="red" hint="Needs attention" />
        <StatCard label="Invoices emailed" value={totals.invoiced} icon={EmailOutlinedIcon} tone="ink" hint="Sent to buyers" />
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: tokens.shadowSoft }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search buyer, email, module, or payment id"
            size="small"
            sx={{ width: { xs: '100%', sm: 380 } }}
            InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: tokens.textMuted }} /> }}
          />
          <Stack direction="row" spacing={1}>
            {(['all', 'completed', 'pending', 'failed'] as StatusFilter[]).map((value) => (
              <Chip
                key={value}
                label={value === 'all' ? 'All' : STATUS_LABEL[value]}
                color={value === 'all' ? 'default' : STATUS_COLOR[value]}
                variant={filter === value ? 'filled' : 'outlined'}
                onClick={() => {
                  setFilter(value);
                  setCurrentPage(1);
                }}
              />
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {visible.length} of {payments.length} payments
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <SortableHeadCell label="Date" sortKey="date" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <SortableHeadCell label="Buyer" sortKey="buyer" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <SortableHeadCell label="Module" sortKey="module" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <SortableHeadCell label="Amount" sortKey="amount" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <SortableHeadCell label="Status" sortKey="status" order={order} activeKey={orderBy} onSort={toggleSort} sx={{ fontWeight: 700 }} />
                <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon={ReceiptLong}
                      title={payments.length === 0 ? 'No coaching purchases yet' : 'No payments found'}
                      description={
                        payments.length === 0
                          ? 'Purchases will appear here as buyers complete checkout.'
                          : 'Try a different search or status filter.'
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((payment) => (
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
                sx={{ bgcolor: tokens.gold, color: tokens.black, '&:hover': { bgcolor: tokens.goldDark } }}
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

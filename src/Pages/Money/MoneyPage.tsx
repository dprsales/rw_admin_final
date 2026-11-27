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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import PageHeader from '../../Components/PageHeader';
import EmptyState from '../../Components/EmptyState';
import {
  createMoneyEntry,
  deleteMoneyEntry,
  getMoneyEntries,
  getMoneySummary,
  updateMoneyEntry,
  type MoneyEntry,
  type MoneyEntryInput,
} from '../../api/services';
import { tokens } from '../../Theme/tokens';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BAR_COLORS = [
  tokens.gold,
  tokens.goldHover,
  '#8B7355',
  '#A67C52',
  '#C4A574',
  '#6E7F8D',
  '#5C6B7A',
  '#9AA1AB',
];

const chartPanelSx = {
  border: `1px solid ${tokens.border}`,
  borderRadius: 2,
  bgcolor: tokens.panel,
  p: 1.75,
  minHeight: 280,
  flex: 1,
  minWidth: 0,
};

const inr = (amount?: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const SpendTip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <Box
      sx={{
        bgcolor: tokens.panelAlt,
        color: tokens.text,
        border: `1px solid ${tokens.border}`,
        borderRadius: '8px',
        px: 1.25,
        py: 0.9,
        fontSize: 12,
      }}
    >
      <Typography sx={{ fontSize: 11, color: tokens.goldHover, fontWeight: 700, mb: 0.3 }}>
        {row.fullName || label}
      </Typography>
      <Typography sx={{ fontSize: 12.5 }}>
        {inr(Number(payload[0].value) || 0)}
        {row.count != null ? (
          <Typography component="span" sx={{ color: tokens.textMuted, fontSize: 11, ml: 0.75 }}>
            · {row.count} entries
          </Typography>
        ) : null}
      </Typography>
      {row.hint ? (
        <Typography sx={{ fontSize: 10.5, color: tokens.textMuted, mt: 0.25 }}>{row.hint}</Typography>
      ) : null}
    </Box>
  );
};

const ymd = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const emptyForm = (): MoneyEntryInput => ({
  date: new Date().toISOString().slice(0, 10),
  type: 'expense',
  merchant: '',
  product: '',
  category: 'Software',
  amountOriginal: 0,
  currency: 'INR',
  amountInr: 0,
  likelySubscription: 'Maybe',
  note: '',
  project: '',
});

const errorMessage = (error: any): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message || 'Something went wrong. Please try again.';
};

const MoneyPage: React.FC = () => {
  const year = String(new Date().getFullYear());
  const queryClient = useQueryClient();
  const [month, setMonth] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MoneyEntry | null>(null);
  const [form, setForm] = useState<MoneyEntryInput>(emptyForm());

  const summaryQuery = useQuery({
    queryKey: ['money-summary', year],
    queryFn: () => getMoneySummary(year),
  });

  const listQuery = useQuery({
    queryKey: ['money-entries', year, month],
    queryFn: () =>
      getMoneyEntries({
        year,
        month: month === 'all' ? undefined : month,
        limit: 500,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing?._id) {
        return updateMoneyEntry(editing._id, form);
      }
      return createMoneyEntry(form);
    },
    onSuccess: () => {
      toast.success(editing ? 'Entry updated' : 'Entry added');
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm());
      queryClient.invalidateQueries({ queryKey: ['money-entries'] });
      queryClient.invalidateQueries({ queryKey: ['money-summary'] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMoneyEntry(id),
    onSuccess: () => {
      toast.success('Entry deleted');
      queryClient.invalidateQueries({ queryKey: ['money-entries'] });
      queryClient.invalidateQueries({ queryKey: ['money-summary'] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const monthOptions = useMemo(() => {
    const fromSummary = summaryQuery.data?.byMonth?.map((m) => m.month) || [];
    return ['all', ...fromSummary];
  }, [summaryQuery.data]);

  const monthChartData = useMemo(() => {
    const map = new Map(
      (summaryQuery.data?.byMonth || []).map((m) => [m.month, m]),
    );
    return Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      const hit = map.get(key);
      return {
        month: key,
        label: MONTH_SHORT[i],
        totalInr: hit?.totalInr || 0,
        count: hit?.count || 0,
        hint: 'Click to filter list',
      };
    });
  }, [summaryQuery.data, year]);

  const merchantChartData = useMemo(() => {
    const subs = summaryQuery.data?.subscriptions || [];
    if (subs.length) {
      return subs.slice(0, 8).map((s) => ({
        name: s.merchant.length > 18 ? `${s.merchant.slice(0, 16)}…` : s.merchant,
        fullName: s.merchant,
        totalInr: s.totalInr,
        count: s.timesSeen,
        hint: `~${inr(s.estMonthlyInr)} / mo`,
      }));
    }
    const tally: Record<string, { totalInr: number; count: number }> = {};
    (listQuery.data || []).forEach((row) => {
      const key = row.merchant || 'Unknown';
      if (!tally[key]) tally[key] = { totalInr: 0, count: 0 };
      tally[key].totalInr += Number(row.amountInr) || 0;
      tally[key].count += 1;
    });
    return Object.keys(tally)
      .map((name) => ({
        name: name.length > 18 ? `${name.slice(0, 16)}…` : name,
        fullName: name,
        totalInr: tally[name].totalInr,
        count: tally[name].count,
        hint: `${tally[name].count} entries`,
      }))
      .sort((a, b) => b.totalInr - a.totalInr)
      .slice(0, 8);
  }, [summaryQuery.data, listQuery.data]);

  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const thisMonthTotal =
    summaryQuery.data?.byMonth?.find((m) => m.month === thisMonthKey)?.totalInr || 0;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: MoneyEntry) => {
    setEditing(row);
    setForm({
      date: ymd(row.date),
      type: row.type || 'expense',
      merchant: row.merchant || '',
      product: row.product || '',
      category: row.category || 'Software',
      amountOriginal: Number(row.amountOriginal) || 0,
      currency: row.currency || 'INR',
      amountInr: Number(row.amountInr) || 0,
      likelySubscription: (row.likelySubscription as any) || 'Maybe',
      note: row.note || '',
      project: row.project || '',
    });
    setDialogOpen(true);
  };

  const rows = listQuery.data || [];
  const loading = listQuery.isPending || summaryQuery.isPending;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="Spend tracker"
        description="Tool and subscription spend from Gmail sync plus manual entries. Amounts in INR."
        crumbs={[{ label: 'Spend' }]}
        homeTo="/money"
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openCreate}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Add expense
          </Button>
        }
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
        useFlexGap
      >
        <Box sx={chartPanelSx}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Monthly spend · {year}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.textMuted }}>
                Click a month to filter the list below
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight={700}>
                {inr(summaryQuery.data?.totalInr)}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.textMuted }}>
                {summaryQuery.data?.expenseCount || 0} entries · this month {inr(thisMonthTotal)}
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart
                data={monthChartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                onClick={(state: any) => {
                  const key = state?.activePayload?.[0]?.payload?.month;
                  if (!key) return;
                  setMonth((prev) => (prev === key ? 'all' : key));
                }}
                style={{ cursor: 'pointer' }}
              >
                <defs>
                  <linearGradient id="spendArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={tokens.gold} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={tokens.gold} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={tokens.border} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: tokens.textMuted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: tokens.textMuted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                  }
                />
                <Tooltip content={<SpendTip />} cursor={{ stroke: tokens.gold, strokeDasharray: '3 3' }} />
                <Area
                  type="monotone"
                  dataKey="totalInr"
                  stroke={tokens.gold}
                  strokeWidth={2.2}
                  fill="url(#spendArea)"
                  activeDot={{ r: 5, fill: tokens.goldHover }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Box sx={{ ...chartPanelSx, maxWidth: { md: 420 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Top tools
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.textMuted }}>
                Highest INR this year
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: tokens.textMuted }}>
              {summaryQuery.data?.subscriptions?.length || merchantChartData.length} tracked
            </Typography>
          </Stack>
          <Box sx={{ width: '100%', height: 220 }}>
            {merchantChartData.length === 0 ? (
              <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                <Typography variant="caption" sx={{ color: tokens.textMuted }}>
                  No merchant totals yet
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer>
                <BarChart
                  data={merchantChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
                >
                  <CartesianGrid stroke={tokens.border} strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: tokens.textMuted, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tick={{ fill: tokens.textMuted, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<SpendTip />} cursor={{ fill: tokens.goldSoft }} />
                  <Bar dataKey="totalInr" radius={[0, 6, 6, 0]} barSize={14}>
                    {merchantChartData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }} useFlexGap flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Month</InputLabel>
          <Select
            label="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {monthOptions.map((m) => (
              <MenuItem key={m} value={m}>
                {m === 'all' ? 'All months' : m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {month !== 'all' ? (
          <Chip
            size="small"
            label={`Showing ${month}`}
            onDelete={() => setMonth('all')}
            sx={{ height: 26 }}
          />
        ) : null}
        <Typography variant="body2" sx={{ color: tokens.textMuted }}>
          Hover charts for amounts. Sheet sync keeps this list current.
        </Typography>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={SavingsRoundedIcon}
          title="No spend entries yet"
          description="Push from the Gmail Sheet, or add an expense here."
          actionLabel="Add expense"
          onAction={openCreate}
        />
      ) : (
        <TableContainer
          sx={{
            border: `1px solid ${tokens.border}`,
            borderRadius: 2,
            bgcolor: tokens.panel,
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Merchant / product</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">INR</TableCell>
                <TableCell>Sub?</TableCell>
                <TableCell>Source</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell>{ymd(row.date)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={650}>
                      {row.merchant}
                    </Typography>
                    <Typography variant="caption" sx={{ color: tokens.textMuted }}>
                      {row.product || row.note || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.category || '-'}</TableCell>
                  <TableCell align="right">{inr(row.amountInr)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.likelySubscription || 'Maybe'}
                      variant="outlined"
                      sx={{ height: 22, fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell>{row.source || '-'}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => openEdit(row)}
                      startIcon={<EditRoundedIcon sx={{ fontSize: 16 }} />}
                      sx={{ textTransform: 'none', minWidth: 0 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        if (window.confirm(`Delete ${row.merchant}?`)) {
                          deleteMutation.mutate(row._id);
                        }
                      }}
                      startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                      sx={{ textTransform: 'none', minWidth: 0 }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit expense' : 'Add expense'}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Merchant / tool"
              value={form.merchant}
              onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Product / plan"
              value={form.product}
              onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Amount (original)"
                type="number"
                value={form.amountOriginal}
                onChange={(e) => {
                  const amountOriginal = Number(e.target.value) || 0;
                  setForm((f) => ({
                    ...f,
                    amountOriginal,
                    amountInr:
                      (f.currency || 'INR').toUpperCase() === 'INR'
                        ? amountOriginal
                        : f.amountInr,
                  }));
                }}
                fullWidth
              />
              <TextField
                label="Currency"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Amount INR"
                type="number"
                value={form.amountInr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amountInr: Number(e.target.value) || 0 }))
                }
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={form.type || 'expense'}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as 'expense' | 'income' }))
                  }
                >
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Subscription</InputLabel>
                <Select
                  label="Subscription"
                  value={form.likelySubscription || 'Maybe'}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, likelySubscription: e.target.value }))
                  }
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="Maybe">Maybe</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Note"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!form.merchant.trim() || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {editing ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MoneyPage;

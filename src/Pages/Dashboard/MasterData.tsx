import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip as MuiTooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowForwardRounded,
  BadgeRounded,
  DescriptionRounded,
  FactCheckRounded,
  FolderOpenRounded,
  GroupRounded,
  PaymentsRounded,
  PersonSearchRounded,
  RefreshRounded,
  ScheduleRounded,
  VisibilityRounded,
} from '@mui/icons-material';
import type { SvgIconProps } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTipBox,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getAdminBlogs,
  getAdminListings,
  getApplications,
  getChannelPartners,
  getCoachingPayments,
  getEmployees,
  getLeads,
  getProjects,
  getSiteVisitsSummary,
  getUsers,
  getVendorPartners,
} from '../../api/services';
import { tokens } from '../../Theme/tokens';

/* ── brand tokens (black shell, charcoal panels, antique gold) ─ */
const GOLD = tokens.gold;
const GOLD_DARK = tokens.goldHover;
const GOLD_SOFT = tokens.goldHover; // solid gold accent for chart slices
const INK = tokens.text;
const MUTED = tokens.textMuted;
const LINE = tokens.border;
const CARD = tokens.panel;
const STALE = 2 * 60 * 1000;

type Row = Record<string, any>;
const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const text = (value: unknown) => (typeof value === 'string' ? value : '');

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
};
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const relativeTime = (value: unknown) => {
  const date = parseDate(value);
  if (!date) return '-';
  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  const abs = Math.abs(minutes);
  if (abs < 2) return 'just now';
  if (abs < 60) return minutes > 0 ? `in ${abs}m` : `${abs}m ago`;
  if (abs < 1440) return minutes > 0 ? `in ${Math.round(abs / 60)}h` : `${Math.round(abs / 60)}h ago`;
  if (abs < 10080) return minutes > 0 ? `in ${Math.round(abs / 1440)}d` : `${Math.round(abs / 1440)}d ago`;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
};
const money = (value: number) => {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
};

/* ── small presentational pieces ────────────────────────────── */
const Panel: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  minHeight?: number;
}> = ({ title, subtitle, action, children, minHeight = 240 }) => (
  <Box
    sx={{
      bgcolor: CARD,
      border: `1px solid ${LINE}`,
      borderRadius: '14px',
      p: 2,
      minHeight,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: tokens.shadowSoft,
      minWidth: 0,
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1.5}>
      <Box>
        <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: INK, lineHeight: 1.2 }}>{title}</Typography>
        {subtitle ? (
          <Typography sx={{ fontSize: 11.5, color: MUTED, mt: 0.4 }}>{subtitle}</Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
    <Box sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>{children}</Box>
  </Box>
);

const Empty: React.FC<{ label: string }> = ({ label }) => (
  <Box sx={{ height: '100%', minHeight: 130, display: 'grid', placeItems: 'center' }}>
    <Typography sx={{ fontSize: 12, color: MUTED }}>{label}</Typography>
  </Box>
);

const ChartTip: React.FC<any> = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: tokens.panelAlt,
        color: tokens.text,
        border: `1px solid ${tokens.border}`,
        borderRadius: '8px',
        boxShadow: tokens.shadow,
        px: 1.25,
        py: 0.9,
        fontSize: 11.5,
      }}
    >
      <Typography sx={{ fontSize: 10.5, color: GOLD_DARK, fontWeight: 700, mb: 0.3 }}>{label}</Typography>
      <Typography>
        {payload[0].name}: <b>{payload[0].value}{unit}</b>
      </Typography>
    </Box>
  );
};

const KpiCard: React.FC<{
  icon: React.ComponentType<SvgIconProps>;
  label: string;
  value: React.ReactNode;
  note: string;
  tone: string;
  route: string;
  loading?: boolean;
}> = ({ icon: Icon, label, value, note, tone, route, loading }) => {
  const navigate = useNavigate();
  return (
    <Box
      component="button"
      type="button"
      onClick={() => navigate(route)}
      sx={{
        bgcolor: tokens.panelAlt,
        border: `1px solid ${tokens.border}`,
        boxShadow: tokens.shadowSoft,
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: '14px',
        p: 1.75,
        minHeight: 132,
        fontFamily: 'inherit',
        transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: tokens.gold,
          boxShadow: tokens.shadowSoft,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(tone, 0.12),
            color: tone,
          }}
        >
          <Icon sx={{ fontSize: 19 }} />
        </Box>
        <ArrowForwardRounded sx={{ fontSize: 15, color: tokens.textMuted }} />
      </Stack>
      {loading ? (
        <Skeleton variant="text" width="55%" height={38} sx={{ mt: 1.2, bgcolor: tokens.overlay }} />
      ) : (
        <Typography sx={{ fontSize: { xs: 22, sm: 29 }, fontWeight: 750, color: INK, lineHeight: 1.1, mt: 1.3 }}>
          {value}
        </Typography>
      )}
      <Typography sx={{ fontSize: 12.5, color: MUTED, fontWeight: 600, mt: 0.4 }}>{label}</Typography>
      <Typography sx={{ fontSize: 10.5, color: tone, fontWeight: 600, mt: 0.2 }}>{note}</Typography>
    </Box>
  );
};

type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  at: unknown;
  icon: React.ComponentType<SvgIconProps>;
  color: string;
  route: string;
};

const ActivityRow: React.FC<{ item: ActivityItem; divider: boolean }> = ({ item, divider }) => {
  const navigate = useNavigate();
  const Icon = item.icon;
  return (
    <Box
      component="button"
      type="button"
      onClick={() => navigate(item.route)}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        py: 1,
        px: 0.5,
        border: 0,
        borderBottom: divider ? `1px solid ${LINE}` : 'none',
        bgcolor: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        '&:hover': { bgcolor: tokens.goldSoft },
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha(item.color, 0.12),
          color: item.color,
        }}
      >
        <Icon sx={{ fontSize: 16 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 650, color: INK }}>
          {item.label} · <Box component="span" sx={{ fontWeight: 500, color: MUTED }}>{item.detail}</Box>
        </Typography>
        <Typography sx={{ fontSize: 10.5, color: MUTED, mt: 0.15 }}>{relativeTime(item.at)}</Typography>
      </Box>
      <ArrowForwardRounded sx={{ fontSize: 14, color: tokens.textMuted }} />
    </Box>
  );
};

/* ── main dashboard ─────────────────────────────────────────── */
const MasterData: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [flowView, setFlowView] = useState<'stage' | 'daily'>('stage');
  const [range, setRange] = useState<7 | 14>(7);
  const [refreshedAt, setRefreshedAt] = useState(() => new Date());

  const projectsQ = useQuery({ queryKey: ['dashboard', 'projects'], queryFn: () => getProjects(1, '', 200), staleTime: STALE });
  const visitsQ = useQuery({ queryKey: ['dashboard', 'visits'], queryFn: getSiteVisitsSummary, staleTime: STALE, refetchInterval: 60_000 });
  const leadsQ = useQuery({ queryKey: ['dashboard', 'leads'], queryFn: () => getLeads({ limit: 500 }), staleTime: STALE });
  const applicationsQ = useQuery({ queryKey: ['dashboard', 'applications'], queryFn: getApplications, staleTime: STALE });
  const paymentsQ = useQuery({ queryKey: ['dashboard', 'payments'], queryFn: getCoachingPayments, staleTime: STALE });
  const listingsQ = useQuery({ queryKey: ['dashboard', 'listings'], queryFn: () => getAdminListings(), staleTime: STALE });
  const partnersQ = useQuery({ queryKey: ['dashboard', 'partners'], queryFn: getChannelPartners, staleTime: STALE });
  const vendorAppsQ = useQuery({ queryKey: ['dashboard', 'vendor-apps'], queryFn: getVendorPartners, staleTime: STALE });
  const employeesQ = useQuery({ queryKey: ['dashboard', 'employees'], queryFn: getEmployees, staleTime: STALE });
  const usersQ = useQuery({ queryKey: ['dashboard', 'users'], queryFn: getUsers, staleTime: STALE });
  const blogsQ = useQuery({ queryKey: ['dashboard', 'blogs'], queryFn: getAdminBlogs, staleTime: STALE });

  const isFetching = [projectsQ, visitsQ, leadsQ, applicationsQ, paymentsQ, listingsQ, partnersQ, vendorAppsQ, employeesQ, usersQ, blogsQ].some((q) => q.isFetching);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    setRefreshedAt(new Date());
  };

  /* ── normalise every response, even if one endpoint fails ── */
  const projectRaw: any = projectsQ.data;
  const projectCount = Array.isArray(projectRaw?.projects)
    ? projectRaw.projects.length
    : Array.isArray(projectRaw?.data?.projects)
      ? projectRaw.data.projects.length
      : Array.isArray(projectRaw?.data)
        ? projectRaw.data.length
        : 0;

  const visits: Row = (visitsQ.data as Row) ?? {};
  const visitDays = asArray<Row>(visits.last7Days);
  const leadRows = asArray<Row>((leadsQ.data as Row)?.leads);
  const applications = asArray<Row>(applicationsQ.data);
  const payments = asArray<Row>(paymentsQ.data);
  const listings = asArray<Row>(listingsQ.data);
  const partners = asArray<Row>(partnersQ.data);
  const vendorApps = asArray<Row>(vendorAppsQ.data);
  const employees = asArray<Row>(employeesQ.data);
  const users = asArray<Row>(usersQ.data);
  const blogs = asArray<Row>(blogsQ.data);

  const collected = payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + num(p.payableAmount), 0);
  const openLeads = leadRows.filter((l) => !['won_booked', 'lost'].includes(l.stage)).length;
  const onboarding = employees.filter((e) => /under review|submitted/i.test(text(e.onboardingStatus))).length;

  const queue = [
    { label: 'Listings', count: listings.filter((l) => l.status === 'pending').length, color: GOLD, route: '/listings' },
    { label: 'Partners', count: partners.filter((p) => p.status === 'new' || p.status === 'reviewing').length, color: GOLD_DARK, route: '/channel-partners' },
    { label: 'Vendors', count: vendorApps.filter((v) => v.status === 'new' || v.status === 'resubmit').length, color: GOLD_SOFT, route: '/vendor-partners' },
    { label: 'Onboarding', count: onboarding, color: tokens.goldDark, route: '/employees' },
  ];
  const queueTotal = queue.reduce((sum, item) => sum + item.count, 0);

  /* ── chart data ── */
  const visitorData = visitDays.map((day) => ({
    name: parseDate(`${text(day.date)}T00:00:00`)?.toLocaleDateString(undefined, { weekday: 'short' }) || text(day.date).slice(5),
    visits: num(day.count),
  }));

  const STAGES = [
    { key: 'new_lead', label: 'New' },
    { key: 'attempted_contact', label: 'Contacted' },
    { key: 'connected', label: 'Connected' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'site_visit_planned', label: 'Visit' },
    { key: 'negotiation', label: 'Deal' },
    { key: 'won_booked', label: 'Won' },
  ];
  const stageData = STAGES.map((stage) => ({
    name: stage.label,
    leads: leadRows.filter((l) => l.stage === stage.key).length,
  }));

  const dailyData = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (range - 1));
    return Array.from({ length: range }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return {
        name: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        leads: leadRows.filter((l) => dayKey(parseDate(l.createdAt) || new Date(0)) === dayKey(day)).length,
      };
    });
  }, [leadRows, range]);

  /* ── timelines ── */
  const activity = useMemo<ActivityItem[]>(() => {
    const rows: ActivityItem[] = [
      ...leadRows.slice(0, 8).map((l) => ({
        id: `lead-${l._id}`, label: 'New lead', detail: text(l.name) || text(l.phone) || 'Enquiry',
        at: l.createdAt, icon: PersonSearchRounded, color: GOLD, route: '/leads',
      })),
      ...applications.slice(0, 8).map((a) => ({
        id: `app-${a._id}`, label: 'Application', detail: text(a.name) || text(a.jobTitle) || 'Career',
        at: a.createdAt, icon: DescriptionRounded, color: GOLD_DARK, route: '/applications',
      })),
      ...partners.slice(0, 8).map((p) => ({
        id: `partner-${p._id}`, label: 'Partner', detail: text(p.agencyName) || text(p.name) || 'Enquiry',
        at: p.createdAt, icon: FactCheckRounded, color: tokens.goldDark, route: '/channel-partners',
      })),
      ...vendorApps.slice(0, 8).map((v) => ({
        id: `vendor-${v._id}`, label: 'Vendor app', detail: text(v.companyName) || 'New application',
        at: v.createdAt, icon: FactCheckRounded, color: GOLD_SOFT, route: '/vendor-partners',
      })),
      ...payments.slice(0, 8).map((p) => ({
        id: `pay-${p._id}`, label: 'Payment', detail: `${text(p.customer?.name) || 'Order'} · ${money(num(p.payableAmount))}`,
        at: p.createdAt, icon: PaymentsRounded, color: tokens.successText, route: '/payments',
      })),
      ...blogs.slice(0, 5).map((b) => ({
        id: `blog-${b._id}`, label: 'Blog', detail: text(b.title) || 'New post',
        at: b.createdAt || b.updatedAt, icon: DescriptionRounded, color: MUTED, route: '/blogs',
      })),
    ];
    return rows
      .filter((row) => parseDate(row.at))
      .sort((a, b) => (parseDate(b.at)?.getTime() || 0) - (parseDate(a.at)?.getTime() || 0))
      .slice(0, 6);
  }, [leadRows, applications, partners, vendorApps, payments, blogs]);

  const followUps = useMemo(
    () =>
      leadRows
        .filter((l) => parseDate(l.nextFollowUpAt))
        .sort((a, b) => (parseDate(a.nextFollowUpAt)?.getTime() || 0) - (parseDate(b.nextFollowUpAt)?.getTime() || 0))
        .slice(0, 5),
    [leadRows],
  );

  const firstName = (text(Cookies.get('user_name')).trim().split(' ')[0] || 'there');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const kpis = [
    { icon: FolderOpenRounded, label: 'Projects', value: projectCount, note: 'live projects', tone: GOLD, route: '/projects', loading: projectsQ.isPending },
    { icon: VisibilityRounded, label: 'Visitors today', value: num(visits.today), note: 'site traffic', tone: GOLD_DARK, route: '/dashboard', loading: visitsQ.isPending },
    { icon: PersonSearchRounded, label: 'Open leads', value: openLeads, note: `${leadRows.length} in view`, tone: GOLD_SOFT, route: '/leads', loading: leadsQ.isPending },
    { icon: DescriptionRounded, label: 'Applications', value: applications.length, note: 'career resumes', tone: tokens.goldDark, route: '/applications', loading: applicationsQ.isPending },
    { icon: PaymentsRounded, label: 'Collected', value: money(collected), note: 'paid payments', tone: tokens.successText, route: '/payments', loading: paymentsQ.isPending },
    { icon: FactCheckRounded, label: 'Approval queue', value: queueTotal, note: 'needs a look', tone: tokens.warningText, route: '/listings', loading: listingsQ.isPending || partnersQ.isPending || vendorAppsQ.isPending },
    { icon: BadgeRounded, label: 'Employees', value: employees.length, note: `${onboarding} onboarding`, tone: GOLD, route: '/employees', loading: employeesQ.isPending },
    { icon: GroupRounded, label: 'Team seats', value: users.filter((u) => u.accessEnabled !== false).length, note: 'active access', tone: GOLD_DARK, route: '/users', loading: usersQ.isPending },
  ];

  const axisProps = { tick: { fontSize: 10, fill: tokens.textMuted }, axisLine: false, tickLine: false } as const;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: 1600, mx: 'auto' }}>
      {/* header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.5} mb={2.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 4, height: 34, borderRadius: 2, bgcolor: GOLD }} />
          <Box>
            <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 750, color: INK, lineHeight: 1.2 }}>
              {greeting}, {firstName}
            </Typography>
            <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.3 }}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}Updated {refreshedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tokens.successText, ml: 0.7 }} />}
            label="Live"
            sx={{ bgcolor: tokens.successSoft, color: tokens.successText, fontSize: 11, fontWeight: 700, '& .MuiChip-icon': { fontSize: 8 } }}
          />
          <MuiTooltip title="Refresh dashboard">
            <IconButton
              onClick={refresh}
              sx={{ border: `1px solid ${LINE}`, bgcolor: CARD, color: MUTED, '&:hover': { color: GOLD_DARK, borderColor: tokens.gold } }}
            >
              <RefreshRounded sx={{ fontSize: 18, animation: isFetching ? 'dash-spin 1s linear infinite' : 'none', '@keyframes dash-spin': { to: { transform: 'rotate(360deg)' } } }} />
            </IconButton>
          </MuiTooltip>
          <Button
            variant="contained"
            size="small"
            endIcon={<ArrowForwardRounded />}
            onClick={() => navigate('/leads')}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Open leads
          </Button>
        </Stack>
      </Stack>

      {/* KPI grid */}
      <Box sx={{ display: 'grid', gap: 1.75, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, mb: 2 }}>
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </Box>

      {/* traffic + queue */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' }, mb: 2 }}>
        <Panel title="Visitor trend" subtitle="Website traffic · last 7 days" minHeight={286}>
          {visitsQ.isPending ? <Skeleton variant="rounded" height={210} sx={{ bgcolor: tokens.overlay }} />
            : visitorData.length === 0 ? <Empty label="No visitor data yet" />
              : (
                <Box sx={{ height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visitorData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="visitFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity={0.42} />
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={tokens.border} vertical={false} />
                      <XAxis dataKey="name" {...axisProps} />
                      <YAxis allowDecimals={false} {...axisProps} width={34} />
                      <ChartTipBox content={<ChartTip unit=" visits" />} cursor={{ stroke: GOLD, strokeDasharray: '3 3' }} />
                      <Area type="monotone" dataKey="visits" name="Visits" stroke={GOLD_DARK} strokeWidth={2} fill="url(#visitFill)" activeDot={{ r: 5, fill: GOLD, stroke: CARD, strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              )}
        </Panel>

        <Panel title="Approval queue" subtitle="What is waiting on the team" minHeight={286}>
          {queueTotal === 0 ? <Empty label="All caught up — nothing pending" />
            : (
              <>
                <Box sx={{ position: 'relative', height: 158 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={queue.filter((q) => q.count > 0)}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={70}
                        paddingAngle={3}
                        stroke="none"
                        onClick={(entry: any) => navigate(entry.route)}
                        style={{ cursor: 'pointer' }}
                      >
                        {queue.filter((q) => q.count > 0).map((q) => <Cell key={q.label} fill={q.color} />)}
                      </Pie>
                      <ChartTipBox content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 26, fontWeight: 750, color: INK, lineHeight: 1 }}>{queueTotal}</Typography>
                      <Typography sx={{ fontSize: 10, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>pending</Typography>
                    </Box>
                  </Box>
                </Box>
                <Stack spacing={0.3} mt={0.5}>
                  {queue.map((item) => (
                    <Box
                      key={item.label}
                      component="button"
                      type="button"
                      onClick={() => navigate(item.route)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, border: 0, bgcolor: 'transparent', cursor: 'pointer', p: 0.4, fontFamily: 'inherit', borderRadius: 1, '&:hover': { bgcolor: tokens.goldSoft } }}
                    >
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: item.color }} />
                      <Typography sx={{ fontSize: 11.5, color: MUTED, flex: 1, textAlign: 'left' }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: INK }}>{item.count}</Typography>
                    </Box>
                  ))}
                </Stack>
              </>
            )}
        </Panel>
      </Box>

      {/* lead flow + activity timeline */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, mb: 2 }}>
        <Panel
          title="Lead flow"
          subtitle={flowView === 'stage' ? 'Where the pipeline sits right now' : `New enquiries · last ${range} days`}
          minHeight={300}
          action={
            <ToggleButtonGroup
              size="small"
              value={flowView}
              exclusive
              onChange={(_, value) => value && setFlowView(value)}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontSize: 10.5, py: 0.3, px: 1, borderColor: LINE, color: MUTED }, '& .Mui-selected': { color: `${GOLD_DARK} !important`, bgcolor: `${tokens.goldSoft} !important` } }}
            >
              <ToggleButton value="stage">By stage</ToggleButton>
              <ToggleButton value="daily">By day</ToggleButton>
            </ToggleButtonGroup>
          }
        >
          {flowView === 'daily' ? (
            <Stack direction="row" spacing={0.5} justifyContent="flex-end" mb={0.5}>
              {([7, 14] as const).map((value) => (
                <Button key={value} size="small" onClick={() => setRange(value)} sx={{ minWidth: 34, py: 0.1, fontSize: 10.5, color: range === value ? GOLD_DARK : MUTED, bgcolor: range === value ? tokens.goldSoft : 'transparent' }}>
                  {value}D
                </Button>
              ))}
            </Stack>
          ) : null}
          {leadsQ.isPending ? <Skeleton variant="rounded" height={220} sx={{ bgcolor: tokens.overlay }} />
            : (
              <Box sx={{ height: flowView === 'daily' ? 212 : 238 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={flowView === 'stage' ? stageData : dailyData} margin={{ top: 6, right: 4, left: -20, bottom: 0 }} barSize={flowView === 'stage' ? 24 : 18}>
                    <CartesianGrid stroke={tokens.border} vertical={false} />
                    <XAxis dataKey="name" {...axisProps} interval={0} tickFormatter={(v: string) => (flowView === 'daily' && range === 14 ? v.split(' ')[1] : v)} />
                    <YAxis allowDecimals={false} {...axisProps} width={32} />
                    <ChartTipBox content={<ChartTip unit=" leads" />} cursor={{ fill: tokens.goldSoft }} />
                    <Bar dataKey="leads" name="Leads" radius={[5, 5, 0, 0]}>
                      {(flowView === 'stage' ? stageData : dailyData).map((entry, index) => (
                        <Cell key={index} fill={index === (flowView === 'stage' ? 0 : (flowView === 'daily' ? dailyData.length - 1 : 0)) ? GOLD_DARK : GOLD} opacity={index === 0 || index === (flowView === 'stage' ? stageData.length - 1 : dailyData.length - 1) ? 1 : 0.65} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
        </Panel>

        <Panel title="Latest activity" subtitle="Newest records across the app" minHeight={300}>
          {activity.length === 0 ? <Empty label="No recent activity" />
            : activity.map((item, index) => <ActivityRow key={item.id} item={item} divider={index < activity.length - 1} />)}
        </Panel>
      </Box>

      {/* follow-ups + quick actions */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.4fr) minmax(0, 1fr)' } }}>
        <Panel title="Next follow-ups" subtitle="Leads with a scheduled touch" minHeight={230}>
          {followUps.length === 0 ? <Empty label="Nothing scheduled — add a follow-up on a lead" />
            : followUps.map((lead, index) => (
              <Box
                key={lead._id}
                component="button"
                type="button"
                onClick={() => navigate('/leads')}
                sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.25, py: 1, px: 0.5, border: 0, borderBottom: index < followUps.length - 1 ? `1px solid ${LINE}` : 'none', bgcolor: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', '&:hover': { bgcolor: tokens.goldSoft } }}
              >
                <Box sx={{ width: 32, height: 32, borderRadius: '10px', display: 'grid', placeItems: 'center', bgcolor: tokens.goldSoft, color: GOLD_DARK }}>
                  <ScheduleRounded sx={{ fontSize: 17 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 650, color: INK }}>{text(lead.name) || text(lead.phone) || 'Lead'}</Typography>
                  <Typography sx={{ fontSize: 10.5, color: MUTED }}>{text(lead.stage).replace(/_/g, ' ')}</Typography>
                </Box>
                <Chip size="small" label={relativeTime(lead.nextFollowUpAt)} sx={{ fontSize: 10.5, fontWeight: 700, bgcolor: tokens.goldSoft, color: GOLD_DARK }} />
              </Box>
            ))}
        </Panel>

        <Panel title="Quick actions" subtitle="Jump back into work" minHeight={230}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
            {[
              { label: 'Leads', route: '/leads', icon: PersonSearchRounded },
              { label: 'Applications', route: '/applications', icon: DescriptionRounded },
              { label: 'Payments', route: '/payments', icon: PaymentsRounded },
              { label: 'Listings', route: '/listings', icon: FolderOpenRounded },
              { label: 'Employees', route: '/employees', icon: BadgeRounded },
              { label: 'Blogs', route: '/blogs', icon: DescriptionRounded },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outlined"
                  onClick={() => navigate(action.route)}
                  startIcon={<Icon sx={{ fontSize: 17 }} />}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: 12, fontWeight: 600, py: 1, px: 1.25, borderColor: tokens.border, color: GOLD_DARK, bgcolor: CARD, '&:hover': { bgcolor: tokens.goldSoft, borderColor: tokens.gold } }}
                >
                  {action.label}
                </Button>
              );
            })}
          </Box>
        </Panel>
      </Box>
    </Box>
  );
};

export default MasterData;

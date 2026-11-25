import React, { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CRM_ROLE_LABELS,
  isCrmRole,
  stubCrmRoleFromUserType,
  type CrmRole,
} from './crmRoles';

/** Sample-only figures for leadership UI. Live APIs wire later. */
const KPI = [
  { key: 'open', label: 'Open leads', value: '186', hint: 'Across your desk', tone: 'default' as const },
  { key: 'overdue', label: 'Overdue follow-ups', value: '23', hint: 'Need a call today', tone: 'danger' as const },
  { key: 'connected', label: 'Connected today', value: '41', hint: 'Talked / WhatsApp replied', tone: 'ok' as const },
  { key: 'visits', label: 'Site visits (week)', value: '12', hint: 'Booked or done', tone: 'default' as const },
  { key: 'booked', label: 'Booked (month)', value: '7', hint: 'Closed this month', tone: 'ok' as const },
  { key: 'conv', label: 'Lead → visit', value: '18%', hint: 'Last 30 days', tone: 'default' as const },
];

const ACTIVITY = [
  { day: '10 Nov', calls: 52, connects: 21, followUps: 34 },
  { day: '11 Nov', calls: 61, connects: 28, followUps: 40 },
  { day: '12 Nov', calls: 48, connects: 19, followUps: 31 },
  { day: '13 Nov', calls: 70, connects: 33, followUps: 44 },
  { day: '14 Nov', calls: 66, connects: 30, followUps: 42 },
  { day: '15 Nov', calls: 38, connects: 14, followUps: 22 },
  { day: '16 Nov', calls: 29, connects: 11, followUps: 18 },
  { day: '17 Nov', calls: 74, connects: 36, followUps: 48 },
  { day: '18 Nov', calls: 69, connects: 31, followUps: 45 },
  { day: '19 Nov', calls: 71, connects: 34, followUps: 47 },
  { day: '20 Nov', calls: 58, connects: 26, followUps: 39 },
  { day: '21 Nov', calls: 63, connects: 29, followUps: 41 },
  { day: '22 Nov', calls: 45, connects: 18, followUps: 28 },
  { day: '23 Nov', calls: 77, connects: 38, followUps: 52 },
];

const FUNNEL = [
  { stage: 'New Lead', count: 64, width: 100 },
  { stage: 'Attempted', count: 48, width: 78 },
  { stage: 'Connected', count: 36, width: 62 },
  { stage: 'Qualified', count: 28, width: 52 },
  { stage: 'Site Visit', count: 18, width: 40 },
  { stage: 'Negotiation', count: 11, width: 28 },
  { stage: 'Booked', count: 7, width: 18 },
];

const TEAM_BARS = [
  { name: 'Priya', worked: 42, connects: 19, overdue: 2 },
  { name: 'Arjun', worked: 38, connects: 16, overdue: 5 },
  { name: 'Neha', worked: 35, connects: 21, overdue: 1 },
  { name: 'Karan', worked: 29, connects: 12, overdue: 7 },
  { name: 'Meera', worked: 24, connects: 10, overdue: 4 },
];

const TEMP_MIX = [
  { name: 'Hot', value: 28, color: '#f04438' },
  { name: 'Warm', value: 74, color: '#f5a524' },
  { name: 'Cold', value: 84, color: '#3b82f6' },
];

const PROJECT_BARS = [
  { name: 'Skyline', leads: 48, visits: 9, booked: 3 },
  { name: 'Lakeview', leads: 41, visits: 7, booked: 2 },
  { name: 'Parkside', leads: 36, visits: 5, booked: 1 },
  { name: 'Orchid', leads: 29, visits: 4, booked: 1 },
  { name: 'Other', leads: 32, visits: 3, booked: 0 },
];

const TARGETS = [
  { label: 'Team calls (week)', actual: 412, target: 500, unit: 'calls' },
  { label: 'Connects (week)', actual: 168, target: 200, unit: 'connects' },
  { label: 'Site visits (week)', actual: 12, target: 16, unit: 'visits' },
  { label: 'Bookings (month)', actual: 7, target: 12, unit: 'bookings' },
];

const ATTENTION = [
  { id: 'a1', who: 'Karan', what: '7 overdue follow-ups', project: 'Skyline', when: 'Oldest 4 days', tone: 'danger' as const },
  { id: 'a2', who: 'Arjun', what: 'Hot lead idle 36h', project: 'Lakeview', when: 'Sana Khan', tone: 'hot' as const },
  { id: 'a3', who: 'Parkside', what: 'Visit no-shows rising', project: 'Project', when: '3 this week', tone: 'warm' as const },
  { id: 'a4', who: 'Meera', what: 'New leads unworked', project: 'Orchid', when: '6 waiting', tone: 'cold' as const },
];

const PROJECT_PULSE = [
  { name: 'Skyline Residences', open: 48, hot: 9, overdue: 6, next: 'Cost sheet chase · 2 today', health: 72 },
  { name: 'Lakeview Towers', open: 41, hot: 7, overdue: 4, next: 'Site visit confirm · 3', health: 64 },
  { name: 'Parkside Avenue', open: 36, hot: 5, overdue: 8, next: 'Fresh dials · 11 new', health: 48 },
  { name: 'Orchid Heights', open: 29, hot: 4, overdue: 3, next: 'Proposal follow-ups', health: 58 },
];

const FEED = [
  { t: '10 min ago', text: 'Neha marked Site Visit Done · Skyline · Ananya Reddy' },
  { t: '28 min ago', text: 'Arjun logged Connected · Lakeview · Vikram Shah' },
  { t: '1 hr ago', text: 'Priya booked a visit for tomorrow 11:00 · Parkside' },
  { t: '2 hr ago', text: 'Karan moved 2 leads to Attempted · Orchid' },
  { t: 'Today 9:40', text: '12 new Meta leads landed on Skyline' },
];

const CHART_TIP = {
  background: '#14181f',
  border: '1px solid #262b33',
  borderRadius: 6,
  fontSize: 12,
  color: '#eceef2',
};

function currentCrmRole(): CrmRole {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

function isLeadership(role: CrmRole) {
  return role === 'sales_manager' || role === 'sales_team_lead' || role === 'crm_admin';
}

function pct(actual: number, target: number) {
  return Math.min(100, Math.round((actual / target) * 100));
}

/**
 * Leadership command centre (sample data).
 * Managers, team leads, and CRM Admin see desk-wide pulse before APIs land.
 */
const CrmDashboard: React.FC = () => {
  const crmRole = currentCrmRole();
  const name = (Cookies.get('user_name') || 'Team').trim();

  const roleLine = useMemo(() => {
    if (crmRole === 'crm_admin') return 'Whole desk overview';
    if (crmRole === 'sales_manager') return 'Your lines overview';
    return 'Your team overview';
  }, [crmRole]);

  if (!isLeadership(crmRole)) {
    return <Navigate to="/crm" replace />;
  }

  return (
    <div className="crm-page crm-page--wide">
      <nav className="crm-crumbs" aria-label="Breadcrumb">
        <span>Sales CRM</span>
        <span className="crm-crumbs__sep" aria-hidden="true">/</span>
        <span className="crm-crumbs__current">Dashboard</span>
      </nav>

      <div className="crm-hero">
        <div>
          <p className="crm-kicker">Dashboard · {CRM_ROLE_LABELS[crmRole]}</p>
          <h1 className="crm-title">What is moving today</h1>
          <p className="crm-sub">
            Hi {name}. {roleLine}. Spot overdue heat, connects, and visits before you chase the floor.
          </p>
        </div>
        <div className="crm-hero__actions">
          <div className="crm-seg" role="group" aria-label="Range">
            <button type="button" className="crm-seg__btn is-on">
              This week
            </button>
            <button type="button" className="crm-seg__btn" disabled title="Month view wires with live data">
              Month
            </button>
          </div>
          <Link to="/crm" className="crm-btn crm-btn--ghost">
            My Day
          </Link>
          <Link to="/crm/team" className="crm-btn">
            Open team
          </Link>
        </div>
      </div>

      <div className="crm-kpi-grid">
        {KPI.map((item) => (
          <article key={item.key} className={`crm-kpi crm-kpi--${item.tone}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <em>{item.hint}</em>
          </article>
        ))}
      </div>

      <div className="crm-dash-grid">
        <section className="crm-chart-card crm-chart-card--wide">
          <header className="crm-chart-card__head">
            <div>
              <h2>Activity trend</h2>
              <p>Calls, connects, and follow-ups · last 14 days (sample)</p>
            </div>
          </header>
          <div className="crm-chart-card__body crm-chart-card__body--tall">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVITY} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="crmCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c5a46d" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#c5a46d" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="crmConnects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#303640" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#a4acb8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#a4acb8', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={CHART_TIP} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#a4acb8' }} />
                <Area
                  type="monotone"
                  dataKey="calls"
                  name="Calls"
                  stroke="#c5a46d"
                  strokeWidth={2}
                  fill="url(#crmCalls)"
                />
                <Area
                  type="monotone"
                  dataKey="connects"
                  name="Connects"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#crmConnects)"
                />
                <Area
                  type="monotone"
                  dataKey="followUps"
                  name="Follow-ups"
                  stroke="#f5a524"
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Pipeline funnel</h2>
              <p>Where leads sit right now (sample)</p>
            </div>
          </header>
          <div className="crm-funnel" role="list">
            {FUNNEL.map((row, i) => {
              const next = FUNNEL[i + 1];
              const drop = next ? Math.round(((row.count - next.count) / row.count) * 100) : null;
              return (
                <div key={row.stage} className="crm-funnel__row" role="listitem">
                  <div className="crm-funnel__meta">
                    <span>{row.stage}</span>
                    <strong>{row.count}</strong>
                  </div>
                  <div className="crm-funnel__track" aria-hidden="true">
                    <div className="crm-funnel__fill" style={{ width: `${row.width}%` }} />
                  </div>
                  {drop != null && (
                    <p className="crm-funnel__drop">{drop}% drop to next</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Team this week</h2>
              <p>Leads worked vs connects (sample)</p>
            </div>
            <Link to="/crm/team" className="crm-chart-card__link">
              Team →
            </Link>
          </header>
          <div className="crm-chart-card__body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={TEAM_BARS}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
              >
                <CartesianGrid stroke="#303640" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#a4acb8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={52}
                  tick={{ fill: '#f1f2f4', fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={CHART_TIP} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#a4acb8' }} />
                <Bar dataKey="worked" name="Worked" fill="#c5a46d" radius={[0, 6, 6, 0]} barSize={10} />
                <Bar dataKey="connects" name="Connects" fill="#22c55e" radius={[0, 6, 6, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="crm-mini-table" aria-label="Team overdue counts">
            {TEAM_BARS.map((row) => (
              <li key={row.name}>
                <span>{row.name}</span>
                <span className={row.overdue >= 5 ? 'is-bad' : undefined}>{row.overdue} overdue</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Temperature mix</h2>
              <p>Open leads by heat (sample)</p>
            </div>
          </header>
          <div className="crm-chart-card__split">
            <div className="crm-chart-card__body crm-chart-card__body--donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={TEMP_MIX}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    stroke="#1c2027"
                    strokeWidth={2}
                  >
                    {TEMP_MIX.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TIP} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="crm-legend-list">
              {TEMP_MIX.map((slice) => {
                const total = TEMP_MIX.reduce((s, x) => s + x.value, 0);
                const share = Math.round((slice.value / total) * 100);
                return (
                  <li key={slice.name}>
                    <span className="crm-legend-list__dot" style={{ background: slice.color }} aria-hidden="true" />
                    <span>{slice.name}</span>
                    <strong>
                      {slice.value} · {share}%
                    </strong>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="crm-chart-card crm-chart-card--wide">
          <header className="crm-chart-card__head">
            <div>
              <h2>Projects in play</h2>
              <p>Open leads, visits, bookings by mandate (sample)</p>
            </div>
            <Link to="/crm/projects" className="crm-chart-card__link">
              Projects →
            </Link>
          </header>
          <div className="crm-chart-card__body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PROJECT_BARS} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#303640" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#a4acb8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#a4acb8', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={CHART_TIP} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#a4acb8' }} />
                <Bar dataKey="leads" name="Open leads" fill="#c5a46d" radius={[6, 6, 0, 0]} />
                <Bar dataKey="visits" name="Visits" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="booked" name="Booked" fill="#f5a524" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Targets vs actual</h2>
              <p>Week / month goals (sample)</p>
            </div>
          </header>
          <div className="crm-bullets">
            {TARGETS.map((row) => {
              const p = pct(row.actual, row.target);
              return (
                <div key={row.label} className="crm-bullet">
                  <div className="crm-bullet__meta">
                    <span>{row.label}</span>
                    <strong>
                      {row.actual}/{row.target} {row.unit}
                    </strong>
                  </div>
                  <div className="crm-bullet__track" aria-hidden="true">
                    <div
                      className={`crm-bullet__fill${p >= 85 ? ' is-good' : p < 55 ? ' is-low' : ''}`}
                      style={{ width: `${p}%` }}
                    />
                    <i className="crm-bullet__mark" style={{ left: '100%' }} />
                  </div>
                  <p className="crm-bullet__pct">{p}% of target</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="crm-dash-lower">
        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Needs attention</h2>
              <p>So you do not have to ask around (sample)</p>
            </div>
          </header>
          <ul className="crm-attention">
            {ATTENTION.map((row) => (
              <li key={row.id} className={`crm-attention__item crm-attention__item--${row.tone}`}>
                <div>
                  <strong>{row.who}</strong>
                  <span>{row.what}</span>
                  <em>
                    {row.project} · {row.when}
                  </em>
                </div>
                <Link to="/crm/leads" className="crm-btn crm-btn--soft crm-btn--open">
                  <ArrowForwardRoundedIcon fontSize="small" aria-hidden="true" />
                  Review
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Project pulse</h2>
              <p>Health and next moves (sample)</p>
            </div>
          </header>
          <div className="crm-pulse-grid">
            {PROJECT_PULSE.map((p) => (
              <article key={p.name} className="crm-pulse">
                <header>
                  <h3>{p.name}</h3>
                  <span className={`crm-pulse__health${p.health < 55 ? ' is-low' : p.health >= 70 ? ' is-good' : ''}`}>
                    {p.health}
                  </span>
                </header>
                <dl className="crm-pulse__stats">
                  <div>
                    <dt>Open</dt>
                    <dd>{p.open}</dd>
                  </div>
                  <div>
                    <dt>Hot</dt>
                    <dd>{p.hot}</dd>
                  </div>
                  <div>
                    <dt>Overdue</dt>
                    <dd>{p.overdue}</dd>
                  </div>
                </dl>
                <p className="crm-pulse__next">{p.next}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Live feed</h2>
              <p>Recent desk moves (sample)</p>
            </div>
          </header>
          <ol className="crm-feed">
            {FEED.map((row) => (
              <li key={row.t + row.text}>
                <time>{row.t}</time>
                <p>{row.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
};

export default CrmDashboard;

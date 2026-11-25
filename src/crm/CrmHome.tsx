import React from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import {
  CRM_ROLE_LABELS,
  crmHomeBlurb,
  isCrmRole,
  stubCrmRoleFromUserType,
  type CrmRole,
} from './crmRoles';

function isLeadership(role: CrmRole) {
  return role === 'sales_manager' || role === 'sales_team_lead' || role === 'crm_admin';
}

type Temp = 'hot' | 'warm' | 'cold';

type SampleRow = {
  id: string;
  name: string;
  project: string;
  stage: string;
  temperature: Temp;
  nextAction: string;
  when: string;
  phone: string;
};

/** Layout-only sample rows for Day 17. Real API wiring is Day 24+. */
const SAMPLE_OVERDUE: SampleRow[] = [
  {
    id: 'l1',
    name: 'Ananya Reddy',
    project: 'Skyline Residences',
    stage: 'Site Visit Done',
    temperature: 'hot',
    nextAction: 'Call · send cost sheet',
    when: 'Yesterday 4:00 pm',
    phone: '9876543210',
  },
  {
    id: 'l2',
    name: 'Vikram Shah',
    project: 'Lakeview Towers',
    stage: 'Proposal Sent',
    temperature: 'warm',
    nextAction: 'Follow up WhatsApp',
    when: 'Mon 11:00 am',
    phone: '9876501234',
  },
];

const SAMPLE_TODAY: SampleRow[] = [
  {
    id: 'l3',
    name: 'Meera Iyer',
    project: 'Skyline Residences',
    stage: 'Qualified',
    temperature: 'warm',
    nextAction: 'Site visit confirm',
    when: 'Today 2:30 pm',
    phone: '9988776655',
  },
  {
    id: 'l4',
    name: 'Rohit Nair',
    project: 'Parkside Avenue',
    stage: 'New Lead',
    temperature: 'cold',
    nextAction: 'First call',
    when: 'Today 5:00 pm',
    phone: '9123456780',
  },
];

const SAMPLE_HOT: SampleRow[] = [
  {
    id: 'l5',
    name: 'Sana Khan',
    project: 'Lakeview Towers',
    stage: 'Negotiation',
    temperature: 'hot',
    nextAction: 'Call · close ask',
    when: 'Needs a move',
    phone: '9012345678',
  },
];

const SAMPLE_NEW: SampleRow[] = [
  {
    id: 'l6',
    name: 'Arjun Patel',
    project: 'Parkside Avenue',
    stage: 'Attempted',
    temperature: 'warm',
    nextAction: 'Not contacted',
    when: 'Arrived today',
    phone: '9090909090',
  },
];

function currentCrmRole() {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

function TempPill({ temperature }: { temperature: Temp }) {
  return (
    <span className={`crm-temp crm-temp--${temperature}`}>
      {temperature}
    </span>
  );
}

function DayRow({ row }: { row: SampleRow }) {
  return (
    <article className="crm-day-row">
      <div className="crm-day-row__main">
        <Link to={`/crm/leads/${row.id}`} className="crm-day-row__name">
          {row.name}
        </Link>
        <p className="crm-day-row__meta">
          {row.project}
          <span aria-hidden="true"> · </span>
          {row.stage}
          <span aria-hidden="true"> · </span>
          <TempPill temperature={row.temperature} />
        </p>
        <p className="crm-day-row__action">
          {row.nextAction}
          <span className="crm-day-row__when"> · {row.when}</span>
        </p>
      </div>
      <div className="crm-day-row__actions">
        <a
          className="crm-btn crm-btn--ghost crm-btn--call"
          href={`tel:+91${row.phone.replace(/\D/g, '').slice(-10)}`}
        >
          <CallRoundedIcon fontSize="small" aria-hidden="true" />
          Call
        </a>
        <a
          className="crm-btn crm-btn--ghost crm-btn--wa"
          href={waLink(row.phone)}
          target="_blank"
          rel="noreferrer"
        >
          <WhatsAppIcon fontSize="small" aria-hidden="true" />
          WhatsApp
        </a>
        <Link to={`/crm/leads/${row.id}`} className="crm-btn crm-btn--soft crm-btn--open">
          <OpenInNewRoundedIcon fontSize="small" aria-hidden="true" />
          Open
        </Link>
      </div>
    </article>
  );
}

function DayPanel({
  title,
  count,
  rows,
  tone,
}: {
  title: string;
  count: number;
  rows: SampleRow[];
  tone?: 'danger' | 'hot' | 'neutral';
}) {
  return (
    <section className={`crm-panel crm-panel--day${tone ? ` crm-panel--${tone}` : ''}`}>
      <div className="crm-panel__head crm-panel__head--split">
        <span>{title}</span>
        <span className="crm-panel__count">{count} sample</span>
      </div>
      {rows.length === 0 ? (
        <div className="crm-panel__empty">Nothing in this bucket yet.</div>
      ) : (
        <div className="crm-day-list">
          {rows.map((row) => (
            <DayRow key={row.id} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Day 17: My Day layout with today / overdue / hot / new cards.
 * Sample rows only. Live API wiring comes later.
 */
const CrmHome: React.FC = () => {
  const crmRole = currentCrmRole();
  const name = (Cookies.get('user_name') || 'Team').trim();

  const overdue = SAMPLE_OVERDUE.length;
  const today = SAMPLE_TODAY.length;
  const hot = SAMPLE_HOT.length;
  const fresh = SAMPLE_NEW.length;

  return (
    <div className="crm-page">
      <nav className="crm-crumbs" aria-label="Breadcrumb">
        <span>Sales CRM</span>
        <span className="crm-crumbs__sep" aria-hidden="true">/</span>
        <span className="crm-crumbs__current">My Day</span>
      </nav>

      <div className="crm-hero">
        <div>
          <p className="crm-kicker">My Day · {CRM_ROLE_LABELS[crmRole]}</p>
          <h1 className="crm-title">Today's desk</h1>
          <p className="crm-sub">
            Hi {name}. {crmHomeBlurb(crmRole)} Sample rows below show the layout only.
          </p>
        </div>
        <div className="crm-hero__actions">
          {isLeadership(crmRole) && (
            <Link to="/crm/dashboard" className="crm-btn">
              Dashboard
            </Link>
          )}
          <Link to="/crm/leads" className={isLeadership(crmRole) ? 'crm-btn crm-btn--ghost' : 'crm-btn'}>
            Open leads
          </Link>
          <Link to="/crm/pipeline" className="crm-btn crm-btn--soft">
            Pipeline
          </Link>
        </div>
      </div>

      <p className="crm-banner" role="note">
        Layout sample. Counts and names are not live data yet.
      </p>

      {(crmRole === 'sales_manager' || crmRole === 'sales_team_lead') && (
        <div className="crm-panel" style={{ marginBottom: 16 }}>
          <div className="crm-panel__head">Team strip · stub</div>
          <div className="crm-strip">
            <div className="crm-strip__cell">
              <strong>—</strong>
              <span>People overdue</span>
            </div>
            <div className="crm-strip__cell">
              <strong>—</strong>
              <span>Fresh uncalled</span>
            </div>
            <div className="crm-strip__cell">
              <strong>—</strong>
              <span>Visits today</span>
            </div>
            <div className="crm-strip__cell crm-strip__cell--link">
              <Link to="/crm/team">Open Team →</Link>
            </div>
          </div>
        </div>
      )}

      <div className="crm-stats">
        <div className="crm-stat crm-stat--danger">
          <span>Overdue</span>
          <strong>{overdue}</strong>
          <em>Missed follow-ups</em>
        </div>
        <div className="crm-stat">
          <span>Due today</span>
          <strong>{today}</strong>
          <em>Next actions for today</em>
        </div>
        <div className="crm-stat crm-stat--hot">
          <span>Hot</span>
          <strong>{hot}</strong>
          <em>Need a move</em>
        </div>
        <div className="crm-stat">
          <span>New / unworked</span>
          <strong>{fresh}</strong>
          <em>New Lead and Attempted</em>
        </div>
      </div>

      <div className="crm-day-grid">
        <DayPanel title="Overdue follow-ups" count={overdue} rows={SAMPLE_OVERDUE} tone="danger" />
        <DayPanel title="Due today" count={today} rows={SAMPLE_TODAY} />
        <DayPanel title="Hot leads" count={hot} rows={SAMPLE_HOT} tone="hot" />
        <DayPanel title="New / not contacted" count={fresh} rows={SAMPLE_NEW} />
      </div>
    </div>
  );
};

export default CrmHome;

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  CRM_ROLE_LABELS,
  crmHomeRoute,
  isCrmRole,
  stubCrmRoleFromUserType,
  type CrmRole,
} from './crmRoles';

type Temp = 'hot' | 'warm' | 'cold';

type LeadRow = {
  id: string;
  name: string;
  phone: string;
  project: string;
  temperature: Temp;
  stage: string;
  source: string;
  followUp: string;
  followUpDue: boolean;
  ageDays: number;
  owner: string;
};

type FilterKey = 'all' | 'hot' | 'warm' | 'cold' | 'overdue';

/** Layout-only sample rows for Day 18. Live API is Day 24+. */
const SAMPLE_LEADS: LeadRow[] = [
  {
    id: 'l1',
    name: 'Ananya Reddy',
    phone: '9876543210',
    project: 'Skyline Residences',
    temperature: 'hot',
    stage: 'Site Visit Done',
    source: 'Meta',
    followUp: 'Today 4:00 pm',
    followUpDue: true,
    ageDays: 6,
    owner: 'me',
  },
  {
    id: 'l2',
    name: 'Vikram Shah',
    phone: '9876501234',
    project: 'Lakeview Towers',
    temperature: 'warm',
    stage: 'Proposal Sent',
    source: 'Website',
    followUp: 'Yesterday 11:00 am',
    followUpDue: true,
    ageDays: 14,
    owner: 'me',
  },
  {
    id: 'l3',
    name: 'Meera Iyer',
    phone: '9988776655',
    project: 'Skyline Residences',
    temperature: 'warm',
    stage: 'Qualified',
    source: 'Referral',
    followUp: 'Tomorrow 2:30 pm',
    followUpDue: false,
    ageDays: 4,
    owner: 'me',
  },
  {
    id: 'l4',
    name: 'Rohit Nair',
    phone: '9123456780',
    project: 'Parkside Avenue',
    temperature: 'cold',
    stage: 'New Lead',
    source: 'Google',
    followUp: 'Not set',
    followUpDue: false,
    ageDays: 1,
    owner: 'me',
  },
  {
    id: 'l5',
    name: 'Sana Khan',
    phone: '9012345678',
    project: 'Lakeview Towers',
    temperature: 'hot',
    stage: 'Negotiation',
    source: 'WhatsApp',
    followUp: 'Today 6:00 pm',
    followUpDue: true,
    ageDays: 21,
    owner: 'me',
  },
  {
    id: 'l6',
    name: 'Arjun Patel',
    phone: '9090909090',
    project: 'Parkside Avenue',
    temperature: 'warm',
    stage: 'Attempted',
    source: 'Manual',
    followUp: 'Fri 10:00 am',
    followUpDue: false,
    ageDays: 3,
    owner: 'me',
  },
  {
    id: 'l7',
    name: 'Divya Rao',
    phone: '9887766554',
    project: 'Orchid Heights',
    temperature: 'cold',
    stage: 'Connected',
    source: 'Channel partner',
    followUp: 'Mon 12:00 pm',
    followUpDue: false,
    ageDays: 9,
    owner: 'peer',
  },
  {
    id: 'l8',
    name: 'Karthik Menon',
    phone: '9776655443',
    project: 'Skyline Residences',
    temperature: 'hot',
    stage: 'Site Visit Planned',
    source: 'Website',
    followUp: 'Sat 11:00 am',
    followUpDue: false,
    ageDays: 5,
    owner: 'peer',
  },
];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hot', label: 'Hot' },
  { key: 'warm', label: 'Warm' },
  { key: 'cold', label: 'Cold' },
  { key: 'overdue', label: 'Overdue follow-up' },
];

function currentCrmRole(): CrmRole {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

function ageLabel(days: number) {
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function TempPill({ temperature }: { temperature: Temp }) {
  return (
    <span className={`crm-temp crm-temp--${temperature}`}>{temperature}</span>
  );
}

/**
 * Day 18: Leads list layout (sample rows).
 * Columns match the visual sample. Live API wiring is Day 24+.
 */
const CrmLeads: React.FC = () => {
  const crmRole = currentCrmRole();
  const home = crmHomeRoute(crmRole);
  const homeLabel = home.includes('dashboard') ? 'Dashboard' : 'My Day';
  const ownOnly = crmRole === 'salesperson';

  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');

  const scoped = useMemo(() => {
    if (ownOnly) return SAMPLE_LEADS.filter((row) => row.owner === 'me');
    return SAMPLE_LEADS;
  }, [ownOnly]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter((row) => {
      if (filter === 'hot' && row.temperature !== 'hot') return false;
      if (filter === 'warm' && row.temperature !== 'warm') return false;
      if (filter === 'cold' && row.temperature !== 'cold') return false;
      if (filter === 'overdue' && !row.followUpDue) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.phone.includes(q) ||
        row.project.toLowerCase().includes(q)
      );
    });
  }, [scoped, filter, query]);

  return (
    <div className="crm-page crm-page--wide">
      <nav className="crm-crumbs" aria-label="Breadcrumb">
        <Link to={home}>{homeLabel}</Link>
        <span className="crm-crumbs__sep" aria-hidden="true">
          /
        </span>
        <span className="crm-crumbs__current">Leads</span>
      </nav>

      <div className="crm-hero">
        <div>
          <p className="crm-kicker">Leads · {CRM_ROLE_LABELS[crmRole]}</p>
          <h1 className="crm-title">Lead list</h1>
          <p className="crm-sub">
            {ownOnly
              ? 'Your leads only. Layout sample for Day 18. Live data wires on Day 24+.'
              : 'Desk list for your scope. Layout sample for Day 18. Live data wires on Day 24+.'}
          </p>
        </div>
        <div className="crm-hero__actions">
          <button type="button" className="crm-btn" disabled title="Hand-create is Day 34">
            Add lead
          </button>
          <Link to="/crm" className="crm-btn crm-btn--ghost">
            My Day
          </Link>
        </div>
      </div>

      <p className="crm-banner" role="note">
        Sample list. {ownOnly ? 'Peer leads are hidden for salesperson.' : 'Includes sample peers for leadership layout.'}{' '}
        Columns: name, project, temperature, stage, source, next follow-up, lead age.
      </p>

      <div className="crm-leads-toolbar">
        <div className="crm-seg" role="group" aria-label="Filter leads">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`crm-seg__btn${filter === item.key ? ' is-on' : ''}`}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="crm-leads-search">
          <span className="crm-sr">Search name, phone, or project</span>
          <SearchRoundedIcon className="crm-leads-search__ico" fontSize="small" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, or project"
          />
        </label>
      </div>

      <div className="crm-leads-meta">
        <span>
          Showing <strong>{rows.length}</strong> of {scoped.length} sample
          {ownOnly ? ' (own only)' : ''}
        </span>
      </div>

      <div className="crm-panel crm-leads-panel">
        <div className="crm-leads-table-wrap">
          <table className="crm-leads-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Project</th>
                <th scope="col">Temp</th>
                <th scope="col">Stage</th>
                <th scope="col">Source</th>
                <th scope="col">Next follow-up</th>
                <th scope="col">Age</th>
                <th scope="col">
                  <span className="crm-sr">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="crm-leads-empty">
                    No sample leads match this filter.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="crm-leads__who">
                        <span className="crm-leads__name">{row.name}</span>
                        <span className="crm-leads__phone">{row.phone}</span>
                      </div>
                    </td>
                    <td>{row.project}</td>
                    <td>
                      <TempPill temperature={row.temperature} />
                    </td>
                    <td>{row.stage}</td>
                    <td>{row.source}</td>
                    <td>
                      <span className={row.followUpDue ? 'crm-leads__due is-due' : 'crm-leads__due'}>
                        {row.followUp}
                      </span>
                    </td>
                    <td>
                      <span className="crm-leads__age">{ageLabel(row.ageDays)}</span>
                    </td>
                    <td>
                      <Link to={`/crm/leads/${row.id}`} className="crm-btn crm-btn--soft">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <ul className="crm-leads-cards" aria-label="Leads on phone">
          {rows.length === 0 ? (
            <li className="crm-leads-empty">No sample leads match this filter.</li>
          ) : (
            rows.map((row) => (
              <li key={row.id} className="crm-leads-card">
                <div className="crm-leads-card__top">
                  <div>
                    <p className="crm-leads__name">{row.name}</p>
                    <p className="crm-leads__phone">{row.phone}</p>
                  </div>
                  <TempPill temperature={row.temperature} />
                </div>
                <p className="crm-leads-card__meta">
                  {row.project}
                  <span aria-hidden="true"> · </span>
                  {row.stage}
                  <span aria-hidden="true"> · </span>
                  {row.source}
                </p>
                <p className="crm-leads-card__meta">
                  Follow-up:{' '}
                  <span className={row.followUpDue ? 'crm-leads__due is-due' : undefined}>
                    {row.followUp}
                  </span>
                  <span aria-hidden="true"> · </span>
                  Age {ageLabel(row.ageDays)}
                </p>
                <div className="crm-leads-card__actions">
                  <Link to={`/crm/leads/${row.id}`} className="crm-btn crm-btn--soft">
                    Open
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default CrmLeads;

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  CRM_ROLE_LABELS,
  CRM_ROLES,
  crmHomeRoute,
  isCrmRole,
  stubCrmRoleFromUserType,
  type CrmRole,
} from './crmRoles';
import { SAMPLE_PEOPLE, SAMPLE_PROJECTS, projectName } from './crmSampleOrg';

function currentCrmRole(): CrmRole {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

const ROLE_WALL: { role: CrmRole; sees: string }[] = [
  {
    role: 'salesperson',
    sees: 'Own leads only. No Team, Projects hub, or peer books.',
  },
  {
    role: 'sales_manager',
    sees: 'Own work plus people who report to them. Cannot open another manager line.',
  },
  {
    role: 'sales_team_lead',
    sees: 'Org on allowed projects. Can open people and Projects hub.',
  },
  {
    role: 'crm_admin',
    sees: 'Same org view for sales settings, roles, and templates. Not ops Users / HR / payments.',
  },
];

const REPORTS_TO = [
  { person: 'Priya', reportsTo: 'Sales manager (sample line)' },
  { person: 'Arjun', reportsTo: 'Sales manager (sample line)' },
  { person: 'Neha', reportsTo: 'Sales manager (sample line)' },
  { person: 'Karan', reportsTo: 'Sales manager (sample line)' },
  { person: 'Meera', reportsTo: 'Sales manager (sample line)' },
  { person: 'Sales manager', reportsTo: 'Sales team lead (sample)' },
  { person: 'Sales team lead', reportsTo: 'CRM Admin' },
];

const TEMPLATES = [
  { key: 'ack_coaching', label: 'Coaching received', status: 'Live' },
  { key: 'ack_consulting', label: 'Consulting received', status: 'Pending' },
  { key: 'nurture_1', label: 'Nurture soft 1', status: 'Draft' },
  { key: 'nurture_2', label: 'Nurture soft 2', status: 'Draft' },
];

const LOST_REASONS = [
  'Budget',
  'Price',
  'Location',
  'Project not suitable',
  'Bought elsewhere',
  'No response',
  'Not interested',
  'Duplicate',
  'Future requirement',
  'Other',
];

const TEAM_TARGETS = [
  { label: 'Calls', target: 420, actual: 368, unit: 'week' },
  { label: 'Connects', target: 180, actual: 151, unit: 'week' },
  { label: 'Site visits', target: 24, actual: 19, unit: 'week' },
  { label: 'Bookings', target: 6, actual: 4, unit: 'month' },
];

const LEADERSHIP_MOVES = [
  'Grant which projects a person may work',
  'Assign or reassign a lead (including take it yourself)',
  'Clear owner → unassigned pool',
  'Set CRM role and reports-to (hierarchy later goes live)',
];

function pct(actual: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((actual / target) * 100));
}

/**
 * Day 21: CRM Admin Settings stub.
 * Roles, reports-to, project access, templates, lost reasons, sample targets, role wall.
 * Not the ops Users screen. Sample data only until hierarchy APIs.
 */
const CrmSettings: React.FC = () => {
  const crmRole = currentCrmRole();
  const home = crmHomeRoute(crmRole);
  const homeLabel = home.includes('dashboard') ? 'Dashboard' : 'My Day';

  if (crmRole !== 'crm_admin') {
    return <Navigate to={home} replace />;
  }

  const salesPeople = SAMPLE_PEOPLE.filter((p) => p.role === 'salesperson');

  return (
    <div className="crm-page crm-page--wide">
      <nav className="crm-crumbs" aria-label="Breadcrumb">
        <Link to={home}>{homeLabel}</Link>
        <span className="crm-crumbs__sep" aria-hidden="true">
          /
        </span>
        <span className="crm-crumbs__current">Settings</span>
      </nav>

      <div className="crm-hero">
        <div>
          <p className="crm-kicker">CRM Admin · Day 21 stub</p>
          <h1 className="crm-title">CRM Admin</h1>
          <p className="crm-sub">
            Roles, access, templates, and sample targets for the sales desk. This is not the ops
            Users screen. One staff login; CRM role decides the desk. Live hierarchy APIs come
            later.
          </p>
        </div>
        <Link to="/crm/dashboard" className="crm-btn crm-btn--ghost">
          Dashboard
        </Link>
      </div>

      <section className="crm-admin-wall" aria-label="Role wall">
        <header>
          <h2>On-screen role wall</h2>
          <p>Visibility rolls up. Never sideways.</p>
        </header>
        <ul className="crm-admin-wall__list">
          {ROLE_WALL.map((row) => (
            <li key={row.role}>
              <strong>{CRM_ROLE_LABELS[row.role]}</strong>
              <span>{row.sees}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="crm-admin-grid">
        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>CRM roles</h2>
              <p>Four seats on this desk (sample)</p>
            </div>
          </header>
          <ul className="crm-admin-chips">
            {CRM_ROLES.map((role) => (
              <li key={role}>
                <span className="crm-admin-chip">{CRM_ROLE_LABELS[role]}</span>
              </li>
            ))}
          </ul>
          <p className="crm-admin-note">
            Ops create the staff account. CRM Admin runs sales org from here when APIs wire.
          </p>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Reports-to</h2>
              <p>Sample hierarchy for Day 21</p>
            </div>
          </header>
          <table className="crm-admin-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Reports to</th>
              </tr>
            </thead>
            <tbody>
              {REPORTS_TO.map((row) => (
                <tr key={row.person}>
                  <td>{row.person}</td>
                  <td>{row.reportsTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Project access</h2>
              <p>Which mandates each person may work (sample)</p>
            </div>
          </header>
          <ul className="crm-admin-access">
            {salesPeople.map((person) => (
              <li key={person.id}>
                <div>
                  <strong>{person.name}</strong>
                  <span>{person.roleLabel}</span>
                </div>
                <p>{person.projects.map((id) => projectName(id)).join(' · ')}</p>
                <Link to={`/crm/team/${person.id}`} className="crm-admin-link">
                  Open person
                </Link>
              </li>
            ))}
          </ul>
          <p className="crm-admin-note">
            Leadership grants project access here. Projects hub:{' '}
            {SAMPLE_PROJECTS.map((p) => p.name).join(', ')}.
          </p>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Leadership moves</h2>
              <p>What CRM Admin / team lead can do (stub copy)</p>
            </div>
          </header>
          <ul className="crm-admin-moves">
            {LEADERSHIP_MOVES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="crm-admin-actions">
            <button type="button" className="crm-btn crm-btn--soft" disabled>
              Assign lead (later)
            </button>
            <button type="button" className="crm-btn crm-btn--soft" disabled>
              Clear owner (later)
            </button>
            <button type="button" className="crm-btn crm-btn--soft" disabled>
              Grant project (later)
            </button>
          </div>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>WhatsApp templates</h2>
              <p>Desk campaign keys (sample status)</p>
            </div>
          </header>
          <table className="crm-admin-table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {TEMPLATES.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td>
                    <span
                      className={`crm-admin-status${
                        row.status === 'Live'
                          ? ' is-live'
                          : row.status === 'Pending'
                            ? ' is-pending'
                            : ''
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Lost reasons</h2>
              <p>Locked list for Booked / Lost (sample)</p>
            </div>
          </header>
          <ul className="crm-admin-chips">
            {LOST_REASONS.map((reason) => (
              <li key={reason}>
                <span className="crm-admin-chip crm-admin-chip--muted">{reason}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="crm-chart-card crm-chart-card--wide">
          <header className="crm-chart-card__head">
            <div>
              <h2>Team targets</h2>
              <p>Calls / visits / bookings (sample). Live targets Day 107.</p>
            </div>
          </header>
          <div className="crm-bullets">
            {TEAM_TARGETS.map((row) => {
              const p = pct(row.actual, row.target);
              return (
                <div key={row.label} className="crm-bullet">
                  <div className="crm-bullet__meta">
                    <span>
                      {row.label} · {row.unit}
                    </span>
                    <strong>
                      {row.actual}/{row.target}
                    </strong>
                  </div>
                  <div className="crm-bullet__track" aria-hidden="true">
                    <div
                      className={`crm-bullet__fill${
                        p >= 85 ? ' is-good' : p < 55 ? ' is-low' : ''
                      }`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <p className="crm-bullet__pct">{p}% of target</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <p className="crm-admin-foot">
        Day 21 shell only. Assign, reports-to, and targets wire after Day 24 APIs. Ops People and
        access stays at /users.
      </p>
    </div>
  );
};

export default CrmSettings;

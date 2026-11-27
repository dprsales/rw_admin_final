import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  CRM_ROLE_LABELS,
  crmHomeRoute,
  isCrmRole,
  stubCrmRoleFromUserType,
  type CrmRole,
} from './crmRoles';
import { projectName, samplePerson } from './crmSampleOrg';

function currentCrmRole(): CrmRole {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

function isLeadership(role: CrmRole) {
  return role === 'sales_manager' || role === 'sales_team_lead' || role === 'crm_admin';
}

/** Day 20: person detail stub (role, projects, overdue, week log, open their My Day). */
const CrmPersonDetail: React.FC = () => {
  const { personId } = useParams();
  const crmRole = currentCrmRole();
  const home = crmHomeRoute(crmRole);
  const homeLabel = home.includes('dashboard') ? 'Dashboard' : 'My Day';
  const person = samplePerson(personId);

  if (!isLeadership(crmRole)) {
    return <Navigate to="/crm" replace />;
  }

  if (!person) {
    return (
      <div className="crm-page crm-page--narrow">
        <nav className="crm-crumbs" aria-label="Breadcrumb">
          <Link to="/crm/team">Team</Link>
          <span className="crm-crumbs__sep" aria-hidden="true">
            /
          </span>
          <span className="crm-crumbs__current">Not found</span>
        </nav>
        <div className="crm-stub-box">
          <strong>Person not in sample</strong>
          That id is not on the Day 20 stub list.
        </div>
        <Link to="/crm/team" className="crm-btn" style={{ marginTop: 16 }}>
          Back to Team
        </Link>
      </div>
    );
  }

  return (
    <div className="crm-page crm-page--wide">
      <nav className="crm-crumbs" aria-label="Breadcrumb">
        <Link to={home}>{homeLabel}</Link>
        <span className="crm-crumbs__sep" aria-hidden="true">
          /
        </span>
        <Link to="/crm/team">Team</Link>
        <span className="crm-crumbs__sep" aria-hidden="true">
          /
        </span>
        <span className="crm-crumbs__current">{person.name}</span>
      </nav>

      <div className="crm-hero">
        <div>
          <p className="crm-kicker">
            Person · {CRM_ROLE_LABELS[crmRole]}
          </p>
          <h1 className="crm-title">{person.name}</h1>
          <p className="crm-sub">
            {person.roleLabel} · sample desk view. Live “open someone’s day” wires on Days 52–53.
          </p>
        </div>
        <div className="crm-hero__actions">
          <Link to="/crm/team" className="crm-btn crm-btn--ghost">
            All team
          </Link>
          <Link to="/crm" className="crm-btn">
            Open their My Day
          </Link>
        </div>
      </div>

      <div className="crm-detail-grid">
        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Desk strip</h2>
              <p>Sample load right now</p>
            </div>
          </header>
          <dl className="crm-org-card__stats crm-org-card__stats--row">
            <div>
              <dt>Open leads</dt>
              <dd>{person.openLeads}</dd>
            </div>
            <div>
              <dt>Hot</dt>
              <dd>{person.hot}</dd>
            </div>
            <div>
              <dt>Overdue</dt>
              <dd className={person.overdue >= 5 ? 'is-bad' : undefined}>
                {person.overdue}
              </dd>
            </div>
          </dl>
          <p className="crm-org-card__meta" style={{ marginTop: 12 }}>
            Mobile {person.mobile} · sample only
          </p>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Projects</h2>
              <p>Mandates this person works</p>
            </div>
          </header>
          <ul className="crm-link-list">
            {person.projects.map((id) => (
              <li key={id}>
                <Link to={`/crm/projects/${id}`}>{projectName(id)}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="crm-chart-card crm-chart-card--wide">
          <header className="crm-chart-card__head">
            <div>
              <h2>Sample week work log</h2>
              <p>What they worked · layout only</p>
            </div>
          </header>
          <ul className="crm-week-log">
            {person.weekLog.map((row) => (
              <li key={row.day}>
                <strong>{row.day}</strong>
                <span>{row.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default CrmPersonDetail;

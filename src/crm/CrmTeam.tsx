import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  CRM_ROLE_LABELS,
  crmHomeRoute,
  isCrmRole,
  stubCrmRoleFromUserType,
  type CrmRole,
} from './crmRoles';
import { SAMPLE_PEOPLE, projectName } from './crmSampleOrg';

function currentCrmRole(): CrmRole {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

function isLeadership(role: CrmRole) {
  return role === 'sales_manager' || role === 'sales_team_lead' || role === 'crm_admin';
}

/** Day 20: Team list cards → person detail stubs. Salesperson never lands here. */
const CrmTeam: React.FC = () => {
  const crmRole = currentCrmRole();
  const home = crmHomeRoute(crmRole);
  const homeLabel = home.includes('dashboard') ? 'Dashboard' : 'My Day';

  if (!isLeadership(crmRole)) {
    return <Navigate to="/crm" replace />;
  }

  return (
    <div className="crm-page crm-page--wide">
      <nav className="crm-crumbs" aria-label="Breadcrumb">
        <Link to={home}>{homeLabel}</Link>
        <span className="crm-crumbs__sep" aria-hidden="true">
          /
        </span>
        <span className="crm-crumbs__current">Team</span>
      </nav>

      <div className="crm-hero">
        <div>
          <p className="crm-kicker">Team · {CRM_ROLE_LABELS[crmRole]}</p>
          <h1 className="crm-title">People on your desk</h1>
          <p className="crm-sub">
            Sample cards for Day 20. Open someone to see role, projects, overdue, and their week
            log. Live hierarchy APIs come later.
          </p>
        </div>
        <Link to="/crm/dashboard" className="crm-btn crm-btn--ghost">
          Dashboard
        </Link>
      </div>

      <div className="crm-org-grid" role="list">
        {SAMPLE_PEOPLE.map((person) => (
          <Link
            key={person.id}
            to={`/crm/team/${person.id}`}
            className="crm-org-card"
            role="listitem"
          >
            <header className="crm-org-card__head">
              <div>
                <h2>{person.name}</h2>
                <p>{person.roleLabel}</p>
              </div>
              <span
                className={`crm-org-card__badge${person.overdue >= 5 ? ' is-bad' : ''}`}
              >
                {person.overdue} overdue
              </span>
            </header>
            <dl className="crm-org-card__stats">
              <div>
                <dt>Open</dt>
                <dd>{person.openLeads}</dd>
              </div>
              <div>
                <dt>Hot</dt>
                <dd>{person.hot}</dd>
              </div>
              <div>
                <dt>Projects</dt>
                <dd>{person.projects.length}</dd>
              </div>
            </dl>
            <p className="crm-org-card__meta">
              {person.projects.map((id) => projectName(id)).join(' · ')}
            </p>
            <span className="crm-org-card__cta">Open person →</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CrmTeam;

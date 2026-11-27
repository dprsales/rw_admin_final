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
import { SAMPLE_PROJECTS } from './crmSampleOrg';

function currentCrmRole(): CrmRole {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

function isLeadership(role: CrmRole) {
  return role === 'sales_manager' || role === 'sales_team_lead' || role === 'crm_admin';
}

/** Day 20: Projects list cards → project detail stubs. Salesperson never lands here. */
const CrmProjects: React.FC = () => {
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
        <span className="crm-crumbs__current">Projects</span>
      </nav>

      <div className="crm-hero">
        <div>
          <p className="crm-kicker">Projects · {CRM_ROLE_LABELS[crmRole]}</p>
          <h1 className="crm-title">Mandates in play</h1>
          <p className="crm-sub">
            Sample cards for Day 20. Open a project for who is assigned, stage counts, recent work,
            and unassigned. Live project home is Days 77+.
          </p>
        </div>
        <Link to="/crm/dashboard" className="crm-btn crm-btn--ghost">
          Dashboard
        </Link>
      </div>

      <div className="crm-org-grid" role="list">
        {SAMPLE_PROJECTS.map((project) => (
          <Link
            key={project.id}
            to={`/crm/projects/${project.id}`}
            className="crm-org-card"
            role="listitem"
          >
            <header className="crm-org-card__head">
              <div>
                <h2>{project.name}</h2>
                <p>{project.next}</p>
              </div>
              <span
                className={`crm-pulse__health${
                  project.health < 55 ? ' is-low' : project.health >= 70 ? ' is-good' : ''
                }`}
              >
                {project.health}
              </span>
            </header>
            <dl className="crm-org-card__stats">
              <div>
                <dt>Open</dt>
                <dd>{project.open}</dd>
              </div>
              <div>
                <dt>Hot</dt>
                <dd>{project.hot}</dd>
              </div>
              <div>
                <dt>Unassigned</dt>
                <dd>{project.unassigned}</dd>
              </div>
            </dl>
            <p className="crm-org-card__meta">
              {project.people.length} people · {project.overdue} overdue
            </p>
            <span className="crm-org-card__cta">Open project →</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CrmProjects;

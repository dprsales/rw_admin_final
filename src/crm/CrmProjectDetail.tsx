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
import { personName, sampleProject } from './crmSampleOrg';

function currentCrmRole(): CrmRole {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

function isLeadership(role: CrmRole) {
  return role === 'sales_manager' || role === 'sales_team_lead' || role === 'crm_admin';
}

/** Day 20: project detail stub (people, stages, recent, unassigned). */
const CrmProjectDetail: React.FC = () => {
  const { projectId } = useParams();
  const crmRole = currentCrmRole();
  const home = crmHomeRoute(crmRole);
  const homeLabel = home.includes('dashboard') ? 'Dashboard' : 'My Day';
  const project = sampleProject(projectId);

  if (!isLeadership(crmRole)) {
    return <Navigate to="/crm" replace />;
  }

  if (!project) {
    return (
      <div className="crm-page crm-page--narrow">
        <nav className="crm-crumbs" aria-label="Breadcrumb">
          <Link to="/crm/projects">Projects</Link>
          <span className="crm-crumbs__sep" aria-hidden="true">
            /
          </span>
          <span className="crm-crumbs__current">Not found</span>
        </nav>
        <div className="crm-stub-box">
          <strong>Project not in sample</strong>
          That id is not on the Day 20 stub list.
        </div>
        <Link to="/crm/projects" className="crm-btn" style={{ marginTop: 16 }}>
          Back to Projects
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
        <Link to="/crm/projects">Projects</Link>
        <span className="crm-crumbs__sep" aria-hidden="true">
          /
        </span>
        <span className="crm-crumbs__current">{project.name}</span>
      </nav>

      <div className="crm-hero">
        <div>
          <p className="crm-kicker">Project · {CRM_ROLE_LABELS[crmRole]}</p>
          <h1 className="crm-title">{project.name}</h1>
          <p className="crm-sub">
            Sample mandate home. Live project pages land on Days 77–83.
          </p>
        </div>
        <div className="crm-hero__actions">
          <Link to="/crm/projects" className="crm-btn crm-btn--ghost">
            All projects
          </Link>
          <Link to="/crm/leads" className="crm-btn">
            Leads
          </Link>
        </div>
      </div>

      <div className="crm-detail-grid">
        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Health strip</h2>
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
          <dl className="crm-org-card__stats crm-org-card__stats--row">
            <div>
              <dt>Open</dt>
              <dd>{project.open}</dd>
            </div>
            <div>
              <dt>Hot</dt>
              <dd>{project.hot}</dd>
            </div>
            <div>
              <dt>Overdue</dt>
              <dd>{project.overdue}</dd>
            </div>
            <div>
              <dt>Unassigned</dt>
              <dd>{project.unassigned}</dd>
            </div>
          </dl>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Who is assigned</h2>
              <p>People on this mandate</p>
            </div>
          </header>
          <ul className="crm-link-list">
            {project.people.map((id) => (
              <li key={id}>
                <Link to={`/crm/team/${id}`}>{personName(id)}</Link>
              </li>
            ))}
          </ul>
          {project.unassigned > 0 && (
            <p className="crm-org-card__meta" style={{ marginTop: 12 }}>
              {project.unassigned} leads still in the open pool for this project (sample).
            </p>
          )}
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Stage counts</h2>
              <p>Sample funnel on this mandate</p>
            </div>
          </header>
          <ul className="crm-mini-table">
            {project.stages.map((row) => (
              <li key={row.label}>
                <span>{row.label}</span>
                <span>{row.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="crm-chart-card">
          <header className="crm-chart-card__head">
            <div>
              <h2>Recent work</h2>
              <p>Sample feed</p>
            </div>
          </header>
          <ul className="crm-feed">
            {project.recent.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default CrmProjectDetail;

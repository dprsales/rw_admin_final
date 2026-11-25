import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  CRM_ROLE_LABELS,
  crmHomeRoute,
  isCrmRole,
  stubCrmRoleFromUserType,
} from './crmRoles';

type Props = {
  title: string;
  blurb: string;
};

function currentCrmRole() {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

const SECTION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  pipeline: 'Pipeline',
  team: 'Team',
  projects: 'Projects',
  settings: 'Settings',
};

/** Placeholder screens so the desk nav walks without ops admin pages. */
const CrmStubPage: React.FC<Props> = ({ title, blurb }) => {
  const crmRole = currentCrmRole();
  const { pathname } = useLocation();
  const section = pathname.split('/').filter(Boolean)[1] ?? '';
  const sectionLabel = SECTION_LABELS[section] ?? title;

  const home = crmHomeRoute(crmRole);
  const homeLabel = home.includes('dashboard') ? 'Dashboard' : 'My Day';

  return (
    <div className="crm-page crm-page--narrow">
      <nav className="crm-crumbs" aria-label="Breadcrumb">
        <Link to={home}>{homeLabel}</Link>
        <span className="crm-crumbs__sep" aria-hidden="true">/</span>
        <span className="crm-crumbs__current">{sectionLabel}</span>
      </nav>

      <div className="crm-page__head">
        <div>
          <p className="crm-kicker">
            Sales CRM · {CRM_ROLE_LABELS[crmRole]}
          </p>
          <h1 className="crm-title">{title}</h1>
          <p className="crm-sub">{blurb}</p>
        </div>
        <Link to={home} className="crm-btn">
          Back to {homeLabel}
        </Link>
      </div>

      <div className="crm-stub-box">
        <strong>Coming on the calendar</strong>
        Screen stub. Layout matches the locked desk. Live build fills this on later days.
      </div>
    </div>
  );
};

export default CrmStubPage;

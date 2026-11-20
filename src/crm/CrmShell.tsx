import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { rwGoldLogo } from '../assets';
import {
  CRM_ROLE_LABELS,
  isCrmRole,
  stubCrmRoleFromUserType,
} from './crmRoles';
import './crm.css';

const NAV = [
  { to: '/crm', label: 'My Day', end: true },
  { to: '/crm/leads', label: 'Leads' },
  { to: '/crm/pipeline', label: 'Pipeline' },
  { to: '/crm/team', label: 'Team' },
  { to: '/crm/projects', label: 'Projects' },
  { to: '/crm/settings', label: 'Settings' },
] as const;

function navActive(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to || pathname === `${to}/`;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function currentCrmRole() {
  const stored = Cookies.get('crm_role');
  if (isCrmRole(stored)) return stored;
  return stubCrmRoleFromUserType(Cookies.get('user_type'));
}

/**
 * Day 14–15 scaffold: sales desk shell only.
 * No HR, payments, blogs, or ops admin sidebar.
 */
const CrmShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const name = (Cookies.get('user_name') || Cookies.get('user_type') || 'Team').trim();
  const crmRole = currentCrmRole();

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_type');
    Cookies.remove('user_name');
    Cookies.remove('crm_role');
    Cookies.remove('rw_service');
    localStorage.clear();
    navigate('/', { replace: true });
  };

  return (
    <div className="crm-root">
      <header className="crm-top">
        <img src={rwGoldLogo} alt="Rajiv Williams" className="crm-top__logo" />
        <div className="crm-top__grow">
          <p className="crm-top__kicker">Team RW · Sales desk</p>
          <p className="crm-top__name">
            {name}
            <span className="crm-top__role"> · {CRM_ROLE_LABELS[crmRole]}</span>
          </p>
        </div>
        <span className="crm-pill">{CRM_ROLE_LABELS[crmRole]}</span>
        <button type="button" className="crm-pill crm-pill--btn" onClick={logout}>
          Sign out
        </button>
      </header>

      <div className="crm-body">
        <nav className="crm-nav" aria-label="CRM">
          {NAV.map((item) => {
            const active = navActive(location.pathname, item.to, 'end' in item && item.end);
            return (
              <Link key={item.to} to={item.to} className={active ? 'is-on' : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="crm-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CrmShell;

import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
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

/**
 * Day 14 scaffold: sales desk shell only.
 * No HR, payments, blogs, or ops admin sidebar.
 */
const CrmShell: React.FC = () => {
  const location = useLocation();
  const name = (Cookies.get('user_name') || Cookies.get('user_type') || 'Team').trim();

  return (
    <div className="crm-root">
      <header className="crm-top">
        <div className="crm-top__grow">
          <p className="crm-top__kicker">Team RW · Sales desk</p>
          <p className="crm-top__name">{name}</p>
        </div>
        <span className="crm-pill">Scaffold</span>
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

import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import { rwGoldLogo } from '../assets';
import {
  CRM_ROLE_LABELS,
  crmNavKeysForRole,
  isCrmRole,
  stubCrmRoleFromUserType,
  type CrmNavKey,
} from './crmRoles';
import './crm.css';

const NAV_BY_KEY: Record<
  CrmNavKey,
  {
    to: string;
    label: string;
    short: string;
    end?: boolean;
    hint: string;
    Icon: SvgIconComponent;
  }
> = {
  dashboard: {
    to: '/crm/dashboard',
    label: 'Dashboard',
    short: 'Dash',
    hint: 'Team pulse',
    Icon: SpaceDashboardRoundedIcon,
  },
  my_day: {
    to: '/crm',
    label: 'My Day',
    short: 'Day',
    end: true,
    hint: "Today's work",
    Icon: TodayRoundedIcon,
  },
  leads: {
    to: '/crm/leads',
    label: 'Leads',
    short: 'Leads',
    hint: 'My list',
    Icon: PeopleAltRoundedIcon,
  },
  pipeline: {
    to: '/crm/pipeline',
    label: 'Pipeline',
    short: 'Pipe',
    hint: 'By stage',
    Icon: ViewKanbanRoundedIcon,
  },
  team: {
    to: '/crm/team',
    label: 'Team',
    short: 'Team',
    hint: 'People',
    Icon: GroupsRoundedIcon,
  },
  projects: {
    to: '/crm/projects',
    label: 'Projects',
    short: 'Proj',
    hint: 'Mandates',
    Icon: ApartmentRoundedIcon,
  },
  settings: {
    to: '/crm/settings',
    label: 'Settings',
    short: 'Set',
    hint: 'CRM Admin',
    Icon: SettingsRoundedIcon,
  },
};

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
 * Sales desk shell (UI locked). Graphite + champagne gold.
 * Phone dock, iPad/laptop sidebar, desktop app frame.
 * See documents/crm/RW-CRM-UI-LOCK.md
 */
const CrmShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const name = (Cookies.get('user_name') || Cookies.get('user_type') || 'Team').trim();
  const crmRole = currentCrmRole();
  const navKeys = crmNavKeysForRole(crmRole);
  const dockKeys = navKeys.slice(0, 5);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('crm-nav-lock', navOpen);
    return () => document.body.classList.remove('crm-nav-lock');
  }, [navOpen]);

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_type');
    Cookies.remove('user_name');
    Cookies.remove('crm_role');
    Cookies.remove('rw_service');
    localStorage.clear();
    navigate('/', { replace: true });
  };

  const renderNavLinks = (mode: 'side' | 'dock') =>
    (mode === 'dock' ? dockKeys : navKeys).map((key) => {
      const item = NAV_BY_KEY[key];
      const active = navActive(location.pathname, item.to, item.end);
      const Icon = item.Icon;
      return (
        <Link
          key={`${mode}-${item.to}`}
          to={item.to}
          className={`crm-nav__link${active ? ' is-on' : ''}`}
          aria-current={active ? 'page' : undefined}
        >
          {mode === 'dock' ? (
            <>
              <span className="crm-nav__icon" aria-hidden="true">
                <Icon fontSize="small" />
              </span>
              <span className="crm-nav__title">{item.short}</span>
            </>
          ) : (
            <>
              <span className="crm-nav__icon" aria-hidden="true">
                <Icon fontSize="small" />
              </span>
              <span className="crm-nav__copy">
                <span className="crm-nav__title">{item.label}</span>
                <span className="crm-nav__hint">{item.hint}</span>
              </span>
            </>
          )}
        </Link>
      );
    });

  return (
    <div className={`crm-root${navOpen ? ' is-nav-open' : ''}`}>
      <header className="crm-top">
        <button
          type="button"
          className="crm-top__menu"
          aria-expanded={navOpen}
          aria-controls="crm-side-nav"
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setNavOpen((open) => !open)}
        >
          {navOpen ? <CloseRoundedIcon fontSize="small" /> : <MenuRoundedIcon fontSize="small" />}
        </button>

        <Link to="/crm" className="crm-top__brand" aria-label="My Day home">
          <img src={rwGoldLogo} alt="" className="crm-top__logo" />
          <div className="crm-top__grow">
            <p className="crm-top__kicker">Team RW · Sales CRM</p>
            <p className="crm-top__name">
              {name}
              <span className="crm-top__role"> · {CRM_ROLE_LABELS[crmRole]}</span>
            </p>
          </div>
        </Link>

        <label className="crm-top__search">
          <span className="crm-sr">Search phone or name</span>
          <SearchRoundedIcon className="crm-top__search-ico" fontSize="small" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search phone or name"
            disabled
            title="Search wires with the leads API"
          />
        </label>

        <span className="crm-pill crm-pill--desk">Desk</span>
        <span className="crm-pill crm-pill--role">{CRM_ROLE_LABELS[crmRole]}</span>
        <button type="button" className="crm-pill crm-pill--btn" onClick={logout}>
          <LogoutRoundedIcon fontSize="inherit" aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </header>

      <div
        className="crm-nav-scrim"
        hidden={!navOpen}
        onClick={() => setNavOpen(false)}
        aria-hidden="true"
      />

      <div className="crm-body">
        <nav id="crm-side-nav" className="crm-nav" aria-label="CRM">
          <p className="crm-nav__label">Workspace</p>
          {renderNavLinks('side')}
          <p className="crm-nav__foot">Sales desk only · no HR or payments</p>
        </nav>

        <main className="crm-main">
          <Outlet />
        </main>
      </div>

      <nav className="crm-dock" aria-label="CRM mobile">
        {renderNavLinks('dock')}
      </nav>
    </div>
  );
};

export default CrmShell;

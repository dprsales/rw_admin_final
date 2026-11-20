import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Admin/Header';
import Tabs, { SIDEBAR_COLLAPSED, SIDEBAR_EXPANDED, TOPBAR_H } from './Admin/Tabs';
import './Layout.css';
import Cookies from 'js-cookie';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { canEnterApp } from '../utils/roles';
import { tokens } from '../Theme/tokens';

const COLLAPSE_KEY = 'rw_admin_sidebar_collapsed';

const Layout = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedTab, setSelectedTab] = useState(() => {
    const path = location.pathname.split('/')[1];
    return `/${path}`;
  });
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const userType = Cookies.get('user_type');

  useEffect(() => {
    const path = location.pathname.split('/')[1];
    setSelectedTab(`/${path}`);
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  if (!canEnterApp(userType)) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: tokens.dangerText }}>Access denied.</div>
    );
  }

  const sidebarWidth = isMobile
    ? 0
    : collapsed
      ? SIDEBAR_COLLAPSED
      : SIDEBAR_EXPANDED;

  return (
    <div
      className="layout-container"
      style={{ '--topbar-h': `${TOPBAR_H}px` } as React.CSSProperties}
    >
      <Header
        selectedTab={selectedTab}
        onMenuClick={() => setMobileOpen((open) => !open)}
        showMenuButton={isMobile}
      />
      <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className="content-container"
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.2s ease',
          height: `calc(100vh - ${TOPBAR_H}px)`,
          overflowY: 'auto',
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;

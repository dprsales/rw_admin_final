import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Admin/Header';
import Tabs from './Admin/Tabs';
import './Layout.css';
import Cookies from 'js-cookie';
import { Box } from '@mui/material';

const Layout = () => {
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState('');
  const userType = Cookies.get('user_type'); 

  useEffect(() => {
    const path = location.pathname.split('/')[1];
    setSelectedTab(`/${path}`);
  }, [location]);

  // Only allow admin
  if (userType !== 'admin') {
    return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>Access Denied. Only admin users are allowed.</div>;
  }

  return (
    <div className="layout-container">
      <Header selectedTab={selectedTab} />
      <Tabs selectedTab={selectedTab} onTabChange={setSelectedTab} />
      <div
        className="content-container"
        style={{
          marginLeft: '200px',
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
// src/components/Tabs.tsx
import React from 'react';
import { Box, Tab, Tabs as MuiTabs, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TabsIcons } from '../../assets'; // Import icons from assets
import Cookies from 'js-cookie'; // To get user type from cookies

// Define tab properties for both user types
interface TabPanelProps {
  icon: string;
  label: string;
  route: string;
}

const adminTabs: TabPanelProps[] = [
  { icon: TabsIcons.DashboardIcon, label: 'Dashboard', route: '/dashboard' },
  { icon: TabsIcons.ProjectsIcon, label: 'Projects', route: '/projects' },
  { icon: TabsIcons.LeadsIcon, label: ' Leads', route: '/leads' },
  // { icon: TabsIcons.UsersIcon, label: 'Users', route: '/users' },
];

interface TabsProps {
  selectedTab: string;
  onTabChange: (route: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ selectedTab, onTabChange }) => {
  const navigate = useNavigate();
  // Only admin tabs
  const tabs = adminTabs;

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
    onTabChange(newValue);
  };

  return (
    <Box
      sx={{
        width: '200px',
        height: 'calc(100vh - 64px)',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '10px',
        position: 'fixed',
        top: '64px',
        left: 0,
        boxShadow: '0 0 8px rgba(0, 0, 0, 0.1)',
        overflowY: 'auto', // Enable vertical scrolling
        overflowX: 'hidden', // Prevent horizontal scrolling
        scrollbarWidth: 'none', // Hide scrollbar for Firefox
        '&::-webkit-scrollbar': {
          display: 'none', // Hide scrollbar for WebKit browsers
        },
      }}
    >
      <MuiTabs
        orientation="vertical"
        value={selectedTab}
        onChange={handleChange}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            value={tab.route}
            icon={
              <img
                src={tab.icon}
                alt={tab.label}
                style={{
                  width: '20px',
                  height: '20px',
                  marginRight: '4px',
                  filter: selectedTab.startsWith(tab.route) ? 'invert(1)' : 'invert(0)',
                  transition: 'filter 0.25s',
                }}
              />
            }
            label={
              <Typography variant="caption" sx={{ color: selectedTab.startsWith(tab.route) ? '#fff' : '#000', marginLeft: "10px" }}>
                {tab.label}
              </Typography>
            }
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              backgroundColor: selectedTab.startsWith(tab.route) ? '#0f63a5' : '#f4f4f4',
              opacity: selectedTab.startsWith(tab.route) ? 1 : 0.8,
              color: selectedTab.startsWith(tab.route) ? '#fff' : '#000',
              borderRadius: '4px',
              height: '48px',
              minHeight: '48px',
              padding: '10px 10px',
              mx: "15px",
              marginBottom: '8px',
              transition: 'background-color 0.2s, opacity 0.2s, color 0.2s',
              '&:hover': {
                backgroundColor: '#0f63a5',
                color: '#fff',
                opacity: 1,
              },
            }}
            iconPosition="start"
          />
        ))}
      </MuiTabs>
    </Box>
  );
};

export default Tabs;

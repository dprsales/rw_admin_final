import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Popover,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import { rwGoldLogo } from '../../assets';
import { adminTabs } from './Tabs';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import {
  canOpenRoute,
  menuAccessFromCookie,
  ROLE_LABELS,
  type UserRole,
} from '../../utils/roles';
import { tokens } from '../../Theme/tokens';

interface HeaderProps {
  selectedTab: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const NOTIFICATIONS_KEY = 'rw_notifications_read';

const Header: React.FC<HeaderProps> = ({
  selectedTab,
  onMenuClick,
  showMenuButton = false,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchAnchor, setSearchAnchor] = useState<HTMLElement | null>(null);
  const [mobileSearchAnchor, setMobileSearchAnchor] = useState<HTMLElement | null>(null);
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [notificationsRead, setNotificationsRead] = useState(() => {
    try {
      return localStorage.getItem(NOTIFICATIONS_KEY) === '1';
    } catch {
      return false;
    }
  });

  const role = Cookies.get('user_type');
  const menus = menuAccessFromCookie(Cookies.get('menu_access'));
  const name = (Cookies.get('user_name') || 'Team RW').trim();
  const roleLabel = role ? ROLE_LABELS[role as UserRole] || role : 'Staff';
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('') || 'RW';

  const tabLabels: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/projects': 'Projects',
    '/leads': 'Leads',
    '/applications': 'Applications',
    '/channel-partners': 'Channel Partners',
    '/vendors': 'Vendor List',
    '/vendor-partners': 'Listed Vendors',
    '/listings': 'Listings',
    '/users': 'Users',
    '/employees': 'Employees',
    '/payments': 'Payments',
    '/blogs': 'Blogs',
    '/gallery': 'Gallery',
  };

  const currentTabLabel = selectedTab.startsWith('/listings')
    ? 'Listings'
    : tabLabels[selectedTab] || 'Dashboard';

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return adminTabs
      .filter((tab) => canOpenRoute(role, tab.route, menus))
      .filter((tab) => tab.label.toLowerCase().includes(query))
      .slice(0, 6);
  }, [search, role, menus]);

  const handleLogout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_type');
    Cookies.remove('user_name');
    Cookies.remove('crm_role');
    Cookies.remove('rw_service');
    Cookies.remove('menu_access');
    Cookies.remove('desk_access');
    Cookies.remove('user_department');
    localStorage.clear();
    navigate('/login');
  };

  const go = (route: string) => {
    navigate(route);
    setSearch('');
    setSearchAnchor(null);
    setMobileSearchAnchor(null);
    setNotifAnchor(null);
    setProfileAnchor(null);
  };

  const markAllRead = () => {
    setNotificationsRead(true);
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const notifications = [
    {
      title: 'Approval queue',
      detail: 'Listings and partner applications need a look.',
      route: '/listings',
      icon: ChecklistRoundedIcon,
      tone: tokens.gold,
      toneSoft: tokens.goldSoft,
    },
    {
      title: 'New applications',
      detail: 'Career resumes are waiting for review.',
      route: '/applications',
      icon: PersonAddAlt1RoundedIcon,
      tone: tokens.goldLight,
      toneSoft: tokens.goldSoft,
    },
    {
      title: 'Payments',
      detail: 'Check collected and pending coaching payments.',
      route: '/payments',
      icon: PaymentsRoundedIcon,
      tone: tokens.successText,
      toneSoft: tokens.successSoft,
    },
  ];

  const renderMatches = () =>
    matches.length > 0 ? (
      matches.map((tab) => {
        const Icon = tab.icon;
        return (
          <MenuItem key={tab.route} onClick={() => go(tab.route)} sx={{ gap: 1.25, py: 1 }}>
            <Icon sx={{ fontSize: 17, color: tokens.goldLight }} />
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{tab.label}</Typography>
          </MenuItem>
        );
      })
    ) : (
      <Typography sx={{ px: 2, py: 1.5, fontSize: 12, color: tokens.textMuted }}>
        No pages match “{search}”.
      </Typography>
    );

  const searchField = (autoFocus = false) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        height: 38,
        px: 1.25,
        borderRadius: '10px',
        bgcolor: tokens.overlay,
        border: `1px solid ${tokens.overlayStrong}`,
        transition: 'border-color 0.18s ease, background-color 0.18s ease',
        '&:focus-within': {
          borderColor: tokens.gold,
          bgcolor: tokens.overlayStrong,
        },
      }}
    >
      <SearchRoundedIcon sx={{ fontSize: 18, color: tokens.textMuted }} />
      <InputBase
        autoFocus={autoFocus}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onFocus={(event) => setSearchAnchor(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && matches[0]) go(matches[0].route);
          if (event.key === 'Escape') {
            setSearch('');
            setSearchAnchor(null);
            setMobileSearchAnchor(null);
          }
        }}
        placeholder="Search pages…"
        inputProps={{ 'aria-label': 'Search pages' }}
        sx={{
          flex: 1,
          color: tokens.text,
          fontSize: 13,
          '& input::placeholder': { color: tokens.textMuted, opacity: 1 },
        }}
      />
    </Box>
  );

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: tokens.topbar,
        borderRadius: 0,
        borderBottom: `1px solid ${tokens.border}`,
        width: '100%',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          {showMenuButton ? (
            <IconButton
              edge="start"
              onClick={onMenuClick}
              aria-label="Open menu"
              sx={{ color: tokens.gold, mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <img
            src={rwGoldLogo}
            alt="Rajiv Williams"
            style={{ marginRight: 16, height: 40, marginLeft: showMenuButton ? 0 : 12 }}
          />
          <Typography
            variant="h6"
            sx={{
              color: tokens.text,
              fontWeight: 650,
              fontSize: { xs: 16, sm: 20 },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentTabLabel}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 0.5 }}>
          <Box sx={{ display: { xs: 'none', md: 'block' }, width: { md: 210, lg: 270 } }}>
            {searchField()}
          </Box>

          <IconButton
            aria-label="Search pages"
            onClick={(event) => setMobileSearchAnchor(event.currentTarget)}
            sx={{ color: tokens.gold, display: { xs: 'inline-flex', md: 'none' } }}
          >
            <SearchRoundedIcon sx={{ fontSize: 21 }} />
          </IconButton>

          <Tooltip title="Notifications">
            <IconButton
              aria-label="Notifications"
              onClick={(event) => setNotifAnchor(event.currentTarget)}
              sx={{ color: tokens.gold }}
            >
              <Badge
                variant="dot"
                invisible={notificationsRead}
                overlap="circular"
                sx={{ '& .MuiBadge-badge': { bgcolor: tokens.gold, border: `2px solid ${tokens.topbar}` } }}
              >
                <NotificationsNoneRoundedIcon sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Button
            onClick={(event) => setProfileAnchor(event.currentTarget)}
            aria-label="Open profile menu"
            sx={{
              ml: 0.5,
              px: { xs: 0.4, sm: 1 },
              py: 0.4,
              minWidth: 0,
              color: tokens.text,
              borderRadius: '10px',
              '&:hover': { bgcolor: tokens.overlay },
            }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: tokens.gold,
                color: tokens.bg,
                fontSize: 11.5,
                fontWeight: 800,
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ display: { xs: 'none', lg: 'block' }, textAlign: 'left', ml: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 650, color: tokens.text, lineHeight: 1.2 }}>
                {name}
              </Typography>
              <Typography sx={{ fontSize: 10, color: tokens.textMuted, lineHeight: 1.2 }}>
                {roleLabel}
              </Typography>
            </Box>
            <KeyboardArrowDownRoundedIcon
              sx={{ fontSize: 18, color: tokens.textMuted, display: { xs: 'none', sm: 'block' } }}
            />
          </Button>
        </Box>
      </Toolbar>

      {/* desktop search results */}
      <Popover
        open={Boolean(searchAnchor) && Boolean(search.trim())}
        anchorEl={searchAnchor}
        onClose={() => setSearchAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocus
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 300,
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: '12px',
              backgroundColor: tokens.panelAlt,
              border: `1px solid ${tokens.border}`,
              boxShadow: tokens.shadow,
              overflow: 'hidden',
            },
          },
        }}
      >
        {renderMatches()}
      </Popover>

      {/* mobile search */}
      <Popover
        open={Boolean(mobileSearchAnchor)}
        anchorEl={mobileSearchAnchor}
        onClose={() => setMobileSearchAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 290,
              maxWidth: 'calc(100vw - 24px)',
              p: 1.25,
              borderRadius: '14px',
              backgroundColor: tokens.panelAlt,
              border: `1px solid ${tokens.border}`,
              boxShadow: tokens.shadow,
            },
          },
        }}
      >
        {searchField(true)}
        <Box sx={{ mt: 1 }}>{search.trim() ? renderMatches() : (
          <Typography sx={{ px: 1, py: 1.5, fontSize: 12, color: tokens.textMuted }}>
            Type a page name to jump there.
          </Typography>
        )}</Box>
      </Popover>

      {/* notifications */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 330,
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: '14px',
              backgroundColor: tokens.panelAlt,
              border: `1px solid ${tokens.border}`,
              boxShadow: tokens.shadow,
            },
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" px={2} py={1}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Notifications</Typography>
            <Typography sx={{ fontSize: 10.5, color: tokens.textMuted }}>
              {notificationsRead ? 'All caught up' : 'A few things need a look'}
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<DoneAllRoundedIcon sx={{ fontSize: 14 }} />}
            onClick={markAllRead}
            disabled={notificationsRead}
            sx={{ fontSize: 10.5, minWidth: 0, px: 0.75 }}
          >
            Mark read
          </Button>
        </Stack>
        <Divider />
        {notifications.map((item) => {
          const Icon = item.icon;
          return (
            <MenuItem
              key={item.title}
              onClick={() => go(item.route)}
              sx={{ alignItems: 'flex-start', gap: 1.25, py: 1.15 }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '9px',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: item.toneSoft,
                  color: item.tone,
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ fontSize: 16 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 650 }}>{item.title}</Typography>
                <Typography sx={{ fontSize: 11, color: tokens.textMuted, lineHeight: 1.35 }}>
                  {item.detail}
                </Typography>
              </Box>
              {!notificationsRead ? (
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tokens.gold, mt: 0.8, ml: 'auto' }} />
              ) : null}
            </MenuItem>
          );
        })}
        <Divider />
        <MenuItem onClick={() => go('/dashboard')} sx={{ gap: 1.25 }}>
          <DashboardRoundedIcon sx={{ fontSize: 17, color: tokens.goldLight }} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Open dashboard</Typography>
        </MenuItem>
      </Menu>

      {/* profile */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 240,
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: '14px',
              backgroundColor: tokens.panelAlt,
              border: `1px solid ${tokens.border}`,
              boxShadow: tokens.shadow,
            },
          },
        }}
      >
        <Box px={2} py={1.25}>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{name}</Typography>
          <Typography sx={{ fontSize: 11, color: tokens.textMuted }}>{roleLabel}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => go('/dashboard')} sx={{ gap: 1.25 }}>
          <DashboardRoundedIcon sx={{ fontSize: 17, color: tokens.goldLight }} />
          <Typography sx={{ fontSize: 12.5 }}>Dashboard</Typography>
        </MenuItem>
        <MenuItem onClick={() => go('/users')} sx={{ gap: 1.25 }}>
          <ChecklistRoundedIcon sx={{ fontSize: 17, color: tokens.goldLight }} />
          <Typography sx={{ fontSize: 12.5 }}>People and access</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ gap: 1.25, color: tokens.dangerText }}>
          <LogoutRoundedIcon sx={{ fontSize: 17 }} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Sign out</Typography>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header;

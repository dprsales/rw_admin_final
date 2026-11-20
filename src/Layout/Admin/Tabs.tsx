import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Drawer,
  useMediaQuery,
} from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { sidebarSkyline } from '../../assets';
import { canOpenRoute } from '../../utils/roles';
import { tokens } from '../../Theme/tokens';

interface TabPanelProps {
  icon: React.ComponentType<SvgIconProps>;
  label: string;
  route: string;
}

/** One icon per screen — no more repeated Dashboard/Leads/Users placeholders. */
export const adminTabs: TabPanelProps[] = [
  { icon: SpaceDashboardRoundedIcon, label: 'Dashboard', route: '/dashboard' },
  { icon: FolderOpenRoundedIcon, label: 'Projects', route: '/projects' },
  { icon: PersonSearchRoundedIcon, label: 'Leads', route: '/leads' },
  { icon: DescriptionRoundedIcon, label: 'Applications', route: '/applications' },
  { icon: HandshakeRoundedIcon, label: 'Channel Partners', route: '/channel-partners' },
  { icon: StorefrontRoundedIcon, label: 'Vendor List', route: '/vendors' },
  { icon: FactCheckRoundedIcon, label: 'Listed Vendors', route: '/vendor-partners' },
  { icon: ApartmentRoundedIcon, label: 'Listings', route: '/listings' },
  { icon: GroupRoundedIcon, label: 'Users', route: '/users' },
  { icon: BadgeRoundedIcon, label: 'Employees', route: '/employees' },
  { icon: PaymentsRoundedIcon, label: 'Payments', route: '/payments' },
  { icon: ArticleRoundedIcon, label: 'Blogs', route: '/blogs' },
  { icon: PhotoLibraryRoundedIcon, label: 'Gallery', route: '/gallery' },
];

interface TabsProps {
  selectedTab: string;
  onTabChange: (route: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/** Brand: black ground, ivory labels, gold only as accent (not every word). */
const BG = tokens.sidebar;
const CHIP = tokens.panel;
const LINE = tokens.border;
const INK = tokens.text;
const MUTED = tokens.textMuted;
const GOLD = tokens.gold;
const EXPANDED = 220;
const COLLAPSED = 72;
/** Single source of truth for the fixed topbar offset (also used by Layout.tsx / Layout.css). */
export const TOPBAR_H = 64;
const MOBILE_DRAWER_WIDTH = 'min(220px, 85vw)';

const Tabs: React.FC<TabsProps> = ({
  selectedTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const role = Cookies.get('user_type');
  const tabs = adminTabs.filter((tab) => canOpenRoute(role, tab.route));
  const width = collapsed && !isMobile ? COLLAPSED : EXPANDED;

  const go = (route: string) => {
    navigate(route);
    onTabChange(route);
    if (isMobile) onMobileClose();
  };

  const navBody = (
    <Box
      sx={{
        width: isMobile ? MOBILE_DRAWER_WIDTH : width,
        height: '100%',
        backgroundColor: BG,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${LINE}`,
        transition: 'width 0.2s ease',
      }}
    >
      {!isMobile && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'space-between',
            alignItems: 'center',
            px: 1.25,
            py: 1.1,
            borderBottom: `1px solid ${LINE}`,
            flexShrink: 0,
            gap: 1,
          }}
        >
          {!collapsed ? (
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: MUTED,
                pl: 0.5,
              }}
            >
              Menu
            </Typography>
          ) : null}
          <Tooltip title={collapsed ? 'Expand menu' : 'Minimise menu'}>
            <IconButton
              onClick={onToggleCollapse}
              size="small"
              sx={{
                color: MUTED,
                border: `1px solid ${LINE}`,
                borderRadius: '8px',
                '&:hover': { color: GOLD, borderColor: GOLD },
              }}
            >
              {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Box
        className="admin-sidebar-scroll"
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1.25,
          px: collapsed && !isMobile ? 0.75 : 1.25,
        }}
      >
        {tabs.map((tab) => {
          const active =
            selectedTab === tab.route ||
            (tab.route !== '/dashboard' && selectedTab.startsWith(tab.route));
          const Icon = tab.icon;

          const item = (
            <Box
              component="button"
              type="button"
              onClick={() => go(tab.route)}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                border: 0,
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: '10px',
                mb: 0.5,
                minHeight: 44,
                px: collapsed && !isMobile ? 1 : 1.35,
                py: 1,
                backgroundColor: active ? CHIP : 'transparent',
                boxShadow: active
                  ? `inset 3px 0 0 ${GOLD}, 0 0 18px ${tokens.goldSoft}`
                  : 'none',
                transition: 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.2s ease',
                '&:hover': {
                  backgroundColor: active ? CHIP : tokens.overlay,
                  '& > svg': { color: GOLD, opacity: 1 },
                },
              }}
            >
              <Icon
                aria-hidden="true"
                sx={{
                  fontSize: 18,
                  flexShrink: 0,
                  color: active ? GOLD : MUTED,
                  opacity: active ? 1 : 0.75,
                  transition: 'color 0.15s ease, opacity 0.15s ease',
                }}
              />
              {(!collapsed || isMobile) && (
                <Typography
                  sx={{
                    fontSize: 13.5,
                    fontWeight: active ? 650 : 500,
                    color: active ? INK : MUTED,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tab.label}
                </Typography>
              )}
            </Box>
          );

          return (
            <Box key={tab.route} sx={{ width: '100%' }}>
              {collapsed && !isMobile ? (
                <Tooltip title={tab.label} placement="right">
                  {item}
                </Tooltip>
              ) : (
                item
              )}
            </Box>
          );
        })}
      </Box>

      {/* Gold skyline — anchored to the sidebar's own bottom, below the scroll area. */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'relative',
          flexShrink: 0,
          height: collapsed && !isMobile ? 92 : 'clamp(104px, 15vh, 156px)',
          backgroundColor: BG,
          backgroundImage: `url(${sidebarSkyline})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 72%',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          opacity: collapsed && !isMobile ? 0.55 : 0.78,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              `linear-gradient(180deg, ${BG} 0%, rgba(11,10,9,0.82) 14%, rgba(11,10,9,0.24) 48%, rgba(11,10,9,0.42) 100%)`,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(11,10,9,0.42) 0%, transparent 20%, transparent 80%, rgba(11,10,9,0.42) 100%)',
          },
        }}
      />
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: MOBILE_DRAWER_WIDTH,
            backgroundColor: BG,
            top: TOPBAR_H,
            height: `calc(100% - ${TOPBAR_H}px)`,
            borderRight: `1px solid ${LINE}`,
          },
        }}
      >
        {navBody}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        width,
        height: `calc(100vh - ${TOPBAR_H}px)`,
        position: 'fixed',
        top: TOPBAR_H,
        left: 0,
        zIndex: theme.zIndex.drawer - 1,
        transition: 'width 0.2s ease',
      }}
    >
      {navBody}
    </Box>
  );
};

export default Tabs;
export { EXPANDED as SIDEBAR_EXPANDED, COLLAPSED as SIDEBAR_COLLAPSED };

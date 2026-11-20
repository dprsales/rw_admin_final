import React from 'react';
import { Box, Breadcrumbs, Link as MuiLink, Stack, Typography } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Link as RouterLink } from 'react-router-dom';
import { tokens } from '../Theme/tokens';

export type Crumb = {
  label: string;
  to?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  homeTo?: string;
};

/**
 * One header pattern for every admin screen: breadcrumbs, title,
 * short description, and the page's own action buttons.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  crumbs = [],
  actions,
  homeTo = '/dashboard',
}) => {
  const trail = [{ label: 'Admin', to: homeTo }, ...crumbs];

  return (
    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
      <Breadcrumbs
        separator={<NavigateNextRoundedIcon sx={{ fontSize: 13, color: tokens.textMuted, opacity: 0.6 }} />}
        sx={{ mb: 1.1, '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
      >
        <MuiLink
          component={RouterLink}
          to={homeTo}
          underline="none"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: 11.5,
            fontWeight: 600,
            color: tokens.textMuted,
            '&:hover': { color: tokens.goldHover },
          }}
        >
          <HomeRoundedIcon sx={{ fontSize: 14 }} />
          Home
        </MuiLink>
        {trail.map((crumb) =>
          crumb.to ? (
            <MuiLink
              key={crumb.label}
              component={RouterLink}
              to={crumb.to}
              underline="none"
              sx={{ fontSize: 11.5, fontWeight: 600, color: tokens.textMuted, '&:hover': { color: tokens.goldHover } }}
            >
              {crumb.label}
            </MuiLink>
          ) : (
            <Typography key={crumb.label} sx={{ fontSize: 11.5, fontWeight: 600, color: tokens.goldHover }}>
              {crumb.label}
            </Typography>
          ),
        )}
      </Breadcrumbs>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={1.5}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, minWidth: 0 }}>
          <Box sx={{ width: 4, height: 34, borderRadius: 2, bgcolor: tokens.gold, mt: 0.3, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 20, sm: 24 },
                fontWeight: 750,
                color: tokens.text,
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            {description ? (
              <Typography sx={{ fontSize: 12.5, color: tokens.textMuted, mt: 0.4, maxWidth: 760 }}>
                {description}
              </Typography>
            ) : null}
          </Box>
        </Box>

        {actions ? (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ flexShrink: 0 }}
          >
            {actions}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
};

export default PageHeader;

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import { tokens } from '../Theme/tokens';

type EmptyStateProps = {
  icon?: React.ComponentType<SvgIconProps>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Friendly empty state with a clear next action. */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <Box sx={{ py: { xs: 6, sm: 9 }, px: 3, textAlign: 'center' }}>
    {Icon ? (
      <Box
        sx={{
          width: 54,
          height: 54,
          borderRadius: '16px',
          display: 'grid',
          placeItems: 'center',
          mx: 'auto',
          mb: 1.5,
          bgcolor: tokens.goldSoft,
          color: tokens.goldHover,
        }}
      >
        <Icon sx={{ fontSize: 26 }} />
      </Box>
    ) : null}
    <Typography sx={{ fontSize: 16, fontWeight: 700, color: tokens.text }}>{title}</Typography>
    {description ? (
      <Typography sx={{ fontSize: 12.5, color: tokens.textMuted, mt: 0.5, maxWidth: 420, mx: 'auto' }}>
        {description}
      </Typography>
    ) : null}
    {actionLabel && onAction ? (
      <Button variant="outlined" size="small" onClick={onAction} sx={{ mt: 2 }}>
        {actionLabel}
      </Button>
    ) : null}
  </Box>
);

export default EmptyState;

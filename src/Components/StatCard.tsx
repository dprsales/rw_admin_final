import React from 'react';
import { Box, Paper, Typography, type SxProps, type Theme } from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import { tokens } from '../Theme/tokens';

type Tone = 'gold' | 'green' | 'red' | 'ink';

const TONES: Record<Tone, { color: string; tint: string }> = {
  gold: { color: tokens.goldHover, tint: tokens.goldSoft },
  green: { color: tokens.successText, tint: tokens.successSoft },
  red: { color: tokens.dangerText, tint: tokens.dangerSoft },
  ink: { color: tokens.textMuted, tint: tokens.overlay },
};

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<SvgIconProps>;
  hint?: string;
  tone?: Tone;
  sx?: SxProps<Theme>;
};

/** Shared metric card: icon, label, one clear number, subtle hover lift. */
const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'gold',
  sx,
}) => {
  const palette = TONES[tone];
  return (
    <Paper
      elevation={0}
      sx={[
        {
          position: 'relative',
          flex: '1 1 160px',
          minWidth: { xs: 140, sm: 160 },
          p: 1.75,
          borderRadius: '14px',
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadowSoft,
          overflow: 'hidden',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderTop: `2px solid ${palette.color}`,
            opacity: 0.55,
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: tokens.gold,
            boxShadow: tokens.shadow,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 650, color: tokens.textMuted, letterSpacing: '0.02em' }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: { xs: 19, sm: 22 }, fontWeight: 750, color: tokens.text, lineHeight: 1.2, mt: 0.5 }}>
            {value}
          </Typography>
          {hint ? (
            <Typography sx={{ fontSize: 10.5, color: tokens.textMuted, mt: 0.35 }}>{hint}</Typography>
          ) : null}
        </Box>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            bgcolor: palette.tint,
            color: palette.color,
          }}
        >
          <Icon sx={{ fontSize: 18 }} />
        </Box>
      </Box>
    </Paper>
  );
};

export default StatCard;

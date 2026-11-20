import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

/** Skeleton card grid for dashboard-style loading. */
export const CardGridSkeleton: React.FC<{ cards?: number; height?: number }> = ({
  cards = 4,
  height = 132,
}) => (
  <Box
    sx={{
      display: 'grid',
      gap: 1.75,
      gridTemplateColumns: {
        xs: 'repeat(2, 1fr)',
        md: `repeat(${Math.min(cards, 4)}, 1fr)`,
      },
    }}
  >
    {Array.from({ length: cards }).map((_, index) => (
      <Skeleton key={index} variant="rounded" height={height} />
    ))}
  </Box>
);

/** Skeleton table body: keeps headers and layout steady while data loads. */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 6,
  columns = 5,
}) => (
  <Box sx={{ p: 2 }}>
    <Stack spacing={1.1}>
      {Array.from({ length: rows }).map((_, row) => (
        <Stack key={row} direction="row" spacing={1.5} alignItems="center">
          {Array.from({ length: columns }).map((__, column) => (
            <Skeleton
              key={column}
              variant="text"
              height={28}
              sx={{ flex: column === 0 ? 1.4 : 1 }}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  </Box>
);

/** Simple page skeleton with a header bar and a large panel. */
export const PageSkeleton: React.FC = () => (
  <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
    <Skeleton variant="text" width={220} height={38} />
    <Skeleton variant="text" width={340} height={20} sx={{ mb: 2 }} />
    <Skeleton variant="rounded" height={260} />
  </Box>
);

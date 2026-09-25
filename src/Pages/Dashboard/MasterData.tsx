import React from 'react';
import { Box, Card, Typography, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { getProjects, getSiteVisitsSummary } from '../../api/services';
import { TabsIcons } from '../../assets';

const formatDay = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
  weekday: 'short', day: '2-digit', month: 'short',
});

const MasterData: React.FC = () => {
  const userType = Cookies.get('user_type');

  const {
    data: ProjectsData,
    isPending,
    isError,
  } = useQuery({ queryKey: ['getProjects'], queryFn: () => getProjects() });

  // DEBUG: Log the actual response to inspect the shape
  console.log('ProjectsData:', ProjectsData);

  // Fallback-safe attempt to extract project count
  const projectCount =
    ProjectsData?.data?.length ??
    ProjectsData?.data?.projects?.length ??
    ProjectsData?.projects?.length ??
    0;

  const { data: visitSummary } = useQuery({
    queryKey: ['site-visits-summary'],
    queryFn: getSiteVisitsSummary,
    // Visits trickle in all day — a stale count is more misleading here than on
    // Projects, so this one refetches on its own instead of waiting for a manual reload.
    refetchInterval: 60_000,
  });

  const items = [
    {
      text: 'Number of Projects',
      number: projectCount,
      image: TabsIcons.ProjectsIcon,
    },
    {
      text: "Today's Visitors",
      number: visitSummary?.today ?? '—',
      image: TabsIcons.UsersIcon,
    },
    {
      text: 'Total Visitors',
      number: visitSummary?.totalUniqueVisitors ?? '—',
      image: TabsIcons.UsersIcon,
    },
  ];

  if (isPending) {
    return (
      <Box sx={{ padding: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ padding: 2 }}>
        <Typography color="error">Failed to load project data.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
        <Box
          sx={{
            background: '#0f63a5',
            borderRadius: '15px',
            width: '4px',
            height: '25px',
            marginRight: 1,
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Master Data
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'flex-start',
        }}
      >
        {items.map((item, index) => (
          <Card
            key={index}
            sx={{
              width: '200px',
              height: '80px',
              background: '#FFFFFF',
              boxShadow: '0px 6px 16px #0A0A0A29',
              display: 'flex',
              alignItems: 'center',
              padding: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'left',
                  flexDirection: 'column',
                  ml: 1,
                  mr: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <img src={item.image} alt="Icon" style={{ height: '20px' }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#888888' }}>
                  {item.text}
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ mr: 2, fontWeight: 'bold' }}>
                {item.number}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      {visitSummary?.last7Days && visitSummary.last7Days.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#888888', mb: 1 }}>
            Visitors, last 7 days
          </Typography>
          <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {visitSummary.last7Days.map((day: { date: string; count: number }) => (
              <Card
                key={day.date}
                sx={{
                  minWidth: 96,
                  px: 2, py: 1.2,
                  background: '#FFFFFF',
                  boxShadow: '0px 4px 10px #0A0A0A1A',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: '#888888', display: 'block' }}>
                  {formatDay(day.date)}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{day.count}</Typography>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MasterData;

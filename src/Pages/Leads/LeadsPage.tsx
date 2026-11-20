import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLeads } from '../../api/services';
import Leads from './Leads';
import NoLeads from './NoLeads';
import { Typography, Box, Paper } from '@mui/material';
import PageHeader from '../../Components/PageHeader';
import { TableSkeleton } from '../../Components/LoadingState';

const LeadsPage: React.FC = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['leads'],
    queryFn: () => getLeads(),
  });

  if (isPending) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <PageHeader
          title="Leads"
          description="Every enquiry from the website, sorted by source and service."
          crumbs={[{ label: 'Leads' }]}
        />
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableSkeleton rows={8} columns={6} />
        </Paper>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography color="error">
          Failed to load leads. Please try again later.
        </Typography>
      </Box> 
    );
  }

  const leads = (data as { leads?: unknown[] } | undefined)?.leads || [];

  // if (!leads.length) {
  //   return <NoLeads />;
  // }

  return <Leads  />;
};

export default LeadsPage;

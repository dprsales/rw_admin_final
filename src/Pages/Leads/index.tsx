import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLeads } from '../../api/services';
import Leads from './Leads';
import NoLeads from './NoLeads';
import { LinearProgress, Typography, Box } from '@mui/material';
import LeadsTable from './LeadsTable';

const LeadsPage: React.FC = () => {
  const { data, isPending, isError } = useQuery({ queryKey: ['leads'], queryFn: getLeads });

  if (isPending) return <LinearProgress />;

  if (isError) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography color="error">
          Failed to load leads. Please try again later.
        </Typography>
      </Box> 
    );
  }

  const leads = data?.data || [];

  // if (!leads.length) {
  //   return <NoLeads />;
  // }

  return <Leads  />;
};

export default LeadsPage;

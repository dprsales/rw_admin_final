// ProjectsPage.tsx

import React from 'react';
import NoProjects from './NoProjects';
import Projects1 from './Projects1';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearProgress } from '@mui/material';
import { getProjects } from '../../api/services';

const ProjectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery({ queryKey: ['getProjects'], queryFn: getProjects });

  // Flatten response
  const mappedProjects = data?.projects?.map((item: any) => ({
    _id: item._id,
    title: item.title?.trim() || '',
    bhk: item.bhk || [],
    towers: item.towers,
    parkingarea: item.parking,
    location: item.location?.trim() || '',
    sqft: item.sqft || [],
    highlights: item.highlights || [],

    projectimage: item.projectimage || '',
    rera: item.rera?.trim() || '',
    date: item.date || 0,
     projectId: item.slug,
  })) || [];

  const handleDataRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['getProjects'] });
  };

  return isPending ? (
    <LinearProgress />
  ) : error ? (
    <div>Something went wrong</div>
  ) : (
    <Projects1 ProjectsData={mappedProjects} onDelete={handleDataRefresh} />
  );

};

export default ProjectsPage;

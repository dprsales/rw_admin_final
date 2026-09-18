// ProjectsPage.tsx

import React, { useState, useEffect } from 'react';
import NoProjects from './NoProjects';
import Projects1 from './Projects1';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { LinearProgress, Box } from '@mui/material';
import { getProjects } from '../../api/services';

const LIMIT = 10;

/** Delay committing the search to the query until the user pauses typing. */
function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const ProjectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isPending, isFetching, isPlaceholderData, error } = useQuery({
    queryKey: ['getProjects', { page, search: debouncedSearch }],
    queryFn: () => getProjects(page, debouncedSearch, LIMIT),
    // Keep the previous list rendered while a new page/search loads — no blank flash.
    placeholderData: keepPreviousData,
  });

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

  const pagination = data?.pagination;

  const handleDataRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['getProjects', { page, search: debouncedSearch }] });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Only the initial load (no data yet) gets the full-page bar; searches/pagination
  // keep the previous table visible instead.
  if (isPending) return <LinearProgress />;
  if (error) return <div>Something went wrong</div>;

  return (
    <>
      <Projects1
        ProjectsData={mappedProjects}
        onDelete={handleDataRefresh}
        page={page}
        totalPages={pagination?.totalPages || 1}
        onPageChange={handlePageChange}
        search={search}
        onSearchChange={handleSearchChange}
        isSearching={isFetching && !isPlaceholderData}
      />
      {isFetching && (
        <Box sx={{ position: 'sticky', bottom: 0, width: '100%', zIndex: 10 }}>
          <LinearProgress />
        </Box>
      )}
    </>
  );
};

export default ProjectsPage;
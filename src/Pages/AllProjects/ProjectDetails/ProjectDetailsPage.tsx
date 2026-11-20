import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProjectDetails } from '../../../api/services';
import { Box, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageHeader from '../../../Components/PageHeader';
import { PageSkeleton } from '../../../Components/LoadingState';
import EmptyState from '../../../Components/EmptyState';
import ProjectDetailsSection from './ProjectDetailsSection';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import GallerySection from './GallerySection';

import LayoutSection from './LayoutSection';
import FloorPlansSection from './FloorPlansSection';
import AmenitiesSection from './AmenitiesSection';
import ConnectedLivingSection from './ConnectedLivingSection';
import AllProjectsDetails from './AllProjectsDetails';



const ProjectDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // ✅ Call hook unconditionally, protect it with `enabled`
  const {
    data,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ['getProjectDetails', slug],
    queryFn: () => getProjectDetails(slug!),
    enabled: !!slug,
  });
  // ✅ Render loading state
  if (isPending) return <PageSkeleton />;

  // ✅ Render error or missing data
  if (error || !data?.data) {
    return (
      <Box>
        <PageHeader
          title="Project details"
          description="Manage the content blocks that appear on this project's public page."
          crumbs={[{ label: 'Projects', to: '/projects' }, { label: 'Project details' }]}
        />
        <Paper sx={{ borderRadius: 3 }}>
          <EmptyState
            title="Project not found"
            description="This project may have been removed or the link is out of date."
            actionLabel="Back to projects"
            onAction={() => navigate('/projects')}
          />
        </Paper>
      </Box>
    );
  }

  const project = data.data;


  return (
    <Box>
      <PageHeader
        title={project.projectdetails?.title || 'Project details'}
        description="Manage the content blocks that appear on this project's public page."
        crumbs={[{ label: 'Projects', to: '/projects' }, { label: 'Project details' }]}
        actions={
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        }
      />

     {project.projectdetails && (
        <ProjectDetailsSection
          data={project.projectdetails}
        />
      )}

      <HeroSection
        slug={slug!}
        refetch={refetch}
        data={project.herosection ?? null}
      />

      <AboutSection
        slug={slug!}
        refetch={refetch}
        data={project.aboutsection ?? null}
      />

        <GallerySection
          slug={slug!}
          refetch={refetch}
          data={project.gallerysection ?? null} // ✅ Fix here
        />
      


        <LayoutSection
          slug={slug!}
          refetch={refetch}
          data={project.layout ?? null}
        />


      
        <FloorPlansSection
          slug={slug!}
          refetch={refetch}
          data={project.floorplans ?? null}
        />
      


        <AmenitiesSection
          slug={slug!}
          refetch={refetch}
          data={project.amenities ?? null}
        />



        <ConnectedLivingSection
          slug={slug!}
          refetch={refetch}
          data={project.connectedliving ?? null}
        />



    </Box>
  );
};

export default ProjectDetailsPage;

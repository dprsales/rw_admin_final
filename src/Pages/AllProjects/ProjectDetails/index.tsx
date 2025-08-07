import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getProjectDetails } from '../../../api/services';
import { LinearProgress, Box, Typography } from '@mui/material';
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

  // ✅ Call hook unconditionally, protect it with `enabled`
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery(['getProjectDetails', slug], () => getProjectDetails(slug!), {
    enabled: !!slug,
  });
console.log("data from query:", data);
  // ✅ Render loading state
  if (isLoading) return <LinearProgress />;

  // ✅ Render error or missing data
  if (error || !data?.data) {
    return <Typography>Something went wrong or no data found</Typography>;
  }

  const project = data.data;


  return (
    <Box>
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

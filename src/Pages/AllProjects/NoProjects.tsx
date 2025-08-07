import React, { useState } from 'react';
import { Box, Typography, Button, styled } from '@mui/material';
import { FeedImages, More, UploadIcon } from '../../assets';
// import AddProjects from '../NewProjects/AddProjects';
// import AddProjects from './AddProjects';

const CenteredBox = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
});

const NoProjects: React.FC = () => {
    const [isAddProjectsOpen, setIsAddProjectsOpen] = useState(false);

    const handleAddProjectsOpen = () => {
        setIsAddProjectsOpen(true);
    };

    const handleAddProjectsClose = () => {
        setIsAddProjectsOpen(false);
    };

    return (
        <>
            <CenteredBox>
                <Box sx={{ textAlign: 'center' }}>
                    <img src={FeedImages.nodata} alt="No Projectss" style={{ height: '65px' }} />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                        There are no Projectss
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<img src={More} alt="Add Builderss" style={{ width: '20px', filter: 'invert(100%)' }} />}
                        sx={{ mt: 1 }}
                        onClick={handleAddProjectsOpen}
                    >
                        Add New Projectss
                    </Button>
                </Box>
            </CenteredBox>

            {/* <AddProjects open={isAddProjectsOpen} onClose={handleAddProjectsClose} /> */}
        </>
    );
};

export default NoProjects;

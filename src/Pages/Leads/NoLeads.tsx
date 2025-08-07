import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const NoLeads: React.FC = () => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100vh"
            textAlign="center"
        >
            <Typography variant="h4" gutterBottom>
                No Leads Available
            </Typography>
            <Typography variant="body1" gutterBottom>
                It looks like there are no leads at the moment. Please check back later.
            </Typography>
            <Button variant="contained" color="primary">
                Refresh
            </Button>
        </Box>
    );
};

export default NoLeads;
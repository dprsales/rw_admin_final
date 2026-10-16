import React from 'react';
import {
    Box,
    Card,
    CardActions,
    CardContent,
    Button,
    Typography,
    Grid,
} from '@mui/material';
import { useState } from 'react';
import axios from 'axios';

interface Integration {
    name: string;
    description: string;
    isConnected: boolean;
}

const integrations: Integration[] = [
    {
        name: 'Facebook',
        description: 'Connect to Facebook to sync your posts and ads.',
        isConnected: false,
    },
    {
        name: 'Google',
        description: 'Integrate with Google for analytics and ads.',
        isConnected: false,
    },
    {
        name: 'Twitter',
        description: 'Connect with Twitter for post scheduling.',
        isConnected: false,
    },
];

const IntegrationPage: React.FC = () => {
    const [integrationStatus, setIntegrationStatus] = useState(integrations);

    const handleConnect = async (name: string) => {
        if (name === 'Facebook') {
            // Redirect user to the backend for Facebook OAuth flow
            window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth/connect`;
            return;
        }

        setIntegrationStatus((prevState) =>
            prevState.map((integration) =>
                integration.name === name
                    ? { ...integration, isConnected: !integration.isConnected }
                    : integration
            )
        );
    };

    const checkFacebookConnection = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/auth/status`
            );
            if (response.data.isConnected) {
                setIntegrationStatus((prevState) =>
                    prevState.map((integration) =>
                        integration.name === 'Facebook'
                            ? { ...integration, isConnected: true }
                            : integration
                    )
                );
            }
        } catch (error) {
            console.error('Error checking Facebook connection status:', error);
        }
    };

    React.useEffect(() => {
        // Check Facebook connection status on component mount
        checkFacebookConnection();
    }, []);

    return (
        <Box sx={{ padding: 4 }}>
            <Typography variant="h4" gutterBottom>
                Integration Page
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
                Manage your integrations below:
            </Typography>
            <Grid container spacing={4}>
                {integrationStatus.map((integration) => (
                    <Grid item xs={12} sm={6} md={4} key={integration.name}>
                        <Card variant="outlined" sx={{ minHeight: 200 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {integration.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {integration.description}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ mt: 2, fontWeight: 'bold' }}
                                    color={
                                        integration.isConnected
                                            ? 'success.main'
                                            : 'error.main'
                                    }
                                >
                                    {integration.isConnected
                                        ? 'Connected'
                                        : 'Not Connected'}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    variant="contained"
                                    color={
                                        integration.isConnected
                                            ? 'secondary'
                                            : 'primary'
                                    }
                                    onClick={() => handleConnect(integration.name)}
                                >
                                    {integration.isConnected
                                        ? 'Disconnect'
                                        : 'Connect'}
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default IntegrationPage;

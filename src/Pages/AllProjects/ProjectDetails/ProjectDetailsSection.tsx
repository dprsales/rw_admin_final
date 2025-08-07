import React, { useState } from 'react';
import { ProjectDetails } from '../ProjectInterface';
import { Box, Typography, IconButton, Paper, Divider, Card, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ProjectDetailsDrawer from '../Drawers/ProjectDetailsDrawer';

interface Props {
    data: ProjectDetails;
}


const CDN_URL = process.env.NEXT_PUBLIC_STORAGE_DN_URL || 'https://dprstorage.b-cdn.net';

const resolveImageUrl = (path: string) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `${CDN_URL}${path}`;
};
const ProjectDetailsSection: React.FC<Props> = ({ data }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [details, setDetails] = useState(data);

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" flexDirection="row" justifyContent="flex-start" alignItems="center">
                <Typography variant="h5" gutterBottom sx={{ fontWeight: '550', mb: 2, textAlign: 'left', mr: 1 }}>
                    <b style={{ color: 'black' }}>Project Details :</b>
                </Typography>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: '600', mb: 2, textAlign: 'left', color: 'primary.main' }}>
                    {data?.title}
                </Typography>
            </Box>
            <Divider sx={{ marginY: 2 }} />
            <Card sx={{ padding: '20px', marginBottom: '20px' }}>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: '600', mb: 2 }}>
                        Main Details
                    </Typography>
                    <IconButton
                        onClick={() => setDrawerOpen(true)}
                        aria-label="edit"
                        sx={{ color: 'primary.main' }}
                    >
                        <EditIcon />
                    </IconButton>
                </Box>
                <Box mt={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Title: <Typography variant="caption">{data?.title}</Typography>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    BHK: <Typography variant="caption">{data.bhk?.join(', ')}</Typography>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Sqft: <Typography variant="caption">{data.sqft?.join(', ')}</Typography>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Visitors: <Typography variant="caption">{data?.visits}</Typography>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Leads: <Typography variant="caption">{data?.leads}</Typography>
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    SFT Price: <Typography variant="caption">{data?.sftPrice}</Typography>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Slug: <Typography variant="caption">{data?.slug}</Typography>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Launch Date: <Typography variant="caption">{data?.launchdate}</Typography>
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Zone: <Typography variant="caption">{data?.zone}</Typography>
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Towers: <Typography variant="caption">{data?.towers}</Typography>
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Parking Area: <Typography variant="caption">{data?.parkingarea}</Typography>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Property Type: <Typography variant="caption">{data?.propertyType}</Typography>
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Street: <Typography variant="caption">{data?.street}</Typography>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                    Location: <Typography variant="caption">{data?.location}</Typography>
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} md={12}>
                        <Box display="flex" flexDirection="column" alignItems="flex-start">
                            <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                Description :
                            </Typography>
                            <Typography variant="caption" paragraph sx={{ textAlign: 'justify' }}>{data.description}</Typography>

                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Box display="flex" flexDirection="column" alignItems="flex-start" mt={2}>
                            <Typography variant="body2" sx={{ fontWeight: '600' }}>
                                Highlights:
                            </Typography>
                            {details.highlights?.items?.length > 0 ? (
                                <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                                    {details.highlights.items.map((highlight, index) => (
                                        <li key={index} style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                            {highlight}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <Typography variant="caption" color="text.secondary">
                                    No highlights available.
                                </Typography>
                            )}
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Box display="flex" flexDirection="column" alignItems="start">
                            <Typography variant="body2" sx={{ fontWeight: '600', textAlign: 'start' }}>
                                Bank Offers:
                            </Typography>
                            <Grid container spacing={2}>
                                {details.bankOffers.map((bank, index) => (
                                    <Grid item xs={12} md={3} key={index}>
                                        <Card sx={{ p: 1, height: '150px' }}>

                                            <Box display="flex" alignItems="center" flexDirection='column' gap={2}>
                                                <img src={resolveImageUrl(bank.bankIcon)} alt={bank.bankName} />
                                                <Typography variant="body2">{bank.bankName}</Typography>
                                            </Box>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Grid>

                </Box>
            </Card>

            <ProjectDetailsDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                initialData={details}
                onSubmit={(newData: ProjectDetails) => {
                    setDetails(newData);
                    setDrawerOpen(false);
                }}
            />
        </Paper>
    );
};

export default ProjectDetailsSection;

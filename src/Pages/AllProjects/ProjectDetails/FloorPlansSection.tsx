import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Grid,
    Card,
    IconButton,
    CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import FloorPlansDrawer from '../Drawers/FloorPlansDrawer';
import { getProjectDetails } from '../../../api/services';

export interface FloorPlan {
    gid: string;
    tower: string;
    bhk: number;
    sft: number;
    facing: string;
    floorplanimage: string;
    tableimage: string;
}

export interface FloorPlans {
    layoutimage: string;
    data: FloorPlan[];
}

interface Props {
    slug: string;
    refetch: () => void;
    data: FloorPlans | null;
}

const CDN_URL = process.env.NEXT_PUBLIC_STORAGE_DN_URL || 'https://dprstorage.b-cdn.net';

const resolveImageUrl = (path: string) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `${CDN_URL}${path}`;
};

const FloorPlansSection: React.FC<Props> = ({ slug, refetch, data }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [floorPlans, setFloorPlans] = useState<FloorPlans | null>(data);
    const [loading, setLoading] = useState(!data);

    useEffect(() => {
        if (!data) {
            fetchData();
        } else {
            setFloorPlans(data);
            setLoading(false);
        }
    }, [data]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getProjectDetails(slug);
            setFloorPlans(res.data.floorplans || null);
        } catch (err) {
            console.error('Failed to fetch floorplans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        fetchData();
        refetch();
    };

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight={550}>Floor Plans</Typography>
                <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: 'primary.main' }}>
                    <EditIcon />
                </IconButton>
            </Box>

            <Divider sx={{ my: 2 }} />

            {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : !floorPlans ? (
                <Typography variant="body2" color="text.secondary">
                    No floor plans available. Click the edit icon to add them.
                </Typography>
            ) : (
                <>
                    {/* Master Layout Image */}
                    <Box>
                        <Typography variant='subtitle1' fontWeight={600} mb={1} textAlign='start'>Master Layout : </Typography>
                    </Box>
                    <Grid container >
                        <Grid item xs={12} md={4} >
                            <Card sx={{ p: 1, mb: 3, height: '150px' }}>
                                <img
                                    src={resolveImageUrl(floorPlans.layoutimage)}
                                    alt="Master Layout"
                                    style={{ borderRadius: 4 }}
                                />
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Floor Plan List */}
                    <Typography variant='subtitle1' fontWeight={600} mb={1} textAlign='start'>Plan Details</Typography>
                    <Grid container spacing={3}>
                        {floorPlans.data.map((item) => (
                            <Grid item xs={12} md={6} key={item.gid}>
                                <Card sx={{ p: 2, }}>
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        {item.tower} - {item.bhk} BHK ({item.facing})
                                    </Typography>
                                    <Box
                                    sx={{
                                        display:'flex',
                                        justifyContent:'center',
                                        alignItems:'center',
                                        gap:4
                                    }}
                                    >
                                         <Typography variant="subtitle2" fontWeight={400} gutterBottom>
                                            gid: {item.gid} 
                                        </Typography>
                                        <Typography variant="subtitle2" fontWeight={400} gutterBottom>
                                            Sqft: {item.sft} sqft
                                        </Typography>
                                       
                                    </Box>
                                    <Grid container spacing={2}>

                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle1" fontWeight={500} textAlign='start'>Floorplan:</Typography>
                                            <Card sx={{ height: '150px' }}>
                                                <img
                                                    src={resolveImageUrl(item.floorplanimage)}
                                                    alt="Floorplan"
                                                    style={{ width: '100%', marginBottom: 12, borderRadius: 4 }}
                                                />
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle1" fontWeight={500} textAlign='start'>Table Image:</Typography>
                                            <Card sx={{ height: '150px' }}>
                                                <img
                                                    src={resolveImageUrl(item.tableimage)}
                                                    alt="Table"
                                                    style={{ width: '100%', borderRadius: 4 }}
                                                />
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}

            {/* Drawer */}
            <FloorPlansDrawer
                open={drawerOpen}
                onClose={handleDrawerClose}
                slug={slug}
                refetch={refetch}
                existingData={floorPlans}
            />
        </Paper>
    );
};

export default FloorPlansSection;

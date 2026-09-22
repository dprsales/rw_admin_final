import React from 'react';
import { Modal, Box, Typography, Button, Grid, Chip } from '@mui/material';
import { Lead, SERVICE_LABEL, SOURCE_LABEL, VISITOR_LABEL } from './Leads';

interface LeadModalProps {
  open: boolean;
  handleClose: () => void;
  lead: Lead;
}

const LeadModal: React.FC<LeadModalProps> = ({ open, handleClose, lead }) => {
  const hasGuidance = Boolean(lead.visitorType || lead.challenge || lead.goal || lead.recommendedService);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="lead-modal-title"
      aria-describedby="lead-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(560px, calc(100vw - 32px))',
          maxHeight: '90vh',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          borderRadius: '10px',
          boxShadow: 24,
          p: 4,
          outline: 'none',
        }}
      >
        {/* Conditional Title for Project Type */}
        <Typography
          id="lead-modal-title"
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 'bold',
            mb: 2,
            color: '#1976d2',
          }}
        >
          {lead.type === 'project' && lead.projectName
            ? `Project Lead Details (Source: ${lead.projectName})`
            : 'Lead Details'}
        </Typography>

        {/* Personal Information */}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Personal Information:
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Typography variant="body2">
              <strong>Name:</strong> {lead.name}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              <strong>Email:</strong> {lead.email}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              <strong>Phone Number:</strong> {lead.phoneNumber}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              <strong>Date:</strong> {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '-'}
            </Typography>
          </Grid>
          {lead.company && (
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Company:</strong> {lead.company}
              </Typography>
            </Grid>
          )}
          <Grid item xs={6}>
            <Typography variant="body2">
              <strong>Source:</strong> {lead.source ? (SOURCE_LABEL[lead.source] || lead.source) : '-'}
              {lead.enquiries && lead.enquiries > 1 ? ` · ${lead.enquiries} enquiries` : ''}
            </Typography>
          </Grid>
        </Grid>

        {/* Guided journey — only present for leads that came through the finder */}
        {hasGuidance && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Guided journey:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {lead.visitorType && <Chip size="small" label={VISITOR_LABEL[lead.visitorType] || lead.visitorType} />}
              {lead.challenge && <Chip size="small" variant="outlined" label={lead.challenge.replace(/_/g, ' ')} />}
              {lead.goal && <Chip size="small" variant="outlined" label={lead.goal.replace(/_/g, ' ')} />}
            </Box>
            {lead.recommendedService && (
              <Typography variant="body2">
                <strong>Recommended:</strong> {SERVICE_LABEL[lead.recommendedService] || lead.recommendedService}
              </Typography>
            )}
          </Box>
        )}

        {/* Project Info for "Project" Type */}
        {lead.type === 'project' && lead.projectName && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Project Information:
            </Typography>
            <Typography variant="body2">
              <strong>Project:</strong> {lead.projectName}
            </Typography>
          </Box>
        )}

        {/* Message */}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Additional Information:
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          <strong>Message:</strong> {lead.message || '-'}
        </Typography>

        {/* Close Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button onClick={handleClose} variant="contained" color="primary">
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default LeadModal;

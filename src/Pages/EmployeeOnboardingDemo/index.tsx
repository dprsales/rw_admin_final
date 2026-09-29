import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';

const steps = ['HR creates candidate', 'Candidate completes details', 'Documents and declaration', 'HR reviews'];

const EmployeeOnboardingDemo: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const next = () => setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  const previous = () => setActiveStep((current) => Math.max(current - 1, 0));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f7fb', px: { xs: 2, md: 5 }, py: { xs: 3, md: 6 } }}>
      <Box sx={{ maxWidth: 980, mx: 'auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#0f63a5' }}>
              Rajiv Williams
            </Typography>
            <Typography variant="body2" color="text.secondary">Employee self-onboarding</Typography>
          </Box>
          <Chip label="DEMO · SAMPLE DATA" color="warning" variant="outlined" />
        </Stack>

        <Alert severity="info" sx={{ mb: 3 }}>
          This is a simple visual demo of the proposed flow. It does not create an employee, send an invitation,
          upload a document or connect to the production API.
        </Alert>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>How onboarding will work</Typography>
            <Typography color="text.secondary" mb={3}>
              HR starts the record, the selected candidate completes their own details, and HR verifies the submission.
            </Typography>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            {activeStep === 0 && (
              <DemoPanel title="1. HR creates a candidate" description="HR enters basic joining information and sends a secure invitation.">
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField fullWidth label="Candidate name" value="Demo Candidate" InputProps={{ readOnly: true }} />
                  <TextField fullWidth label="Personal email" value="candidate@example.com" InputProps={{ readOnly: true }} />
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mt={2}>
                  <TextField fullWidth label="Department" value="Operations" InputProps={{ readOnly: true }} />
                  <TextField fullWidth label="Joining date" value="01 October 2026" InputProps={{ readOnly: true }} />
                </Stack>
                <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: '#fafcff' }}>
                  <Typography variant="body2"><strong>Generated Employee ID:</strong> RW-2026-0001</Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>Next step: send the candidate a secure invitation link.</Typography>
                </Paper>
              </DemoPanel>
            )}

            {activeStep === 1 && (
              <DemoPanel title="2. Candidate completes details" description="The candidate opens the invitation and saves the onboarding form section by section.">
                <LinearProgress variant="determinate" value={45} sx={{ mb: 3, height: 8, borderRadius: 4 }} />
                <Typography variant="body2" color="text.secondary" mb={2}>Demo progress: 45%</Typography>
                <Stack spacing={2}>
                  <TextField label="Full legal name" value="Demo Candidate" InputProps={{ readOnly: true }} />
                  <TextField label="Current address" value="Sample address for demonstration" multiline rows={2} InputProps={{ readOnly: true }} />
                </Stack>
                <Typography variant="caption" display="block" color="text.secondary" mt={2}>In the working version, drafts will be saved securely and the candidate can continue later.</Typography>
              </DemoPanel>
            )}

            {activeStep === 2 && (
              <DemoPanel title="3. Documents and declaration" description="The candidate uploads required documents, reads applicable policies and submits the completed information.">
                <Stack spacing={1.5}>
                  {['PAN card', 'Highest qualification certificate', 'Bank proof'].map((item) => (
                    <Paper key={item} variant="outlined" sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{item}</Typography><Chip size="small" label="Pending" />
                    </Paper>
                  ))}
                </Stack>
                <Divider sx={{ my: 3 }} />
                <Typography variant="body2" color="text.secondary">The final declaration and policy acknowledgements will be recorded with date, time and policy version.</Typography>
              </DemoPanel>
            )}

            {activeStep === 3 && (
              <DemoPanel title="4. HR reviews the submission" description="HR sees the progress, checks documents and can approve or request a correction.">
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Paper variant="outlined" sx={{ p: 2, flex: 1 }}><Typography variant="caption">STATUS</Typography><Typography fontWeight={700}>Pending HR review</Typography></Paper>
                  <Paper variant="outlined" sx={{ p: 2, flex: 1 }}><Typography variant="caption">DOCUMENTS</Typography><Typography fontWeight={700}>3 awaiting review</Typography></Paper>
                  <Paper variant="outlined" sx={{ p: 2, flex: 1 }}><Typography variant="caption">EMPLOYEE ID</Typography><Typography fontWeight={700}>RW-2026-0001</Typography></Paper>
                </Stack>
                <Alert severity="success" sx={{ mt: 3 }}>After approval, the joining form and employee file will be retained securely.</Alert>
              </DemoPanel>
            )}

            <Stack direction="row" justifyContent="space-between" mt={4}>
              <Button variant="outlined" onClick={previous} disabled={activeStep === 0}>Previous</Button>
              {activeStep < steps.length - 1 ? <Button variant="contained" onClick={next}>Show next step</Button> : <Button variant="contained" onClick={() => setActiveStep(0)}>View again</Button>}
            </Stack>
          </CardContent>
        </Card>

        <Typography variant="caption" display="block" color="text.secondary" textAlign="center" mt={3}>
          Demo only · The complete secure workflow is being developed in phases.
        </Typography>
      </Box>
    </Box>
  );
};

const DemoPanel: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <Box>
    <Typography variant="h5" fontWeight={700} gutterBottom>{title}</Typography>
    <Typography color="text.secondary" mb={3}>{description}</Typography>
    {children}
  </Box>
);

export default EmployeeOnboardingDemo;

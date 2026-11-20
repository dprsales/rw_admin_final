import React, { useState } from "react";
import { Typography, TextField, Button, Box, Card, CardContent } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import OTPInput from "otp-input-react";
import { tokens } from "../../Theme/tokens";

interface ForgotPasswordProps {
  setShowForgotPassword: (show: boolean) => void;
  setShowLogin: (show: boolean) => void; // Added this to handle navigation back to login
}

const validationSchema = Yup.object().shape({
  identifier: Yup.string().required("Email or Username is required"),
  otp: Yup.string().required("OTP is required").length(6, "OTP must be 6 digits"),
  newPassword: Yup.string().required("New Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')  // Changed null to undefined
    .required('Confirm Password is required'),
});

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ setShowForgotPassword, setShowLogin }) => {
  const [step, setStep] = useState(1);
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      identifier: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmitIdentifier = (data: any) => {
    setStep(2);
  };

  const onSubmitOTP = (data: any) => {
    setStep(3);
  };

  const onSubmitNewPassword = (data: any) => {
    setShowForgotPassword(false);
    setShowLogin(true); // Navigate back to login
  };

  return (
    <Card sx={{ width: "100%", maxWidth: 400, padding: 2 }}>
      <CardContent>
        {step === 1 && (
          <>
            <Typography variant="h5" sx={{ mb: 4 }}>
              Forgot Password
            </Typography>
            <form onSubmit={handleSubmit(onSubmitIdentifier)}>
              <Controller
                name="identifier"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email or Username"
                    variant="standard"
                    fullWidth
                    autoComplete="username"
                    error={!!errors.identifier}
                    helperText={errors.identifier?.message}
                    sx={{ mb: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
              <Button
                type="button"
                variant="text"
                onClick={() => setShowForgotPassword(false)}
                sx={{ textTransform: "none", mb: 4 }}
              >
                Back to Login
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Send OTP
              </Button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <Typography variant="h5" sx={{ mb: 4 }}>
              Enter OTP
            </Typography>
            <form onSubmit={handleSubmit(onSubmitOTP)}>
              <Controller
                name="otp"
                control={control}
                render={({ field }) => (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                    <OTPInput
                      {...field}
                      value={field.value}
                      onChange={field.onChange}
                      numInputs={6}
                      isInputNum
                      inputStyle={{
                        width: '2rem',
                        height: '2rem',
                        margin: '0 0.5rem',
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        border: `1px solid ${tokens.border}`,
                        borderRadius: '4px',
                        backgroundColor: tokens.input,
                        color: tokens.text,
                      }}
                      containerStyle={{ justifyContent: 'center' }}
                    />
                    {errors.otp && (
                      <Typography color="error" variant="body2" role="alert">
                        {errors.otp.message}
                      </Typography>
                    )}
                  </Box>
                )}
              />
              <Button type="submit" variant="contained" color="primary">
                Verify OTP
              </Button>
              <Button
                type="button"
                variant="text"
                onClick={() => setShowForgotPassword(false)}
                sx={{ textTransform: "none", mb: 2 }}
              >
                Back to Login
              </Button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <Typography variant="h5" sx={{ mb: 4 }}>
              Reset Password
            </Typography>
            <form onSubmit={handleSubmit(onSubmitNewPassword)}>
              <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="New Password"
                    variant="standard"
                    fullWidth
                    type="password"
                    autoComplete="new-password"
                    error={!!errors.newPassword}
                    helperText={errors.newPassword?.message}
                    sx={{ mb: 4 }}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Confirm Password"
                    variant="standard"
                    fullWidth
                    type="password"
                    autoComplete="new-password"
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    sx={{ mb: 4 }}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
              <Button
                type="button"
                variant="text"
                onClick={() => setShowForgotPassword(false)}
                sx={{ textTransform: "none", mb: 4 }}
              >
                Back to Login
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Reset Password
              </Button>
              
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ForgotPassword;

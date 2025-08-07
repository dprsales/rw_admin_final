import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  InputAdornment,
  FormControl,
  FormHelperText,
  InputLabel,
  LinearProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import ForgotPassword from "./ForgotPassword"; // Modal for forgot password
import { authLogin } from "../../api/services"; // API call function for login
import { dprlogo, loginbackground, rwlogo } from "../../assets"; // Logo and background assets
import CustomInput from "../../Components/Inputs/CustomInput"; // Custom input component

// Validation schema for login form
const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email format").required("Login ID is required"),
  password: Yup.string().required("Password is required"),
});

const Login: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [showForgotPassword, setShowForgotPassword] = useState(false); // Show forgot password modal

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  // Mutation to handle login via API
  const { mutate: loginUser, isLoading } = useMutation(authLogin, {
    onSuccess: (response) => {
      try {
        const { access_token, user_profile } = response.data;

        // Only allow admin login
        if (user_profile.usertype === "admin") {
          Cookies.set("access_token", access_token);
          Cookies.set("user_type", user_profile.usertype); 
          Cookies.set("user_name", user_profile.name); 
          toast.success("Login successful!");
          navigate("/dashboard");
        } else {
          toast.error("Only admin users are allowed to log in.");
        }
      } catch (error) {
        console.error("Error processing login response:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast.error("Invalid login credentials. Please try again.");
    },
  });

  // Handle password visibility toggle
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) =>
    event.preventDefault();

  // Form submit handler
  const onSubmit = (data: any) => {
    loginUser({ email: data.email, password: data.password });
  };

  // Handle Forgot Password modal display
  const handleShowForgotPassword = () => setShowForgotPassword(true);
  const handleShowLogin = () => setShowForgotPassword(false);

  console.log("Login Page");

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundImage: `url(${loginbackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: { xs: "center", sm: "flex-end" },
        paddingRight: { xs: 0, sm: "15%", md: "15%", lg: "15%" },
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
      }}
    >
      {showForgotPassword ? (
        <ForgotPassword
          setShowForgotPassword={setShowForgotPassword}
          setShowLogin={handleShowLogin}
        />
      ) : (
        <Card
          sx={{
            width: "100%",
            maxWidth: 270,
            padding: theme.spacing(3),
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.25)",
            borderRadius: "10px",
            backgroundColor: "#ffffffc7",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <CardContent sx={{ width: "100%" }}>
            
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: theme.spacing(2),
              }}
            >
              <img height="40px" src={rwlogo} alt="Logo" style={{ transform: "scale(1.5)" }} />

            </Box>
            <Typography variant="h6" sx={{ mt: 1, mb: 0, fontWeight: "700", textAlign: "left" }}>
              Welcome Back
            </Typography>
            <Typography
              variant="caption"
              paragraph
              sx={{ fontWeight: "400", mb: 2, color: "#555555", textAlign: "left" }}
            >
              Please enter your login details to continue
            </Typography>
            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{ width: "100%", display: "flex", flexDirection: "column" }}
            >
              <FormControl error={!!errors.email} sx={{ mb: 2 }}>
                <InputLabel shrink htmlFor="bootstrap-input" sx={{ left: "-12px !important" }}>
                  Email
                </InputLabel>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <CustomInput {...field} placeholder="Login ID" sx={{ width: "100%" }} />
                  )}
                />
                {errors.email && <FormHelperText>{errors.email.message}</FormHelperText>}
              </FormControl>
              <FormControl error={!!errors.password} sx={{ mb: 2 }}>
                <InputLabel shrink htmlFor="bootstrap-input" sx={{ left: "-12px !important" }}>
                  Password
                </InputLabel>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      {...field}
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      sx={{ width: "100%" }}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  )}
                />
                {errors.password && <FormHelperText>{errors.password.message}</FormHelperText>}
              </FormControl>
              <Typography
                variant="caption"
                color="primary"
                textAlign="right"
                sx={{ cursor: "pointer", mb: 2, "&:hover": { textDecoration: "underline" } }}
                onClick={handleShowForgotPassword}
              >
                Forgot password?
              </Typography>
              <Button type="submit" variant="contained" color="primary" sx={{ mb: 2 }} disabled={isLoading}>
                {isLoading ? <LinearProgress /> : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Login;

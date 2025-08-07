import Cookies from "js-cookie";
import { createBrowserRouter, Navigate } from "react-router-dom";
import {
  Dashboard,
  Login,
  NotFound,
  Integration,
} from "../Pages/Exports";
import Layout from "../Layout/Layout";
import AllProjects from "../Pages/AllProjects";
import ProjectDetails from "../Pages/AllProjects/ProjectDetails";
import Leads from "../Pages/Leads";

// Check if user is authenticated
const isAuthenticated = () => {
  const accessToken = Cookies.get("access_token");
  return accessToken ? true : false;
};

// Check if the user is an admin
const isAdmin = () => {
  return Cookies.get("user_type") === "admin";
};

// Protected Route Component to manage authentication and role-based access
const ProtectedRoute = ({ component, componentType }: any) => {
  const isAuth = isAuthenticated();
  const userIsAdmin = isAdmin();

  if (isAuth) {
    if (componentType === "login" && userIsAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    if (userIsAdmin) {
      return component;
    }
    // If not admin, force logout
    Cookies.remove("access_token");
    Cookies.remove("user_type");
    localStorage.clear();
    return <Navigate to="/login" replace />;
  } else {
    // User is not authenticated
    Cookies.remove("access_token");
    Cookies.remove("user_type");
    localStorage.clear();
    if (componentType === "login") {
      return component;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
};

// Define routes for the app
const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
    errorElement: <NotFound />, // Custom 404 page
  },
  {
    path: "/login",
    element: <ProtectedRoute componentType={"login"} component={<Login />} />,
  },
  {
    element: <Layout />, // Common layout for all pages
    children: [
      {
        path: "/dashboard",
        element: <ProtectedRoute componentType={"admin_dashboard"} component={<Dashboard />} />,
      },

      {
        path: "/projects",
        element: <ProtectedRoute componentType={"projects"} component={<AllProjects />} />,
      },
      {
        path: "/projects/:slug",
        element: <ProtectedRoute componentType={"projects_details"} component={<ProjectDetails />} />,
      },
      {
        path: "/leads",
        element: <ProtectedRoute componentType={"admin_notifications"} component={<Leads/>} />,
      },

      {
        path: "/integrations",
        element: <ProtectedRoute componentType={"integration"} component={<Integration />} />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />, // Catch-all for undefined routes
  },
]);

export default router;
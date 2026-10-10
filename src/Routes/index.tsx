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
import Applications from "../Pages/Applications";
import ChannelPartners from "../Pages/ChannelPartners";
import Users from "../Pages/Users";
import Employees from "../Pages/Employees";
import Payments from "../Pages/Payments";
import EmployeeOnboardingDemo from "../Pages/EmployeeOnboardingDemo";
import { isStaff, roleSatisfies } from "../utils/roles";

// Check if user is authenticated
const isAuthenticated = () => {
  const accessToken = Cookies.get("access_token");
  return accessToken ? true : false;
};

// Check if the user has admin-or-above access (super_admin inherits admin).
const isAdmin = () => {
  return isStaff(Cookies.get("user_type"));
};

// User management is currently super-admin-only. This is a UI guard only — the
// backend `@Roles('super_admin')` decorators are the authority.
const isSuperAdmin = () => {
  return roleSatisfies(Cookies.get("user_type"), "super_admin");
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
      if (componentType === "super_admin_only" && !isSuperAdmin()) {
        return <Navigate to="/dashboard" replace />;
      }
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
    // Public, API-free walkthrough for stakeholder review. Production pages remain protected below.
    path: "/demo/onboarding",
    element: <EmployeeOnboardingDemo />,
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
        path: "/applications",
        element: <ProtectedRoute componentType={"admin_applications"} component={<Applications />} />,
      },
      {
        path: "/channel-partners",
        element: <ProtectedRoute componentType={"admin_channel_partners"} component={<ChannelPartners />} />,
      },
      {
        path: "/users",
        element: <ProtectedRoute componentType={"super_admin_only"} component={<Users />} />,
      },
      {
        path: "/employees",
        element: <ProtectedRoute componentType={"admin_employees"} component={<Employees />} />,
      },
      {
        path: "/payments",
        element: <ProtectedRoute componentType={"admin_payments"} component={<Payments />} />,
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

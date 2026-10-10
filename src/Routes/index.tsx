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
import { canEnterApp, canOpenRoute, homeRoute } from "../utils/roles";

const isAuthenticated = () => Boolean(Cookies.get("access_token"));

const clearSession = () => {
  Cookies.remove("access_token");
  Cookies.remove("user_type");
  Cookies.remove("user_name");
  localStorage.clear();
};

// Screen gate only. The API rejects a role that does not belong on that route.
const ProtectedRoute = ({ component, componentType, allow }: any) => {
  const isAuth = isAuthenticated();
  const role = Cookies.get("user_type");
  const admitted = canEnterApp(role);

  if (isAuth) {
    if (componentType === "login" && admitted) {
      return <Navigate to={homeRoute(role)} replace />;
    }
    if (admitted) {
      if (allow && !canOpenRoute(role, allow)) {
        return <Navigate to={homeRoute(role)} replace />;
      }
      return component;
    }
    clearSession();
    return <Navigate to="/login" replace />;
  }

  clearSession();
  if (componentType === "login") {
    return component;
  }
  return <Navigate to="/login" replace />;
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
        element: <ProtectedRoute allow="/dashboard" component={<Dashboard />} />,
      },

      {
        path: "/projects",
        element: <ProtectedRoute allow="/projects" component={<AllProjects />} />,
      },
      {
        path: "/projects/:slug",
        element: <ProtectedRoute allow="/projects" component={<ProjectDetails />} />,
      },
      {
        path: "/leads",
        element: <ProtectedRoute allow="/leads" component={<Leads />} />,
      },
      {
        path: "/applications",
        element: <ProtectedRoute allow="/applications" component={<Applications />} />,
      },
      {
        path: "/channel-partners",
        element: <ProtectedRoute allow="/channel-partners" component={<ChannelPartners />} />,
      },
      {
        path: "/users",
        element: <ProtectedRoute allow="/users" component={<Users />} />,
      },
      {
        path: "/employees",
        element: <ProtectedRoute allow="/employees" component={<Employees />} />,
      },
      {
        path: "/payments",
        element: <ProtectedRoute allow="/payments" component={<Payments />} />,
      },

      {
        path: "/integrations",
        element: <ProtectedRoute allow="/integrations" component={<Integration />} />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />, // Catch-all for undefined routes
  },
]);

export default router;

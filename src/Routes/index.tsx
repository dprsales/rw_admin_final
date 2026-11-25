import { lazy } from "react";
import Cookies from "js-cookie";
import { createBrowserRouter, Navigate } from "react-router-dom";
import {
  Login,
  NotFound,
  Integration,
} from "../Pages/Exports/pageExports";
import Layout from "../Layout/Layout";
import AllProjects from "../Pages/AllProjects/ProjectsPage";
import ProjectDetails from "../Pages/AllProjects/ProjectDetails/ProjectDetailsPage";
import Leads from "../Pages/Leads/LeadsPage";
import Applications from "../Pages/Applications/Applications";
import ChannelPartners from "../Pages/ChannelPartners/ChannelPartners";
import Vendors, { VendorFormPage } from "../Pages/Vendors/Vendors";
import VendorPartners from "../Pages/VendorPartners/VendorPartners";
import Users from "../Pages/Users/Users";
import Employees from "../Pages/Employees/Employees";
import Payments from "../Pages/Payments/Payments";
import EmployeeOnboardingDemo from "../Pages/EmployeeOnboardingDemo/EmployeeOnboardingDemo";
import Join from "../Pages/Join/Join";
import Blogs from "../Pages/Blogs/Blogs";
import GalleryPhotos from "../Pages/Gallery/GalleryPhotos";
import Listings from "../Pages/Listings/Listings";
import ListingDetail from "../Pages/Listings/ListingDetail";
import { CrmDashboard, CrmHome, CrmLeadDetail, CrmLeads, CrmShell, CrmStubPage, crmHomeRoute, isCrmRole, stubCrmRoleFromUserType } from "../crm";
import ServiceGate from "../Pages/ServiceGate/ServiceGate";
import { canEnterApp, canOpenRoute, homeRoute } from "../utils/roles";

// Charts live only on the dashboard — keep them out of the initial bundle.
const Dashboard = lazy(() => import("../Pages/Dashboard/Dashboard"));

const isAuthenticated = () => Boolean(Cookies.get("access_token"));

const clearSession = () => {
  Cookies.remove("access_token");
  Cookies.remove("user_type");
  Cookies.remove("user_name");
  Cookies.remove("crm_role");
  Cookies.remove("rw_service");
  localStorage.clear();
};

const deskHome = () => {
  const stored = Cookies.get("crm_role");
  const crmRole = isCrmRole(stored)
    ? stored
    : stubCrmRoleFromUserType(Cookies.get("user_type"));
  return crmHomeRoute(crmRole);
};

// Screen gate only. The API rejects a role that does not belong on that route.
const ProtectedRoute = ({ component, componentType, allow }: any) => {
  const isAuth = isAuthenticated();
  const role = Cookies.get("user_type");
  const admitted = canEnterApp(role);
  if (isAuth) {
    if (componentType === "login" && admitted) {
      const preferred = Cookies.get("rw_service");
      if (preferred === "crm" && canOpenRoute(role, "/crm")) {
        return <Navigate to={deskHome()} replace />;
      }
      return <Navigate to={homeRoute(role)} replace />;
    }
    if (admitted) {
      if (allow && !canOpenRoute(role, allow)) {
        return <Navigate to={homeRoute(role)} replace />;
      }
      return component;
    }
    clearSession();
    return <Navigate to="/" replace />;
  }

  clearSession();
  if (componentType === "login") {
    return component;
  }
  if (allow === "/crm") {
    return <Navigate to="/login?service=crm" replace />;
  }
  return <Navigate to="/" replace />;
};

// Define routes for the app
const router = createBrowserRouter([
  {
    path: "/",
    element: <ServiceGate />,
    errorElement: <NotFound />, // Custom 404 page
  },
  {
    path: "/login",
    element: <ProtectedRoute componentType={"login"} component={<Login />} />,
  },
  {
    // Alias: same common login, CRM service selected.
    path: "/crm/login",
    element: <Navigate to="/login?service=crm" replace />,
  },
  {
    // Public, API-free walkthrough for stakeholder review. Production pages remain protected below.
    path: "/demo/onboarding",
    element: <EmployeeOnboardingDemo />,
  },
  {
    // Public invitation landing. The candidate has no staff session.
    path: "/join",
    element: <Join />,
  },
  {
    // Sales CRM desk. Own shell — no ops admin sidebar.
    path: "/crm",
    element: (
      <ProtectedRoute allow="/crm" component={<CrmShell />} />
    ),
    children: [
      { index: true, element: <CrmHome /> },
      { path: "dashboard", element: <CrmDashboard /> },
      { path: "leads", element: <CrmLeads /> },
      { path: "leads/:leadId", element: <CrmLeadDetail /> },
      {
        path: "pipeline",
        element: (
          <CrmStubPage
            title="Pipeline"
            blurb="Stage columns from New Lead to Booked. Shell route is live; board layout comes later."
          />
        ),
      },
      {
        path: "team",
        element: (
          <CrmStubPage
            title="Team"
            blurb="Managers and team leads open people here. Day 20 stub; hierarchy APIs come later."
          />
        ),
      },
      {
        path: "projects",
        element: (
          <CrmStubPage
            title="Projects"
            blurb="Mandate project hub for leadership. Day 20 stub screen."
          />
        ),
      },
      {
        path: "settings",
        element: (
          <CrmStubPage
            title="Settings"
            blurb="CRM Admin settings (roles, access, templates). Not the ops Users screen."
          />
        ),
      },
    ],
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
        path: "/vendors",
        element: <ProtectedRoute allow="/vendors" component={<Vendors />} />,
      },
      {
        path: "/vendor-partners",
        element: <ProtectedRoute allow="/vendor-partners" component={<VendorPartners />} />,
      },
      {
        path: "/vendors/new",
        element: <ProtectedRoute allow="/vendors" component={<VendorFormPage />} />,
      },
      {
        path: "/vendors/:vendorId",
        element: <ProtectedRoute allow="/vendors" component={<VendorFormPage />} />,
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
      {
        path: "/blogs",
        element: <ProtectedRoute allow="/blogs" component={<Blogs />} />,
      },
      {
        path: "/gallery",
        element: <ProtectedRoute allow="/gallery" component={<GalleryPhotos />} />,
      },
      {
        path: "/listings",
        element: <ProtectedRoute allow="/listings" component={<Listings />} />,
      },
      {
        path: "/listings/:id",
        element: <ProtectedRoute allow="/listings" component={<ListingDetail />} />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />, // Catch-all for undefined routes
  },
]);

export default router;

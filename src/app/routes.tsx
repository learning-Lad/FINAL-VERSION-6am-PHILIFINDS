import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { UserDashboard } from "./pages/UserDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { TravelTrends } from "./pages/admin/TravelTrends";
import { AdminLayout } from "./layouts/AdminLayout";
import { TravelPlannerSetup } from "./pages/TravelPlannerSetup";
import { PlacesSelection } from "./pages/PlacesSelection";
import { ScheduleView } from "./pages/ScheduleView";
import { EmergencyContacts } from "./pages/EmergencyContacts";
import { NotFound } from "./pages/NotFound";
import { RootLayout } from "./layouts/RootLayout";
import { AuthGuard } from "./components/AuthGuard";
import { AdminGuard } from "./components/AdminGuard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: LoginPage },
      { path: "signup", Component: SignupPage },
      {
        path: "dashboard",
        element: <AuthGuard />,
        children: [
          { index: true, Component: UserDashboard },
        ],
      },
      {
        path: "admin",
        element: <AdminGuard />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, Component: AdminDashboard },
              { path: "trends", Component: TravelTrends },
              { path: "emergency-contacts", Component: EmergencyContacts },
            ],
          },
        ],
      },
      {
        path: "planner",
        element: <AuthGuard />,
        children: [
          { path: "setup", Component: TravelPlannerSetup },
          { path: "places", Component: PlacesSelection },
          { path: "schedule/:tripId", Component: ScheduleView },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);

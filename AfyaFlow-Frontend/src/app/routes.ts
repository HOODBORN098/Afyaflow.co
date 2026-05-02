import { createBrowserRouter } from "react-router";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { PatientDashboard } from "./pages/PatientDashboard";
import { BookAppointment } from "./pages/BookAppointment";
import { ReceptionistDashboard } from "./pages/ReceptionistDashboard";
import { DoctorDashboard } from "./pages/DoctorDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { QueueManagement } from "./pages/QueueManagement";
import { SetPassword } from "./pages/SetPassword";
import { NotFound } from "./pages/NotFound";
import { StaffRedirect } from "./components/StaffRedirect";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/set-password",
    Component: SetPassword,
  },
  {
    path: "/patient",
    Component: PatientDashboard,
  },
  {
    path: "/book-appointment",
    Component: BookAppointment,
  },
  {
    path: "/receptionist",
    Component: StaffRedirect,
  },
  {
    path: "/doctor",
    Component: StaffRedirect,
  },
  {
    path: "/admin",
    Component: StaffRedirect,
  },
  {
    path: "/queue",
    Component: QueueManagement,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);

import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Dashboard from "./pages/user/Dashboard";
import CreateEvent from "./pages/user/CreateEvent";
import EditEvent from "./pages/user/EditEvent";
import CreateRegistration from "./pages/CreateRegistration";
import RegistrationDetails from "./pages/RegistrationDetails";
import AdminDashboard from "./pages/admin/Dashboard";
import EventDetails from "./pages/EventDetails";
import EventViewerPage from "./pages/EventViewerPage";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />

          {/* User */}
          <Route path="/user/dashboard" element={<Dashboard />} />
          <Route path="/user/create-event" element={<CreateEvent />} />
          <Route
            path="/user/register/:eventId"
            element={<CreateRegistration />}
          />
          <Route path="event/:eventId/edit" element={<EditEvent />} />

          {/* Registrations */}
          <Route
            path="/registration/:registrationId"
            element={<RegistrationDetails />}
          />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Shared Event Page */}
          <Route path="/event/:eventId" element={<EventDetails />} />

          {/* Public Viewer */}
          <Route path="/event/view/:eventId" element={<EventViewerPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

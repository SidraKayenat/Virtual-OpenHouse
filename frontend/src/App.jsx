import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/auth/Login";
import Landing from "./pages/landing/Landing";
import Signup from "./pages/auth/Signup";
import UserDashboard from "./pages/dashboards/UserDashboard";
import CreateEvent from "./pages/event/CreateEvent";
import EditEvent from "./pages/event/EditEvent";
import CreateRegistration from "./pages/registration/CreateRegistration";
import RegistrationDetails from "./pages/registration/RegistrationDetails";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ManageEvent from "./pages/event/ManageEvent";
import EventViewerPage from "./pages/event/EventViewerPage";
import { AuthProvider } from "./context/AuthContext";
import EventDetails from "./pages/event/EventDetails";
import BrowseEvents from "./pages/event/BrowseEvents";
import ProtectedRoute from "./routes/ProtectedRoute";
import MyRegistrations from "./pages/registration/MyRegistrations";
import MyEvents from "./pages/event/MyEvents";
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/events/:eventId" element={<EventDetails />} />
          <Route path="/browseevents" element={<BrowseEvents />} />
          <Route path="/event/view/:eventId" element={<EventViewerPage />} />
          <Route path="/browseevents" element={<BrowseEvents />} />

          {/* User */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/create-event"
            element={
              <ProtectedRoute>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/register/:eventId"
            element={
              <ProtectedRoute>
                <CreateRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/events"
            element={
              <ProtectedRoute>
                <MyEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/registrations"
            element={
              <ProtectedRoute>
                <MyRegistrations />
              </ProtectedRoute>
            }
          />
          <Route path="event/:eventId/edit" element={<EditEvent />} />
          <Route
            path="/registration/:registrationId"
            element={
              <ProtectedRoute>
                <RegistrationDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/manage/:eventId"
            element={
              <ProtectedRoute>
                <ManageEvent />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

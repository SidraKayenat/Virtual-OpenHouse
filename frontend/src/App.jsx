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
import BrowseEvents from "./pages/event/browse/BrowseEvents";
import PublicBrowseEvents from "./pages/event/browse/PublicBrowseEvent";
import ProtectedRoute from "./routes/ProtectedRoute";
import MyRegistrations from "./pages/registration/MyRegistrations";
import MyEvents from "./pages/event/MyEvents";
import MyStalls from "./pages/stall/MyStalls";
import StallEditor from "./pages/stall/StallEditor";
import UpdateRegistration from "./pages/registration/UpdateRegistration";
import UserSettings from "./pages/settings/UserSettings";
import EventRequests from "./pages/event/EventRequests";
import Notifications from "./pages/notifications/Notifications";
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
          <Route path="/publicbrowseevents" element={<PublicBrowseEvents />} />
          <Route path="/event/view/:eventId" element={<EventViewerPage />} />

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
            path="/user/settings"
            element={
              <ProtectedRoute>
                <UserSettings />
              </ProtectedRoute>
            }
          />

          {/* event  */}
          <Route
            path="/user/create-event"
            element={
              <ProtectedRoute>
                <CreateEvent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/browseevents"
            element={
              <ProtectedRoute>
                <BrowseEvents />
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

          <Route path="event/:eventId/edit" element={<EditEvent />} />

          <Route
            path="/event/manage/:eventId"
            element={
              <ProtectedRoute>
                <ManageEvent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/events/requests"
            element={
              <ProtectedRoute>
                <EventRequests />
              </ProtectedRoute>
            }
          ></Route>

          {/* // Notifications  */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* registrations  */}

          <Route
            path="/user/registrations"
            element={
              <ProtectedRoute>
                <MyRegistrations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/registration/:registrationId"
            element={
              <ProtectedRoute>
                <RegistrationDetails />
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
            path="/registration/:registrationId/edit"
            element={
              <ProtectedRoute>
                <UpdateRegistration />
              </ProtectedRoute>
            }
          />

          {/* stalls  */}

          <Route
            path="/user/stalls"
            element={
              <ProtectedRoute>
                <MyStalls />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/stalls/:stallId"
            element={
              <ProtectedRoute>
                <StallEditor />
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

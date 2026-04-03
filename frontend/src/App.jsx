import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/auth/Login";
import Landing from "./pages/landing/Landing";
import Signup from "./pages/auth/Signup";

import EventViewerPage from "./pages/event/EventViewerPage";
import EventDetails from "./pages/event/EventDetails";
import PublicBrowseEvents from "./pages/event/browse/PublicBrowseEvent";

import UserDashboard from "./pages/dashboards/UserDashboard";
import CreateEvent from "./pages/event/CreateEvent";
import MyEvents from "./pages/event/MyEvents";
import EditEvent from "./pages/event/EditEvent";
import ManageEvent from "./pages/event/ManageEvent";
import MyRegistrations from "./pages/registration/MyRegistrations";
import CreateRegistration from "./pages/registration/CreateRegistration";
import RegistrationDetails from "./pages/registration/RegistrationDetails";
import UpdateRegistration from "./pages/registration/UpdateRegistration";
import MyStalls from "./pages/stall/MyStalls";
import StallEditor from "./pages/stall/StallEditor";
import UserSettings from "./pages/settings/UserSettings";
import AllEvents from "./pages/event/EventRequests";
import UserDetails from "./pages/users/UserDetails";
import AllUsers from "./pages/users/AllUsers";
import NotificationsPage from "./pages/notifications/Notifications";
import EventRequests from "./pages/event/EventRequests";
import Notifications from "./pages/notifications/Notifications";

import AdminDashboard from "./pages/dashboards/AdminDashboard";
import EventRequests from "./pages/event/EventRequests";
import AllEvents from "./pages/event/browse/AdminBrowseEvents";

import TeamsAndManagement from "./pages/TeamsAndManagement";
import AdminSettings from "./pages/settings/AdminSettings";
function App() {
  return (
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
          path="/admin/browseevents"
          element={
            <ProtectedRoute>
              <AdminBrowseEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/users"
          element={
            <ProtectedRoute>
              <AllUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/users/:userId"
          element={
            <ProtectedRoute>
              <UserDetails />
            </ProtectedRoute>
          }
        />

        {/* // Notifications  */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* // Teams  */}
        <Route
          path="/admin/teams"
          element={
            <ProtectedRoute>
              <TeamsAndManagement />
            </ProtectedRoute>
          }
        />

        {/* // Settings  */}
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;

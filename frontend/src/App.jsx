import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Dashboard from "./pages/user/Dashboard";
import CreateEvent from "./pages/user/CreateEvent";
import EventViewerPage from "./pages/EventViewerPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/user/dashboard" element={<Dashboard />} />
        <Route path="/user/create-event" element={<CreateEvent />} />
        <Route path="/event/:eventId" element={<EventViewerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

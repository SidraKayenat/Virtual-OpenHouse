import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/login";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

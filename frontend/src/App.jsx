import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

export default function App() {
  const { token } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
      <Route path="/signup" element={!token ? <Signup /> : <Navigate to="/" />} />
    </Routes>
  );
}
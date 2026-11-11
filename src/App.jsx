import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminDashboard from "./pages/admin/AdminDashboard";
import LoginPage from "./pages/LoginPage";

const hasAdminSession = () => {
  const token = localStorage.getItem("token");

  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return Boolean(
      token && ["ADMIN", "SUPER_ADMIN"].includes(user?.role),
    );
  } catch {
    return false;
  }
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(hasAdminSession);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <LoginPage onLogin={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            isAuthenticated ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={isAuthenticated ? "/admin/dashboard" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

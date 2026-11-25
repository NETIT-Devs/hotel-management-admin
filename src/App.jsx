import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminDashboard from "./pages/admin/AdminDashboard";
import LoginPage from "./pages/LoginPage";

const isTokenExpired = (token) => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

const hasAdminSession = () => {
  const token = localStorage.getItem("token");
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return false;
  }

  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return Boolean(["ADMIN", "SUPER_ADMIN"].includes(user?.role));
  } catch {
    return false;
  }
};

// All admin dashboard section routes mapped to their activeSection prop
const ADMIN_ROUTES = [
  { path: "/admin/dashboard", section: "overview" },
  { path: "/admin/bookings", section: "bookings" },
  { path: "/admin/offers", section: "offers" },
  { path: "/admin/promo-codes", section: "promo-codes" },
  { path: "/admin/rooms", section: "rooms" },
  { path: "/admin/facilities", section: "facilities" },
  { path: "/admin/gallery", section: "gallery" },
  { path: "/admin/management", section: "management" },
];

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

        {ADMIN_ROUTES.map(({ path, section }) => (
          <Route
            key={path}
            path={path}
            element={
              isAuthenticated ? (
                <AdminDashboard activeSection={section} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        ))}

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

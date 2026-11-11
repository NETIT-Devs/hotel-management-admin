const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
}/dashboard`;

const dashboardRequest = async (endpoint) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Dashboard API request failed");
  }

  return data;
};

export const getDashboardSummary = () => dashboardRequest("/summary");

export const getRecentBookings = () =>
  dashboardRequest("/recent-bookings");

export const getBookingStats = () => dashboardRequest("/booking-stats");

export const getRoomAvailability = () =>
  dashboardRequest("/room-availability");

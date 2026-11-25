const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getAllBookings = async () => {
  const response = await fetch(`${API_URL}/bookings`, {
    method: "GET",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load bookings");
  }
  return data.bookings || [];
};

export const createBooking = async (payload) => {
  const response = await fetch(`${API_URL}/bookings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create booking");
  }
  return data;
};

export const updateBooking = async (id, payload) => {
  const response = await fetch(`${API_URL}/bookings/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update booking");
  }
  return data;
};

export const updateBookingStatus = async (id, status, adminNote = "") => {
  const response = await fetch(`${API_URL}/bookings/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status, adminNote }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update status");
  }
  return data;
};

export const deleteBooking = async (id) => {
  const response = await fetch(`${API_URL}/bookings/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete booking");
  }
  return data;
};

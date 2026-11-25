/**
 * Facility Admin Service
 * Provides authenticated admin API operations for managing resort facilities
 * and processing guest facility reservations & event inquiries.
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ================= FACILITY CATALOG CRUD =================

export const getAllFacilitiesAdmin = async () => {
  const res = await fetch(`${API_BASE}/facilities`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load facilities");
  return data.facilities || [];
};

export const createFacility = async (payload) => {
  const res = await fetch(`${API_BASE}/facilities`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create facility");
  return data;
};

export const updateFacility = async (id, payload) => {
  const res = await fetch(`${API_BASE}/facilities/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update facility");
  return data;
};

export const toggleFacilityStatus = async (id, status) => {
  const res = await fetch(`${API_BASE}/facilities/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update status");
  return data;
};

export const deleteFacility = async (id) => {
  const res = await fetch(`${API_BASE}/facilities/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete facility");
  return data;
};

// ================= GUEST RESERVATIONS & EVENT INQUIRIES =================

export const getAllFacilityReservationsAdmin = async () => {
  const res = await fetch(`${API_BASE}/facilities/reservations/admin`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to load facility reservations");
  }
  return data.reservations || [];
};

export const updateFacilityReservationStatus = async (id, status, admin_notes) => {
  const res = await fetch(`${API_BASE}/facilities/reservations/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status, admin_notes }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to update reservation status");
  }
  return data;
};

export const deleteFacilityReservation = async (id) => {
  const res = await fetch(`${API_BASE}/facilities/reservations/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to delete reservation");
  }
  return data;
};

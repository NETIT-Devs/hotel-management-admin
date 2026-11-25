const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getAllRoomsAdmin = async () => {
  const response = await fetch(`${API_URL}/rooms?all=true`, {
    method: "GET",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load rooms");
  }
  return data.rooms || [];
};

export const checkAvailability = async ({
  checkIn,
  checkOut,
  guests = 2,
  roomsCount = 1,
}) => {
  const params = new URLSearchParams({
    checkIn: checkIn || "",
    checkOut: checkOut || "",
    guests: String(guests),
    roomsCount: String(roomsCount),
  });
  const response = await fetch(`${API_URL}/rooms/availability?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to check availability");
  }
  return data;
};

export const createRoom = async (payload) => {
  const response = await fetch(`${API_URL}/rooms`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create room");
  }
  return data;
};

export const updateRoom = async (id, payload) => {
  const response = await fetch(`${API_URL}/rooms/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update room");
  }
  return data;
};

export const updateRoomStatus = async (id, status) => {
  const response = await fetch(`${API_URL}/rooms/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update room status");
  }
  return data;
};

export const deleteRoom = async (id) => {
  const response = await fetch(`${API_URL}/rooms/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete room");
  }
  return data;
};

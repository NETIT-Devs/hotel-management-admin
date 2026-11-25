const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getAllOffers = async () => {
  const response = await fetch(`${API_URL}/offers`, {
    method: "GET",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load offers");
  }
  return data.offers || [];
};

export const createOffer = async (payload) => {
  const response = await fetch(`${API_URL}/offers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create offer");
  }
  return data;
};

export const updateOffer = async (id, payload) => {
  const response = await fetch(`${API_URL}/offers/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update offer");
  }
  return data;
};

export const deleteOffer = async (id) => {
  const response = await fetch(`${API_URL}/offers/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete offer");
  }
  return data;
};

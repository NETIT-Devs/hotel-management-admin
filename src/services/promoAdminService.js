const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getAllPromoCodesAdmin = async () => {
  const res = await fetch(`${API_BASE}/promo-codes`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load promo codes");
  return data.promos || [];
};

export const createPromoCode = async (payload) => {
  const res = await fetch(`${API_BASE}/promo-codes`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create promo code");
  return data;
};

export const updatePromoCode = async (id, payload) => {
  const res = await fetch(`${API_BASE}/promo-codes/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update promo code");
  return data;
};

export const togglePromoCodeStatus = async (id, status) => {
  const res = await fetch(`${API_BASE}/promo-codes/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update status");
  return data;
};

export const deletePromoCode = async (id) => {
  const res = await fetch(`${API_BASE}/promo-codes/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete promo code");
  return data;
};

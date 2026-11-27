/**
 * Admin Reviews Moderation Service
 * Communicates with /api/reviews/admin endpoints.
 */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getAllReviewsAdmin = async (status = "ALL") => {
  const query = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(`${API_URL}/reviews/admin${query}`, {
    method: "GET",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load reviews.");
  }
  return data;
};

export const updateReviewModeration = async (id, payload) => {
  const response = await fetch(`${API_URL}/reviews/admin/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update review.");
  }
  return data;
};

export const deleteReviewAdmin = async (id) => {
  const response = await fetch(`${API_URL}/reviews/admin/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete review.");
  }
  return data;
};

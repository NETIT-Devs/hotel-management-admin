const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getAllAdmins = async () => {
  const response = await fetch(`${API_URL}/admins`, {
    method: "GET",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load admin accounts");
  }
  return data.admins || [];
};

export const createAdmin = async (payload) => {
  const response = await fetch(`${API_URL}/admins`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create admin account");
  }
  return data;
};

export const updateAdmin = async (id, payload) => {
  const response = await fetch(`${API_URL}/admins/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update admin account");
  }
  return data;
};

export const toggleAdminStatus = async (id, isActive) => {
  const response = await fetch(`${API_URL}/admins/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(
      isActive !== undefined ? { is_active: isActive } : {}
    ),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update admin status");
  }
  return data;
};

export const deleteAdmin = async (id) => {
  const response = await fetch(`${API_URL}/admins/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete admin account");
  }
  return data;
};

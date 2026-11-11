const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const loginAdmin = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to sign in.");
  }

  if (!["ADMIN", "SUPER_ADMIN"].includes(data.user?.role)) {
    throw new Error("This account does not have admin access.");
  }

  return data;
};

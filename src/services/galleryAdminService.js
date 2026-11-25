const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAllGalleryAdmin = async () => {
  const res = await fetch(`${API_BASE}/gallery?all=true`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load gallery");
  return data.items || [];
};

export const createGalleryItem = async ({
  title,
  category,
  caption,
  is_featured,
  status,
  image_url,
  file,
}) => {
  const form = new FormData();
  form.append("title", title);
  form.append("category", category);
  if (caption) form.append("caption", caption);
  form.append("is_featured", is_featured ? "1" : "0");
  form.append("status", status || "ACTIVE");
  if (file) {
    form.append("image", file);
  } else if (image_url) {
    form.append("image_url", image_url);
  }

  const res = await fetch(`${API_BASE}/gallery`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to add photo");
  return data;
};

export const updateGalleryItem = async (
  id,
  { title, category, caption, is_featured, status, image_url, file }
) => {
  const form = new FormData();
  form.append("title", title);
  form.append("category", category);
  form.append("caption", caption || "");
  form.append("is_featured", is_featured ? "1" : "0");
  form.append("status", status || "ACTIVE");
  if (file) {
    form.append("image", file);
  } else if (image_url) {
    form.append("image_url", image_url);
  }

  const res = await fetch(`${API_BASE}/gallery/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update photo");
  return data;
};

export const deleteGalleryItem = async (id) => {
  const res = await fetch(`${API_BASE}/gallery/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete photo");
  return data;
};

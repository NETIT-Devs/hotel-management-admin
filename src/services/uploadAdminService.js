/**
 * Shared Admin Image Upload Service
 * Uploads local image files to `POST /api/uploads/image` using FormData
 * and returns the stored public URL for Rooms, Offers, Facilities, or Gallery.
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Uploads an image file to the backend Multer endpoint.
 *
 * @param {File} file - Browser File object selected via input or drag-and-drop
 * @param {'rooms'|'offers'|'facilities'|'gallery'|'general'} [folder='general'] - Target subfolder
 * @returns {Promise<string>} Publicly accessible uploaded image URL
 */
export const uploadAdminImage = async (file, folder = "general") => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(
    `${API_BASE}/uploads/image?folder=${encodeURIComponent(folder)}`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }
  );

  const data = await res.json();
  if (!res.ok || !data.imageUrl) {
    throw new Error(data.message || "Failed to upload image.");
  }

  return data.imageUrl;
};

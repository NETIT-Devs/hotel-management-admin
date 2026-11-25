import { useRef, useState } from "react";
import { UploadCloud, Link2, X, Image as ImageIcon, Loader2, Plus } from "lucide-react";
import { uploadAdminImage } from "../../services/uploadAdminService";

/**
 * Reusable ImageUploadField Component (Admin Dashboard)
 * Supports two clean modes via a segmented luxury toggle:
 *  - "Upload File" (Default): Drag & drop or Choose File (.jpg, .png, .webp up to 8MB) -> uploads to /api/uploads/image
 *  - "Image URL": Paste an external CDN / Google Drive / Unsplash URL directly
 *
 * Usage modes:
 *  - mode="single" (default): Controls a single cover image URL via `value` + `onChange(url)` with live preview.
 *  - mode="append": Adds uploaded or pasted images into a multi-photo gallery via `onAddImage(url)`.
 */
const ImageUploadField = ({
  label = "Cover Image",
  folder = "general",
  value = "",
  onChange,
  mode = "single",
  onAddImage,
  placeholder = "https://images.unsplash.com/...",
}) => {
  const [inputMode, setInputMode] = useState("upload"); // 'upload' | 'url'
  const [urlDraft, setUrlDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // Validate and upload a selected/dropped image file to the backend Multer endpoint
  const processFile = async (file) => {
    if (!file) return;
    setUploadError("");

    if (!file.type || !file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (.jpg, .png, .webp).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Image must be 8MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const uploadedUrl = await uploadAdminImage(file, folder);
      if (mode === "append" && onAddImage) {
        onAddImage(uploadedUrl);
      } else if (onChange) {
        onChange(uploadedUrl);
      }
    } catch (err) {
      setUploadError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  };

  const handleAppendUrl = () => {
    const clean = urlDraft.trim();
    if (!clean) return;
    if (onAddImage) onAddImage(clean);
    setUrlDraft("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Header Row: Field Label + Upload/URL Segmented Toggle */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <label
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "#5B6964",
            margin: 0,
          }}
        >
          {label}
        </label>

        {/* Clean 2-Tab Pill Switcher */}
        <div
          role="tablist"
          aria-label={`${label} source switcher`}
          style={{
            display: "inline-flex",
            background: "#F4EFE4",
            padding: "3px",
            borderRadius: "999px",
            border: "1px solid rgba(201, 162, 75, 0.35)",
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "upload"}
            onClick={() => {
              setInputMode("upload");
              setUploadError("");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 11px",
              borderRadius: "999px",
              border: "none",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: inputMode === "upload" ? "#C9A24B" : "transparent",
              color: inputMode === "upload" ? "#061C2B" : "#063B32",
            }}
          >
            <UploadCloud size={12} />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "url"}
            onClick={() => {
              setInputMode("url");
              setUploadError("");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 11px",
              borderRadius: "999px",
              border: "none",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: inputMode === "url" ? "#C9A24B" : "transparent",
              color: inputMode === "url" ? "#061C2B" : "#063B32",
            }}
          >
            <Link2 size={12} />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {/* Mode A: Drag & Drop + Choose File Box */}
      {inputMode === "upload" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: dragActive
              ? "2px dashed #C9A24B"
              : "1.5px dashed rgba(6, 59, 50, 0.28)",
            background: dragActive ? "rgba(201, 162, 75, 0.1)" : "#FAF8F5",
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            cursor: uploading ? "wait" : "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(201, 162, 75, 0.18)",
                color: "#063B32",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {uploading ? (
                <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <UploadCloud size={17} color="#9a7322" />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#061C2B" }}>
                {uploading
                  ? "Uploading image to server..."
                  : mode === "append"
                  ? "Drop an image here or choose file to add to gallery"
                  : "Drop an image here or click to choose file"}
              </div>
              <div style={{ fontSize: "10.5px", color: "#6b7280", marginTop: "2px" }}>
                Supports JPG, PNG, WEBP · Max 8MB
              </div>
            </div>
          </div>

          <span
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              background: "#063B32",
              color: "#C9A24B",
              fontSize: "11px",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {uploading ? "Uploading..." : "Choose File"}
          </span>
        </div>
      ) : mode === "append" ? (
        /* Mode B (Append): Paste URL + Add Button */
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAppendUrl();
              }
            }}
            placeholder={placeholder}
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: "10px",
              border: "1px solid #D0D6D2",
              background: "#ffffff",
              fontSize: "12.5px",
              color: "#061C2B",
            }}
          />
          <button
            type="button"
            onClick={handleAppendUrl}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "0 14px",
              borderRadius: "10px",
              border: "none",
              background: "#063B32",
              color: "#C9A24B",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      ) : (
        /* Mode B (Single): Direct URL Input */
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: "10px",
            border: "1px solid #D0D6D2",
            background: "#ffffff",
            fontSize: "12.5px",
            color: "#061C2B",
          }}
        />
      )}

      {/* Upload Error Feedback */}
      {uploadError && (
        <div
          role="alert"
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "#b91c1c",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "6px 10px",
          }}
        >
          {uploadError}
        </div>
      )}

      {/* Live Image Preview (Single Mode) */}
      {mode === "single" && value && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "8px 10px",
            borderRadius: "12px",
            background: "#ffffff",
            border: "1px solid rgba(201, 162, 75, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <img
              src={value}
              alt="Selected preview"
              style={{
                width: "54px",
                height: "40px",
                borderRadius: "8px",
                objectFit: "cover",
                border: "1px solid #e5e7eb",
                flexShrink: 0,
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#063B32",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <ImageIcon size={12} color="#C9A24B" />
                <span>Active Cover Image</span>
              </div>
              <div
                style={{
                  fontSize: "10.5px",
                  color: "#6b7280",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "320px",
                }}
                title={value}
              >
                {value}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange && onChange("")}
            title="Clear image"
            aria-label="Clear selected image"
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;

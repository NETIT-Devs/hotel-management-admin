import { useEffect, useMemo, useState } from "react";
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MessageSquareReply,
  Trash2,
  Search,
  RefreshCw,
  ShieldCheck,
  BedDouble,
} from "lucide-react";
import {
  getAllReviewsAdmin,
  updateReviewModeration,
  deleteReviewAdmin,
} from "../../services/reviewAdminService";

const STATUS_BADGE = {
  PENDING: {
    label: "Pending Approval",
    bg: "rgba(201, 162, 75, 0.16)",
    color: "#8E6D20",
  },
  APPROVED: {
    label: "Approved & Live",
    bg: "rgba(16, 185, 129, 0.14)",
    color: "#065F46",
  },
  REJECTED: {
    label: "Rejected",
    bg: "rgba(239, 68, 68, 0.12)",
    color: "#991B1B",
  },
};

const formatBookingCode = (id) => `#SB-${String(id || 0).padStart(4, "0")}`;

/**
 * Admin Guest Reviews Moderation Panel
 * - Filter by PENDING / APPROVED / REJECTED
 * - Approve, Reject, Toggle Homepage Featured status, Reply as Hotel Management, or Delete
 */
const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    featured: 0,
  });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Management reply modal/inline state
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySaving, setReplySaving] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllReviewsAdmin(statusFilter);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      setError(err.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const filteredReviews = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((r) =>
      [
        r.guest_name,
        r.guest_email,
        r.room_name,
        r.title,
        r.comment,
        formatBookingCode(r.booking_id),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [reviews, searchTerm]);

  const handleModerate = async (reviewId, payload) => {
    setBusyId(reviewId);
    try {
      await updateReviewModeration(reviewId, payload);
      await loadReviews();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveReply = async (e) => {
    e.preventDefault();
    if (!replyTarget) return;
    setReplySaving(true);
    try {
      await updateReviewModeration(replyTarget.id, { admin_reply: replyText });
      setReplyTarget(null);
      setReplyText("");
      await loadReviews();
    } catch (err) {
      alert(err.message);
    } finally {
      setReplySaving(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Permanently delete this guest review?")) return;
    setBusyId(reviewId);
    try {
      await deleteReviewAdmin(reviewId);
      await loadReviews();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const statCards = [
    {
      label: "Total Verified Reviews",
      value: counts.total || 0,
      icon: ShieldCheck,
      color: "#061C2B",
      bg: "rgba(6, 28, 43, 0.08)",
    },
    {
      label: "Pending Moderation",
      value: counts.pending || 0,
      icon: Clock,
      color: "#9A7422",
      bg: "rgba(201, 162, 75, 0.16)",
    },
    {
      label: "Approved & Live",
      value: counts.approved || 0,
      icon: CheckCircle2,
      color: "#065F46",
      bg: "rgba(16, 185, 129, 0.14)",
    },
    {
      label: "Featured on Home",
      value: counts.featured || 0,
      icon: Sparkles,
      color: "#063B32",
      bg: "rgba(6, 59, 50, 0.12)",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Summary KPI Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="admin-card"
              style={{
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 600 }}>
                  {card.label}
                </span>
                <div style={{ fontSize: "26px", fontWeight: 700, color: "#061C2B", marginTop: "4px" }}>
                  {card.value}
                </div>
              </div>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: card.bg,
                  color: card.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Toolbar */}
      <div
        className="admin-card"
        style={{
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            { key: "ALL", label: `All (${counts.total || 0})` },
            { key: "PENDING", label: `Pending (${counts.pending || 0})` },
            { key: "APPROVED", label: `Approved (${counts.approved || 0})` },
            { key: "REJECTED", label: `Rejected (${counts.rejected || 0})` },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: active ? "1px solid #061C2B" : "1px solid #E5E7EB",
                  background: active ? "#061C2B" : "#FFFFFF",
                  color: active ? "#C9A24B" : "#4B5563",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9CA3AF",
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search guest, room, or #SB ref..."
              style={{
                padding: "8px 12px 8px 34px",
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
                fontSize: "13px",
                minWidth: "230px",
              }}
            />
          </div>

          <button
            type="button"
            onClick={loadReviews}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              background: "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="admin-card" style={{ padding: "32px", textAlign: "center", color: "#6B7280" }}>
          Loading verified guest reviews...
        </div>
      ) : error ? (
        <div className="admin-card" style={{ padding: "24px", color: "#991B1B" }}>
          {error}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="admin-card" style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
          No guest reviews found in this view.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filteredReviews.map((review) => {
            const badge = STATUS_BADGE[review.status] || STATUS_BADGE.PENDING;
            const isBusy = busyId === review.id;

            return (
              <div
                key={review.id}
                className="admin-card"
                style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "15px", color: "#061C2B" }}>
                        {review.guest_name}
                      </strong>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: "999px",
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                      {Boolean(review.is_featured) && review.status === "APPROVED" && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: "999px",
                            background: "#061C2B",
                            color: "#C9A24B",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Sparkles size={11} /> Featured on Home
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6B7280",
                        marginTop: "4px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      <span>{formatBookingCode(review.booking_id)}</span>
                      <span>•</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <BedDouble size={13} /> {review.room_name}
                      </span>
                      {review.guest_country && (
                        <>
                          <span>•</span>
                          <span>{review.guest_country}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        fill={s <= review.overall_rating ? "#C9A24B" : "none"}
                        color={s <= review.overall_rating ? "#C9A24B" : "#D1D5DB"}
                      />
                    ))}
                    <span style={{ fontSize: "13px", fontWeight: 700, marginLeft: "6px", color: "#061C2B" }}>
                      {review.overall_rating}.0
                    </span>
                  </div>
                </div>

                {/* Review Content */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827", marginBottom: "4px" }}>
                    {review.title}
                  </div>
                  <p style={{ fontSize: "13px", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
                    {review.comment}
                  </p>
                </div>

                {/* Existing Management Reply */}
                {review.admin_reply && (
                  <div
                    style={{
                      background: "#FAF8F5",
                      borderLeft: "3px solid #C9A24B",
                      padding: "10px 14px",
                      borderRadius: "0 10px 10px 0",
                      fontSize: "12px",
                      color: "#374151",
                    }}
                  >
                    <strong style={{ display: "block", color: "#061C2B", marginBottom: "2px" }}>
                      Management Reply:
                    </strong>
                    {review.admin_reply}
                  </div>
                )}

                {/* Moderation Actions */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    paddingTop: "8px",
                    borderTop: "1px solid #F3F4F6",
                  }}
                >
                  {review.status !== "APPROVED" && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleModerate(review.id, { status: "APPROVED" })}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#063B32",
                        color: "#C9A24B",
                        fontSize: "12px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        cursor: "pointer",
                      }}
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                  )}

                  {review.status !== "REJECTED" && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleModerate(review.id, { status: "REJECTED" })}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        border: "1px solid #FECACA",
                        background: "#FEF2F2",
                        color: "#991B1B",
                        fontSize: "12px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        cursor: "pointer",
                      }}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  )}

                  {review.status === "APPROVED" && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        handleModerate(review.id, { is_featured: !review.is_featured })
                      }
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        border: "1px solid #C9A24B",
                        background: review.is_featured ? "#C9A24B" : "#FFFFFF",
                        color: "#061C2B",
                        fontSize: "12px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        cursor: "pointer",
                      }}
                    >
                      <Sparkles size={14} />
                      {review.is_featured ? "Featured on Home" : "Feature on Home"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setReplyTarget(review);
                      setReplyText(review.admin_reply || "");
                    }}
                    style={{
                      padding: "7px 14px",
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                      background: "#FFFFFF",
                      color: "#374151",
                      fontSize: "12px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      cursor: "pointer",
                    }}
                  >
                    <MessageSquareReply size={14} />
                    {review.admin_reply ? "Edit Reply" : "Reply"}
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDelete(review.id)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                      background: "#FFFFFF",
                      color: "#6B7280",
                      fontSize: "12px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      marginLeft: "auto",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Management Reply Modal */}
      {replyTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 28, 43, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 60,
          }}
        >
          <form
            onSubmit={handleSaveReply}
            className="admin-card"
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "18px", color: "#061C2B" }}>
              Reply to {replyTarget.guest_name}
            </h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
              This official response will appear publicly beneath the guest&apos;s review.
            </p>
            <textarea
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Thank you for staying with us at Serenity Bay..."
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #D1D5DB",
                fontSize: "13px",
                resize: "vertical",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  background: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={replySaving}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#061C2B",
                  color: "#C9A24B",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {replySaving ? "Saving..." : "Save Reply"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReviewsManagement;

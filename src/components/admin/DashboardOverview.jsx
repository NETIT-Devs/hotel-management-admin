import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BedDouble,
  CalendarCheck,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";

import {
  getBookingStats,
  getDashboardSummary,
  getRecentBookings,
  getRoomAvailability,
} from "../../services/dashboardService";
import { updateBookingStatus } from "../../services/bookingAdminService";

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatNumber = (value) => numberFormatter.format(Number(value) || 0);
const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const formatBookingCode = (id) => `#SB-${String(id || 0).padStart(4, "0")}`;

const getStatusClass = (status) =>
  `dashboard-status dashboard-status-${String(status || "unknown").toLowerCase()}`;

const DEFAULT_DASHBOARD = {
  summary: {
    total_bookings: 0,
    pending_bookings: 0,
    approved_bookings: 0,
    rejected_bookings: 0,
    approved_booking_value: 0,
    total_customers: 0,
    total_room_types: 0,
    total_room_units: 0,
  },
  bookings: [],
  stats: [],
  rooms: [],
  roomTotals: {
    available_units: 0,
    occupied_units: 0,
    total_units: 0,
    maintenance_room_types: 0,
  },
};

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [summaryRes, bookingsRes, statsRes, roomsRes] =
          await Promise.allSettled([
            getDashboardSummary(),
            getRecentBookings(),
            getBookingStats(),
            getRoomAvailability(),
          ]);

        if (isMounted) {
          setDashboard({
            summary:
              summaryRes.status === "fulfilled" && summaryRes.value?.summary
                ? summaryRes.value.summary
                : DEFAULT_DASHBOARD.summary,
            bookings:
              bookingsRes.status === "fulfilled" &&
              Array.isArray(bookingsRes.value?.bookings)
                ? bookingsRes.value.bookings
                : DEFAULT_DASHBOARD.bookings,
            stats:
              statsRes.status === "fulfilled" &&
              Array.isArray(statsRes.value?.stats)
                ? statsRes.value.stats
                : DEFAULT_DASHBOARD.stats,
            rooms:
              roomsRes.status === "fulfilled" &&
              Array.isArray(roomsRes.value?.rooms)
                ? roomsRes.value.rooms
                : DEFAULT_DASHBOARD.rooms,
            roomTotals:
              roomsRes.status === "fulfilled" && roomsRes.value?.totals
                ? roomsRes.value.totals
                : DEFAULT_DASHBOARD.roomTotals,
          });

          const rejected = [summaryRes, bookingsRes, statsRes, roomsRes].find(
            (r) => r.status === "rejected"
          );
          if (rejected) {
            setError(rejected.reason?.message || "");
          }
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || "Unable to load dashboard data.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handleQuickStatusUpdate = async (bookingId, nextStatus) => {
    setActionLoadingId(bookingId);
    try {
      await updateBookingStatus(
        bookingId,
        nextStatus,
        nextStatus === "APPROVED"
          ? "Approved from Dashboard Overview"
          : "Rejected from Dashboard Overview"
      );
      setReloadKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to update booking status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const summary = dashboard?.summary || DEFAULT_DASHBOARD.summary;
  const bookings = dashboard?.bookings || [];
  const stats = dashboard?.stats || [];
  const rooms = dashboard?.rooms || [];
  const roomTotals = dashboard?.roomTotals || DEFAULT_DASHBOARD.roomTotals;

  const totalBookingsCount = Number(summary.total_bookings) || 0;
  const pendingBookingsCount = Number(summary.pending_bookings) || 0;
  const approvedBookingsCount =
    Number(summary.approved_bookings) ||
    bookings.filter((b) => b.status === "APPROVED").length ||
    0;
  const totalRevenue = Number(summary.approved_booking_value) || 0;
  const totalCustomers = Number(summary.total_customers) || 0;
  const availableUnits = Number(roomTotals.available_units) || 0;
  const occupiedUnits = Number(roomTotals.occupied_units) || 0;
  const totalUnits =
    Number(roomTotals.total_units) || Number(summary.total_room_units) || 0;

  const pendingShare =
    totalBookingsCount > 0
      ? `${Math.round((pendingBookingsCount / totalBookingsCount) * 100)}% of total`
      : "0% pending";
  const approvalRate =
    totalBookingsCount > 0
      ? `${Math.round((approvedBookingsCount / totalBookingsCount) * 100)}% approval rate`
      : "0% approved";
  const availabilityRate =
    totalUnits > 0
      ? `${Math.round((availableUnits / totalUnits) * 100)}% open inventory`
      : "0% available";
  const occupancyRate =
    totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Build continuous 6-month series from real DB stats so chart never has awkward empty gaps
  const sixMonthSeries = useMemo(() => {
    const byMonth = new Map();
    stats.forEach((item) => {
      if (item.month) {
        byMonth.set(String(item.month), {
          month: String(item.month),
          total_bookings: Number(item.total_bookings) || 0,
          approved_bookings: Number(item.approved_bookings) || 0,
          pending_bookings: Number(item.pending_bookings) || 0,
          rejected_bookings: Number(item.rejected_bookings) || 0,
        });
      }
    });

    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const shortLabel = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      const existing = byMonth.get(key);
      result.push({
        month: key,
        label: shortLabel,
        total_bookings: existing ? existing.total_bookings : 0,
        approved_bookings: existing ? existing.approved_bookings : 0,
        pending_bookings: existing ? existing.pending_bookings : 0,
        rejected_bookings: existing ? existing.rejected_bookings : 0,
      });
    }
    return result;
  }, [stats]);

  const maximumMonthlyBookings = Math.max(
    ...sixMonthSeries.map((m) => m.total_bookings),
    1
  );

  // Calculate month-over-month percentage change from real DB monthly stats
  const currentMonthTotal =
    sixMonthSeries[sixMonthSeries.length - 1]?.total_bookings || 0;
  const prevMonthTotal =
    sixMonthSeries[sixMonthSeries.length - 2]?.total_bookings || 0;
  const monthlyGrowthBadge =
    prevMonthTotal > 0
      ? `${currentMonthTotal >= prevMonthTotal ? "+" : ""}${Math.round(
          ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100
        )}% vs last mo`
      : `${currentMonthTotal} this month`;

  const metricCards = [
    {
      label: "Total Bookings",
      value: formatNumber(totalBookingsCount),
      badge: monthlyGrowthBadge,
      subtext: "All-time reservations",
      icon: CalendarCheck,
      tone: "emerald",
    },
    {
      label: "Pending Bookings",
      value: formatNumber(pendingBookingsCount),
      badge: pendingShare,
      subtext: "Awaiting confirmation",
      icon: Clock3,
      tone: "gold",
    },
    {
      label: "Approved Bookings",
      value: formatNumber(approvedBookingsCount),
      badge: approvalRate,
      subtext: "Confirmed guest stays",
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      label: "Total Customers",
      value: formatNumber(totalCustomers),
      badge: "Active Guests",
      subtext: "Registered customer accounts",
      icon: UsersRound,
      tone: "navy",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      badge: "Approved Stays",
      subtext: "Confirmed booking revenue",
      icon: CircleDollarSign,
      tone: "gold",
    },
    {
      label: "Available Rooms",
      value: `${formatNumber(availableUnits)} / ${formatNumber(totalUnits)}`,
      badge: availabilityRate,
      subtext: `${formatNumber(occupiedUnits)} currently occupied`,
      icon: BedDouble,
      tone: "navy",
    },
  ];

  return (
    <div className="dashboard-overview">
      {/* Luxury Executive Banner */}
      <section className="dashboard-welcome-section">
        <div className="dashboard-welcome-content">
          <div className="welcome-badge-row">
            <Sparkles size={14} />
            <span className="welcome-label">SERENITY BAY HOTEL &amp; RESORT</span>
          </div>
          <h2>
            Executive <span>Luxury Hospitality</span> Overview
          </h2>
          <p>
            Real-time reservation performance, suite inventory, and guest activity
            synchronized directly with your hotel database.
          </p>
        </div>

        <div className="dashboard-welcome-actions">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="dashboard-btn-secondary"
            disabled={isLoading}
          >
            <RefreshCw size={15} className={isLoading ? "spin-icon" : ""} />
            <span>{isLoading ? "Syncing..." : "Refresh Data"}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/bookings")}
            className="dashboard-btn-primary"
          >
            <span>Manage Bookings</span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      {error && (
        <div className="dashboard-alert-banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </button>
        </div>
      )}

      {/* 6 Balanced Horizontal Executive KPI Cards (3x2 Airy Grid) */}
      <section className="dashboard-metrics" aria-label="Hotel KPI Summary">
        {metricCards.map(({ label, value, badge, subtext, icon: Icon, tone }) => (
          <article className={`dashboard-metric-card tone-${tone}`} key={label}>
            <div className="dashboard-metric-body">
              <span className="dashboard-metric-label">{label}</span>
              <strong className="dashboard-metric-value">{value}</strong>
              <small className="dashboard-metric-subtext">{subtext}</small>
            </div>
            <div className="dashboard-metric-aside">
              <div className={`dashboard-metric-icon dashboard-metric-${tone}`}>
                <Icon size={19} aria-hidden="true" />
              </div>
              <span className={`dashboard-metric-badge badge-${tone}`}>
                <TrendingUp size={10} aria-hidden="true" />
                {badge}
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* Charts & Room Availability Grid */}
      <section className="dashboard-content-grid">
        {/* Monthly Booking Activity Panel */}
        <article className="dashboard-panel dashboard-booking-chart">
          <div className="dashboard-panel-heading">
            <div>
              <span className="panel-eyebrow">ANALYTICS &amp; TRENDS</span>
              <h3>Monthly Booking Statistics</h3>
              <p>Reservation volume and approval breakdown over the last 6 months</p>
            </div>
            <div className="dashboard-chart-legend">
              <span className="legend-item">
                <i className="legend-dot dot-total" /> Total
              </span>
              <span className="legend-item">
                <i className="legend-dot dot-approved" /> Approved
              </span>
              <span className="legend-item">
                <i className="legend-dot dot-pending" /> Pending
              </span>
            </div>
          </div>

          <div className="dashboard-chart" aria-label="Monthly bookings chart">
            {sixMonthSeries.map((month) => {
              const total = month.total_bookings;
              const approved = month.approved_bookings;
              const pending = month.pending_bookings;
              const totalHeight = `${Math.max(
                (total / maximumMonthlyBookings) * 100,
                total > 0 ? 12 : 4
              )}%`;
              const approvedRatio =
                total > 0 ? Math.round((approved / total) * 100) : 0;

              return (
                <div className="dashboard-chart-column" key={month.month}>
                  <div className="dashboard-chart-counts">
                    <span className="dashboard-chart-value">{total}</span>
                  </div>
                  <div className="dashboard-chart-track">
                    <div
                      className={`dashboard-chart-bar ${
                        total === 0 ? "bar-empty" : ""
                      }`}
                      style={{ height: totalHeight }}
                      title={`${month.label}: ${total} Total (${approved} Approved, ${pending} Pending)`}
                    >
                      {approvedRatio > 0 && (
                        <div
                          className="dashboard-chart-bar-approved"
                          style={{ height: `${approvedRatio}%` }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="dashboard-chart-label">{month.label}</span>
                  <small className="dashboard-chart-sub">
                    {approved}A · {pending}P
                  </small>
                </div>
              );
            })}
          </div>

          <div className="dashboard-chart-footer">
            <div>
              <span>6-Month Total Reservations</span>
              <strong>
                {formatNumber(
                  sixMonthSeries.reduce((s, m) => s + m.total_bookings, 0)
                )}
              </strong>
            </div>
            <div>
              <span>6-Month Approved</span>
              <strong>
                {formatNumber(
                  sixMonthSeries.reduce((s, m) => s + m.approved_bookings, 0)
                )}
              </strong>
            </div>
            <div>
              <span>Current Month Pending</span>
              <strong>{formatNumber(pendingBookingsCount)}</strong>
            </div>
          </div>
        </article>

        {/* Room Availability & Inventory Panel */}
        <article className="dashboard-panel dashboard-availability">
          <div className="dashboard-panel-heading">
            <div>
              <span className="panel-eyebrow">LIVE SUITE INVENTORY</span>
              <h3>Room Availability</h3>
              <p>Real-time available, occupied, and total room units today</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/rooms")}
              className="dashboard-link-btn"
            >
              Manage Rooms <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="dashboard-availability-summary">
            <div className="avail-stat-box avail-box-emerald">
              <span>Available</span>
              <strong>{formatNumber(availableUnits)}</strong>
              <small>Ready for check-in</small>
            </div>
            <div className="avail-stat-box avail-box-gold">
              <span>Occupied</span>
              <strong>{formatNumber(occupiedUnits)}</strong>
              <small>{occupancyRate}% occupancy</small>
            </div>
            <div className="avail-stat-box avail-box-navy">
              <span>Total Rooms</span>
              <strong>{formatNumber(totalUnits)}</strong>
              <small>{rooms.length} suite categories</small>
            </div>
          </div>

          {/* Visual Occupancy Bar */}
          <div className="dashboard-occupancy-meter">
            <div className="occupancy-meter-labels">
              <span>Current Inventory Utilization</span>
              <strong>
                {availableUnits} Available · {occupiedUnits} Occupied
              </strong>
            </div>
            <div className="occupancy-meter-track">
              <div
                className="occupancy-meter-fill"
                style={{
                  width: `${
                    totalUnits > 0
                      ? Math.min(100, Math.round((availableUnits / totalUnits) * 100))
                      : 100
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="dashboard-room-list">
            {rooms.map((room) => {
              const rTotal = Math.max(1, Number(room.total_units) || 1);
              const rAvail = Number(room.available_units) || 0;
              const rOcc = Number(room.occupied_units) || 0;
              const pct = Math.min(100, Math.round((rAvail / rTotal) * 100));

              return (
                <div className="dashboard-room-row" key={room.id}>
                  <div className="dashboard-room-info">
                    <div className="dashboard-room-title-line">
                      <strong>{room.room_name}</strong>
                      <span className="room-type-pill">{room.room_type}</span>
                    </div>
                    <div className="dashboard-room-mini-bar">
                      <div
                        className={`dashboard-room-mini-fill ${
                          room.status === "MAINTENANCE" ? "fill-maintenance" : ""
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="dashboard-room-meta">
                    <small>
                      {rOcc} Occ / {rTotal} Total
                    </small>
                    <span
                      className={
                        room.status === "MAINTENANCE"
                          ? "dashboard-room-maintenance"
                          : "dashboard-room-available"
                      }
                    >
                      {room.status === "MAINTENANCE"
                        ? "Maintenance"
                        : `${formatNumber(rAvail)} Available`}
                    </span>
                  </div>
                </div>
              );
            })}
            {!rooms.length && (
              <p className="dashboard-empty-state">No rooms found in database.</p>
            )}
          </div>
        </article>
      </section>

      {/* Recent Bookings Section */}
      <section className="dashboard-panel dashboard-recent-bookings">
        <div className="dashboard-panel-heading">
          <div>
            <span className="panel-eyebrow">RESERVATION DESK</span>
            <h3>Recent Bookings</h3>
            <p>Latest guest reservations with instant status actions</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/bookings")}
            className="dashboard-link-btn"
          >
            View All Bookings <ArrowUpRight size={14} />
          </button>
        </div>

        {bookings.length ? (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Guest Name</th>
                  <th>Room Type</th>
                  <th>Check-in Date</th>
                  <th>Check-out Date</th>
                  <th>Booking Status</th>
                  <th className="text-right">Action Buttons</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const isPending = booking.status === "PENDING";
                  const isBusy = actionLoadingId === booking.id;

                  return (
                    <tr key={booking.id}>
                      <td>
                        <span className="booking-id-badge">
                          {formatBookingCode(booking.id)}
                        </span>
                      </td>
                      <td>
                        <div className="guest-cell">
                          <strong>{booking.guest_name || "Valued Guest"}</strong>
                          <span>{booking.guest_email || "—"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="room-cell">
                          <strong>{booking.room_name || "Luxury Suite"}</strong>
                          <span>
                            {booking.room_type || "SUITE"} ·{" "}
                            {formatCurrency(booking.total_price)}
                          </span>
                        </div>
                      </td>
                      <td>{formatDate(booking.check_in)}</td>
                      <td>{formatDate(booking.check_out)}</td>
                      <td>
                        <span className={getStatusClass(booking.status)}>
                          {booking.status || "PENDING"}
                        </span>
                      </td>
                      <td>
                        <div className="dashboard-table-actions">
                          <button
                            type="button"
                            className="table-action-btn btn-view"
                            title="View booking details"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="table-action-btn btn-approve"
                                title="Approve booking"
                                disabled={isBusy}
                                onClick={() =>
                                  handleQuickStatusUpdate(booking.id, "APPROVED")
                                }
                              >
                                <Check size={14} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                className="table-action-btn btn-reject"
                                title="Reject booking"
                                disabled={isBusy}
                                onClick={() =>
                                  handleQuickStatusUpdate(booking.id, "REJECTED")
                                }
                              >
                                <X size={14} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="dashboard-empty-state">No recent bookings found.</p>
        )}
      </section>

      {/* Quick Booking Details Modal */}
      {selectedBooking && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="dashboard-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <div>
                <span className="panel-eyebrow">
                  RESERVATION {formatBookingCode(selectedBooking.id)}
                </span>
                <h4>{selectedBooking.room_name || "Suite Reservation"}</h4>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedBooking(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="dashboard-modal-grid">
              <div>
                <span>Guest Name</span>
                <strong>{selectedBooking.guest_name || "Guest"}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{selectedBooking.guest_email || "—"}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{selectedBooking.guest_phone || "—"}</strong>
              </div>
              <div>
                <span>Status</span>
                <span className={getStatusClass(selectedBooking.status)}>
                  {selectedBooking.status}
                </span>
              </div>
              <div>
                <span>Check-In</span>
                <strong>{formatDate(selectedBooking.check_in)}</strong>
              </div>
              <div>
                <span>Check-Out</span>
                <strong>{formatDate(selectedBooking.check_out)}</strong>
              </div>
              <div>
                <span>Guests &amp; Rooms</span>
                <strong>
                  {formatNumber(selectedBooking.guests)} Guests ·{" "}
                  {formatNumber(selectedBooking.rooms_count || 1)} Room(s)
                </strong>
              </div>
              <div>
                <span>Total Amount</span>
                <strong className="gold-price">
                  {formatCurrency(selectedBooking.total_price)}
                </strong>
              </div>
            </div>

            <div className="dashboard-modal-footer">
              <button
                type="button"
                className="dashboard-btn-secondary"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="dashboard-btn-primary"
                onClick={() => {
                  setSelectedBooking(null);
                  navigate("/admin/bookings");
                }}
              >
                Open in Bookings Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;

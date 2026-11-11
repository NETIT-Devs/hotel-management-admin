import { useEffect, useState } from "react";
import {
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  UsersRound,
} from "lucide-react";

import {
  getBookingStats,
  getDashboardSummary,
  getRecentBookings,
  getRoomAvailability,
} from "../../services/dashboardService";

const numberFormatter = new Intl.NumberFormat("en-US");

const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

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

const formatMonth = (value) => {
  if (!value) return "";

  const date = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "short" });
};

const getStatusClass = (status) =>
  `dashboard-status dashboard-status-${String(status || "unknown").toLowerCase()}`;

const DashboardOverview = () => {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [summaryResponse, bookingsResponse, statsResponse, roomsResponse] =
          await Promise.all([
            getDashboardSummary(),
            getRecentBookings(),
            getBookingStats(),
            getRoomAvailability(),
          ]);

        if (isMounted) {
          setDashboard({
            summary: summaryResponse.summary,
            bookings: bookingsResponse.bookings,
            stats: statsResponse.stats,
            rooms: roomsResponse.rooms,
            roomTotals: roomsResponse.totals,
          });
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

  if (isLoading) {
    return (
      <section className="dashboard-state" aria-live="polite">
        <span className="dashboard-loading-indicator" />
        Loading dashboard data…
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-state dashboard-error" role="alert">
        <p>{error}</p>
        <button
          className="dashboard-retry-button"
          onClick={() => setReloadKey((key) => key + 1)}
        >
          Try again
        </button>
      </section>
    );
  }

  if (!dashboard) return null;

  const { summary, bookings, stats, rooms, roomTotals } = dashboard;
  const maximumMonthlyBookings = Math.max(
    ...stats.map((month) => Number(month.total_bookings) || 0),
    1,
  );
  const metricCards = [
    {
      label: "Total bookings",
      value: formatNumber(summary.total_bookings),
      icon: CalendarCheck,
      className: "dashboard-metric-emerald",
    },
    {
      label: "Pending bookings",
      value: formatNumber(summary.pending_bookings),
      icon: Clock3,
      className: "dashboard-metric-gold",
    },
    {
      label: "Approved booking value",
      value: formatNumber(summary.approved_booking_value),
      icon: CircleDollarSign,
      className: "dashboard-metric-navy",
    },
    {
      label: "Total customers",
      value: formatNumber(summary.total_customers),
      icon: UsersRound,
      className: "dashboard-metric-sage",
    },
  ];

  return (
    <div className="dashboard-overview">
      <section className="dashboard-welcome-section">
        <div>
          <span className="welcome-label">SERENITY BAY HOTEL &amp; RESORT</span>
          <h2>
            Welcome to Your <br />
            <span>Luxury Management</span> Dashboard
          </h2>
          <p>
            Manage your hotel operations, reservations and guest experiences
            from one place.
          </p>
        </div>
      </section>

      <section className="dashboard-metrics" aria-label="Hotel summary">
        {metricCards.map(({ label, value, icon: Icon, className }) => (
          <article className="dashboard-metric-card" key={label}>
            <div className={`dashboard-metric-icon ${className}`}>
              <Icon size={21} />
            </div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-booking-chart">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Booking activity</h3>
              <p>Bookings over the last six months</p>
            </div>
            <CalendarCheck size={19} aria-hidden="true" />
          </div>

          {stats.length ? (
            <div className="dashboard-chart" aria-label="Monthly bookings">
              {stats.map((month) => {
                const total = Number(month.total_bookings) || 0;
                const height = `${Math.max(
                  (total / maximumMonthlyBookings) * 100,
                  total ? 8 : 0,
                )}%`;

                return (
                  <div className="dashboard-chart-column" key={month.month}>
                    <span className="dashboard-chart-value">{total}</span>
                    <div className="dashboard-chart-track">
                      <div
                        className="dashboard-chart-bar"
                        style={{ height }}
                        title={`${total} bookings`}
                      />
                    </div>
                    <span className="dashboard-chart-label">
                      {formatMonth(month.month)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="dashboard-empty-state">No booking activity yet.</p>
          )}
        </article>

        <article className="dashboard-panel dashboard-availability">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Room availability</h3>
              <p>Current room status</p>
            </div>
            <BedDouble size={20} aria-hidden="true" />
          </div>

          <div className="dashboard-availability-summary">
            <div>
              <strong>{formatNumber(roomTotals.available_units)}</strong>
              <span>Available</span>
            </div>
            <div>
              <strong>{formatNumber(roomTotals.occupied_units)}</strong>
              <span>Occupied</span>
            </div>
            <div>
              <strong>{formatNumber(roomTotals.total_units)}</strong>
              <span>Total units</span>
            </div>
          </div>

          <div className="dashboard-room-list">
            {rooms.slice(0, 5).map((room) => (
              <div className="dashboard-room-row" key={room.id}>
                <div>
                  <strong>{room.room_name}</strong>
                  <span>{room.room_type}</span>
                </div>
                <span
                  className={
                    room.status === "MAINTENANCE"
                      ? "dashboard-room-maintenance"
                      : "dashboard-room-available"
                  }
                >
                  {room.status === "MAINTENANCE"
                    ? "Maintenance"
                    : `${formatNumber(room.available_units)} available`}
                </span>
              </div>
            ))}
            {!rooms.length && (
              <p className="dashboard-empty-state">No rooms found.</p>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-panel dashboard-recent-bookings">
        <div className="dashboard-panel-heading">
          <div>
            <h3>Recent bookings</h3>
            <p>Latest guest reservations</p>
          </div>
          <CheckCircle2 size={20} aria-hidden="true" />
        </div>

        {bookings.length ? (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Guests</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <strong>{booking.guest_name || "Guest"}</strong>
                      <span>{booking.guest_email || "—"}</span>
                    </td>
                    <td>{booking.room_name || booking.room_type || "—"}</td>
                    <td>{formatDate(booking.check_in)}</td>
                    <td>{formatDate(booking.check_out)}</td>
                    <td>{formatNumber(booking.guests)}</td>
                    <td>
                      <span className={getStatusClass(booking.status)}>
                        {booking.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="dashboard-empty-state">No recent bookings.</p>
        )}
      </section>
    </div>
  );
};

export default DashboardOverview;

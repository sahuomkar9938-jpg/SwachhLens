import { useEffect, useState } from "react";
import "../App.css";
import ReportWaste from "./ReportWaste";
import MyReports from "./MyReports";
import Alerts from "./Alerts";
import Settings from "./Settings";
import { api } from "../services/api";
import WasteMap from "../components/WasteMap";

function CitizenDashboard({ user, onLogout, onUserUpdated }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, impactPoints: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    Promise.all([api.getReportStats(), api.getMyReports(), api.getHotspots()])
      .then(([statsResponse, reportsResponse, hotspotsResponse]) => {
        setStats(statsResponse.stats);
        setRecentReports((reportsResponse.reports || []).slice(0, 3));
        setHotspots(hotspotsResponse.hotspots || []);
      })
      .catch((error) => setLoadError(error.message));
  }, []);

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">🌿</div>
          <div>
            <h2>SwachhLens</h2>
            <span>Smart Waste Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={
              activePage === "dashboard" ? "nav-item active" : "nav-item"
            }
            onClick={() => setActivePage("dashboard")}
          >
            <span>🏠</span>
            Dashboard
          </button>

          <button
            className={
              activePage === "report" ? "nav-item active" : "nav-item"
            }
            onClick={() => setActivePage("report")}
          >
            <span>📸</span>
            Report Waste
          </button>

          <button
            className={
              activePage === "reports" ? "nav-item active" : "nav-item"
            }
            onClick={() => setActivePage("reports")}
          >
            <span>📋</span>
            My Reports
          </button>

          <button
            className={
              activePage === "hotspots" ? "nav-item active" : "nav-item"
            }
            onClick={() => setActivePage("hotspots")}
          >
            <span>🗺️</span>
            Waste Hotspots
          </button>

          <button
            className={
              activePage === "alerts" ? "nav-item active" : "nav-item"
            }
            onClick={() => setActivePage("alerts")}
          >
            <span>🔔</span>
            Alerts
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="nav-item"
            onClick={() => setActivePage("settings")}
          >
            <span>⚙️</span>
            Settings
          </button>

          <button className="logout-button" onClick={onLogout}>
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {/* TOP BAR */}
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">CITIZEN PORTAL</span>
            <h1>
              Good afternoon, {user?.firstName || "Citizen"} 👋
            </h1>
            <p>Together, let's keep our city clean.</p>
          </div>

          <div className="header-profile">
            <button className="notification-button">
              🔔
              <span className="notification-dot"></span>
            </button>

            <div className="profile-avatar">
              {user?.firstName?.charAt(0) || "U"}
            </div>

            <div className="profile-info">
              <strong>{user?.firstName || "User"}</strong>
              <span>Citizen</span>
            </div>
          </div>
        </header>

        {/* DASHBOARD VIEW */}
        {activePage === "dashboard" && (
          <section>
            {/* STAT CARDS */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div>
                  <span>Total Reports</span>
                  <strong>{stats.total}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon resolved">✅</div>
                <div>
                  <span>Resolved</span>
                  <strong>{stats.resolved}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon pending">⏳</div>
                <div>
                  <span>Pending</span>
                  <strong>{stats.pending}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon points">⭐</div>
                <div>
                  <span>Impact Points</span>
                  <strong>{stats.impactPoints}</strong>
                </div>
              </div>
            </div>

            {/* ACTION */}
            <div className="dashboard-grid">
              <div className="dashboard-panel report-panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-label">MAKE AN IMPACT</span>
                    <h2>See waste? Report it.</h2>
                    <p>
                      Upload a photo and location. Our AI system will help
                      classify and prioritize the report.
                    </p>
                  </div>
                  <div className="report-illustration">📸</div>
                </div>

                <button
                  className="primary-action"
                  onClick={() => setActivePage("report")}
                >
                  Report Waste →
                </button>
              </div>

              {/* HOTSPOTS */}
              <div className="dashboard-panel">
                <div className="panel-title-row">
                  <h2>Nearby Hotspots</h2>
                  <button onClick={() => setActivePage("hotspots")}>
                    View Map
                  </button>
                </div>

                <div className="hotspot-list">
                  <div className="hotspot-item">
                    <span className="hotspot-dot critical"></span>
                    <div>
                      <strong>Large Garbage Dump</strong>
                      <span>0.8 km away</span>
                    </div>
                    <small>Critical</small>
                  </div>

                  <div className="hotspot-item">
                    <span className="hotspot-dot high"></span>
                    <div>
                      <strong>Plastic Waste</strong>
                      <span>1.4 km away</span>
                    </div>
                    <small>High</small>
                  </div>

                  <div className="hotspot-item">
                    <span className="hotspot-dot low"></span>
                    <div>
                      <strong>Mixed Waste</strong>
                      <span>2.1 km away</span>
                    </div>
                    <small>Low</small>
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT REPORTS */}
            <div className="dashboard-panel recent-panel">
              <div className="panel-title-row">
                <div>
                  <span className="panel-label">ACTIVITY</span>
                  <h2>Recent Reports</h2>
                </div>
                <button onClick={() => setActivePage("reports")}>
                  View All
                </button>
              </div>

              <div className="report-table">
                <div className="report-row report-heading">
                  <span>Report</span>
                  <span>Location</span>
                  <span>Status</span>
                  <span>Priority</span>
                </div>

                {recentReports.map((report) => (
                  <div className="report-row" key={report.id}>
                    <span>{report.ai_category || report.category}</span>
                    <span>{Number(report.latitude).toFixed(4)}, {Number(report.longitude).toFixed(4)}</span>
                    <span className={`status ${report.status}-status`}>{report.status}</span>
                    <span className={`priority ${String(report.priority || "LOW").toLowerCase()}-priority`}>{report.priority || "LOW"}</span>
                  </div>
                ))}
                {loadError && <div className="error-message">{loadError}</div>}
                {!loadError && recentReports.length === 0 && <p>No reports submitted yet.</p>}
              </div>
            </div>
          </section>
        )}

        {/* 8.4 REPORT WASTE FORM VIEW */}
        {activePage === "report" && (
          <ReportWaste
            user={user}
            onBack={() => setActivePage("dashboard")}
          />
        )}

        {activePage === "reports" && <MyReports />}

        {activePage === "hotspots" && <section className="reports-view"><span className="panel-label">CITY SIGNALS</span><h1>Waste Hotspots</h1><p>AI-assisted hotspot risk estimation from recent report frequency.</p><WasteMap hotspots={hotspots} reports={recentReports} /></section>}

        {activePage === "alerts" && <Alerts />}

        {activePage === "settings" && <Settings onUserUpdated={onUserUpdated} />}

        {/* 8.4 PLACEHOLDER PAGES */}
        {activePage !== "dashboard" && activePage !== "report" && activePage !== "reports" && activePage !== "hotspots" && activePage !== "alerts" && activePage !== "settings" && (
          <div className="empty-page">
            <div className="empty-icon">
              {activePage === "reports" && "📋"}
              {activePage === "hotspots" && "🗺️"}
              {activePage === "alerts" && "🔔"}
              {activePage === "settings" && "⚙️"}
            </div>

            <h2>
              {activePage === "reports" && "My Reports"}
              {activePage === "hotspots" && "Waste Hotspots"}
              {activePage === "alerts" && "Alerts"}
              {activePage === "settings" && "Settings"}
            </h2>

            <p>This section will be built in the next steps.</p>

            <button
              className="primary-action"
              onClick={() => setActivePage("dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default CitizenDashboard;
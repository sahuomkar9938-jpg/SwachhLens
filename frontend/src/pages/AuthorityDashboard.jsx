import { useEffect, useState } from "react";
import "../App.css";
import { api } from "../services/api";
import WasteMap from "../components/WasteMap";

function AuthorityDashboard({ user, onLogout }) {
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  const loadReports = () => Promise.all([api.getAuthorityReports(), api.getHotspots(), api.getAnalytics()]).then(([reportData, hotspotData, analyticsData]) => {
    setReports(reportData.reports || []);
    setHotspots(hotspotData.hotspots || []);
    setAnalytics(analyticsData.analytics);
  });
  useEffect(() => { loadReports().catch((requestError) => setError(requestError.message)); }, []);

  const updateStatus = (id, status) => api.updateStatus(id, status).then(loadReports).catch((requestError) => setError(requestError.message));
  const updatePriority = (id, priority) => api.updatePriority(id, priority).then(loadReports).catch((requestError) => setError(requestError.message));

  const count = (predicate) => reports.filter(predicate).length;
  return (
    <div className="dashboard">
      <aside className="sidebar"><div className="dashboard-logo"><div className="dashboard-logo-icon">🌿</div><div><h2>SwachhLens</h2><span>Authority Portal</span></div></div><nav className="sidebar-nav"><span className="nav-item active">📋 Report Queue</span><span className="nav-item">🗺️ Waste Map</span><span className="nav-item">📊 Analytics</span></nav><div className="sidebar-bottom"><button className="logout-button" onClick={onLogout}>🚪 Logout</button></div></aside>
      <main className="dashboard-main">
        <header className="dashboard-header"><div><span className="dashboard-label">AUTHORITY PORTAL</span><h1>Operations overview</h1><p>Review, prioritize, and dispatch civic waste reports.</p></div><div className="profile-info"><strong>{user?.firstName || "Authority"}</strong><span>{user?.role}</span></div></header>
        {error && <div className="error-message">{error}</div>}
        <div className="stats-grid"><div className="stat-card"><span>Total Reports</span><strong>{reports.length}</strong></div><div className="stat-card"><span>Critical</span><strong>{count((report) => report.priority === "CRITICAL")}</strong></div><div className="stat-card"><span>In Progress</span><strong>{count((report) => report.status === "in_progress")}</strong></div><div className="stat-card"><span>Resolved</span><strong>{count((report) => report.status === "resolved")}</strong></div></div>
        <div className="dashboard-panel recent-panel"><div className="panel-title-row"><div><span className="panel-label">LIVE QUEUE</span><h2>Recent reports</h2></div></div><div className="authority-report-list">{reports.map((report) => <div className="authority-report-row" key={report.id}><div><strong>#{report.id} {report.ai_category || report.category}</strong><span>{report.description || "No description"}</span><small>{report.latitude}, {report.longitude}</small></div><span className={`priority ${String(report.priority || "LOW").toLowerCase()}-priority`}>{report.priority || "LOW"}</span><select value={report.status || "pending"} onChange={(event) => updateStatus(report.id, event.target.value)}><option value="pending">Pending</option><option value="assigned">Assigned</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option></select><select value={report.priority || "LOW"} onChange={(event) => updatePriority(report.id, event.target.value)}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></div>)}</div></div>
        <div className="dashboard-panel recent-panel"><h2>Waste map</h2><WasteMap reports={reports} hotspots={hotspots} /></div>
        {analytics && <div className="dashboard-panel recent-panel"><h2>Analytics</h2><p>Average resolution: {analytics.averageResolutionDays || "Not enough data"} days</p><p>Categories: {analytics.byCategory.map((item) => `${item.label} (${item.count})`).join(", ") || "No data"}</p><p>Statuses: {analytics.byStatus.map((item) => `${item.label} (${item.count})`).join(", ") || "No data"}</p></div>}
      </main>
    </div>
  );
}

export default AuthorityDashboard;

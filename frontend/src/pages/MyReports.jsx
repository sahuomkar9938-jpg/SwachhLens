import { useEffect, useMemo, useState } from "react";
import "../App.css";
import { API_BASE_URL, api } from "../services/api";

const FILTERS = ["all", "pending", "assigned", "in_progress", "resolved"];

function MyReports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getMyReports()
      .then((data) => setReports(data.reports || []))
      .catch((requestError) => setError(requestError.message));
  }, []);

  const visibleReports = useMemo(() => reports.filter((report) => {
    const matchesFilter = filter === "all" || report.status === filter;
    const query = search.toLowerCase();
    return matchesFilter && (!query || [report.category, report.ai_category, report.description]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }), [filter, reports, search]);

  return (
    <section className="reports-view">
      <div className="page-heading-row">
        <div>
          <span className="panel-label">REPORT HISTORY</span>
          <h1>My Reports</h1>
          <p>Track reports submitted from your account.</p>
        </div>
        <input
          className="report-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search reports"
          aria-label="Search reports"
        />
      </div>

      <div className="filter-row">
        {FILTERS.map((value) => (
          <button
            key={value}
            className={filter === value ? "filter-button active" : "filter-button"}
            onClick={() => setFilter(value)}
          >
            {value.replace("_", " ")}
          </button>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}
      {!error && visibleReports.length === 0 && <div className="empty-page"><div className="empty-icon">📋</div><h2>No reports found</h2><p>Your submitted reports will appear here.</p></div>}

      <div className="reports-list">
        {visibleReports.map((report) => (
          <button className="report-card" key={report.id} onClick={() => setSelectedReport(report)}>
            <img src={`${API_BASE_URL.replace(/\/api$/, "")}${report.image_url}`} alt="Reported waste" />
            <div>
              <strong>{report.category}</strong>
              <span>AI: {report.ai_category || "Unavailable"}</span>
              <small>{new Date(report.created_at).toLocaleDateString()} · {report.latitude}, {report.longitude}</small>
            </div>
            <div className="report-card-meta">
              <span className={`priority ${String(report.priority || "LOW").toLowerCase()}-priority`}>{report.priority || "LOW"}</span>
              <span className={`status ${String(report.status || "pending")}-status`}>{String(report.status || "pending").replace("_", " ")}</span>
              <small>{report.ai_amount || "Unknown amount"}</small>
            </div>
          </button>
        ))}
      </div>

      {selectedReport && (
        <div className="report-detail-panel">
          <button className="back-button" onClick={() => setSelectedReport(null)}>Close</button>
          <h2>Report #{selectedReport.id}</h2>
          <p>{selectedReport.description || "No citizen description provided."}</p>
          <p><strong>Location:</strong> {selectedReport.latitude}, {selectedReport.longitude}</p>
          <p><strong>AI recommendation:</strong> {selectedReport.ai_disposal_recommendation || "Manual review required."}</p>
          <p><strong>Objects:</strong> {Array.isArray(selectedReport.ai_objects_detected) ? selectedReport.ai_objects_detected.join(", ") || "None detected" : "Unavailable"}</p>
        </div>
      )}
    </section>
  );
}

export default MyReports;

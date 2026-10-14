import { useEffect, useState } from "react";
import "../App.css";
import { api } from "../services/api";

function WorkerDashboard({ onLogout }) {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [proofFiles, setProofFiles] = useState({});
  const [proofNotes, setProofNotes] = useState({});
  const loadReports = () => api.getWorkerTasks().then((data) => setReports(data.reports || []));
  useEffect(() => { loadReports().catch((requestError) => setError(requestError.message)); }, []);
  const updateStatus = (id, status) => api.updateStatus(id, status).then(loadReports).catch((requestError) => setError(requestError.message));
  const submitProof = async (event, reportId) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("proofImage", proofFiles[reportId]);
    formData.append("notes", proofNotes[reportId] || "");
    try {
      await api.submitCleanupProof(reportId, formData);
      setError("");
      await loadReports();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return <div className="dashboard"><main className="dashboard-main"><header className="dashboard-header"><div><span className="dashboard-label">FIELD WORKER PORTAL</span><h1>Assigned cleanup tasks</h1><p>Complete assigned work and keep the evidence trail current.</p></div><button className="logout-button" onClick={onLogout}>🚪 Logout</button></header>{error && <div className="error-message">{error}</div>}<div className="reports-list">{reports.map((report) => <div className="report-card" key={report.id}><div><strong>#{report.id} {report.ai_category || report.category}</strong><span>Priority: {report.priority || "LOW"}</span><small>{report.ai_disposal_recommendation || "Manual inspection required."}</small></div><select value={report.status || "assigned"} onChange={(event) => updateStatus(report.id, event.target.value)}><option value="assigned">Assigned</option><option value="accepted">Accepted</option><option value="in_progress">In Progress</option><option value="cleanup_completed">Cleanup Completed</option><option value="resolved">Resolved</option></select><form onSubmit={(event) => submitProof(event, report.id)}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProofFiles({ ...proofFiles, [report.id]: event.target.files[0] })} required /><input placeholder="Cleanup notes" value={proofNotes[report.id] || ""} onChange={(event) => setProofNotes({ ...proofNotes, [report.id]: event.target.value })} /><button type="submit" className="filter-button">Upload proof</button></form></div>)}</div></main></div>;
}

export default WorkerDashboard;

import { useEffect, useState } from "react";
import "../App.css";
import { api } from "../services/api";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { api.getAlerts().then((data) => setAlerts(data.alerts || [])).catch((requestError) => setError(requestError.message)); }, []);
  const markRead = (id) => api.updateAlert(id).then(() => setAlerts((items) => items.map((item) => item.id === id ? { ...item, is_read: true } : item)));
  return <section className="reports-view"><span className="panel-label">NOTIFICATIONS</span><h1>Alerts</h1><p>Updates about your reports and cleanup work.</p>{error && <div className="error-message">{error}</div>}<div className="alerts-list">{alerts.map((alert) => <div className={alert.is_read ? "alert-item read" : "alert-item"} key={alert.id}><div><strong>{alert.message}</strong><small>{new Date(alert.created_at).toLocaleString()}</small></div>{!alert.is_read && <button className="filter-button" onClick={() => markRead(alert.id)}>Mark read</button>}</div>)}{!error && alerts.length === 0 && <div className="empty-page"><div className="empty-icon">🔔</div><h2>No alerts</h2><p>New report updates will appear here.</p></div>}</div></section>;
}

export default Alerts;

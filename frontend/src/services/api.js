export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

export const api = {
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (details) => request("/auth/register", { method: "POST", body: JSON.stringify(details) }),
  getProfile: () => request("/auth/me"),
  updateProfile: (details) => request("/auth/me", { method: "PATCH", body: JSON.stringify(details) }),
  createReport: (formData) => request("/reports", { method: "POST", body: formData }),
  getMyReports: () => request("/reports/my"),
  getReportStats: () => request("/reports/stats"),
  getHotspots: () => request("/reports/hotspots"),
  getReport: (id) => request(`/reports/${id}`),
  getAlerts: () => request("/alerts"),
  updateAlert: (id) => request(`/alerts/${id}/read`, { method: "PATCH" }),
  getAuthorityReports: () => request("/reports"),
  getAnalytics: () => request("/reports/analytics"),
  getWorkerTasks: () => request("/reports/worker"),
  updateStatus: (id, status) => request(`/reports/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  updatePriority: (id, priority) => request(`/reports/${id}/priority`, { method: "PATCH", body: JSON.stringify({ priority }) }),
  assignReport: (id, workerId) => request(`/reports/${id}/assign`, { method: "PATCH", body: JSON.stringify({ workerId }) }),
  submitCleanupProof: (id, formData) => request(`/reports/${id}/cleanup-proof`, { method: "POST", body: formData }),
};

import { useEffect, useState } from "react";
import "../App.css";
import { api } from "../services/api";

function Settings({ onUserUpdated }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProfile().then((data) => setForm({ firstName: data.user.first_name, lastName: data.user.last_name || "", phone: data.user.phone || "" })).catch((requestError) => setError(requestError.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const data = await api.updateProfile(form);
      onUserUpdated({ firstName: data.user.first_name, lastName: data.user.last_name, phone: data.user.phone });
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return <section className="reports-view"><span className="panel-label">ACCOUNT</span><h1>Settings</h1><p>Update your allowed profile information.</p>{message && <div className="success-message">{message}</div>}{error && <div className="error-message">{error}</div>}<form className="settings-form" onSubmit={submit}><label>First name<input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required /></label><label>Last name<input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label><label>Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><button className="submit-report-button" type="submit">Save changes</button></form></section>;
}

export default Settings;

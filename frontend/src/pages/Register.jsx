import { useState } from "react";
import "../App.css";
import { api } from "../services/api";

function Register({ onBackToLogin }) {
  const [role, setRole] = useState("citizen");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "citizen",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 5.5 Input Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // 5.6 Registration Function
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await api.register(formData);

      setMessage("Account created successfully! 🎉");

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "citizen",
      });
      setRole("citizen");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-logo">🌿</div>

        <h1>Create Account</h1>

        <p className="register-subtitle">
          Join SwachhLens and help build cleaner cities.
        </p>

        {/* 5.14 ROLE SELECTION */}
        <div className="role-section">
          <label>Select Account Type</label>

          <div className="role-grid">
            <button
              type="button"
              className={`role-card ${role === "citizen" ? "active-role" : ""}`}
              onClick={() => {
                setRole("citizen");
                setFormData({
                  ...formData,
                  role: "citizen",
                });
              }}
            >
              <span>👤</span>
              <strong>Citizen</strong>
              <small>Report waste</small>
            </button>

            <button
              type="button"
              className={`role-card ${role === "authority" ? "active-role" : ""}`}
              onClick={() => {
                setRole("authority");
                setFormData({
                  ...formData,
                  role: "authority",
                });
              }}
            >
              <span>🏛️</span>
              <strong>Authority</strong>
              <small>Manage complaints</small>
            </button>

            <button
              type="button"
              className={`role-card ${role === "field" ? "active-role" : ""}`}
              onClick={() => {
                setRole("field");
                setFormData({
                  ...formData,
                  role: "field",
                });
              }}
            >
              <span>👷</span>
              <strong>Field Team</strong>
              <small>Cleanup operations</small>
            </button>
          </div>
        </div>

        {/* 5.15 DISPLAY MESSAGES */}
        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* 5.7 CONNECT FORM */}
        <form onSubmit={handleRegister}>
          <div className="form-row">
            {/* 5.8 FIRST NAME */}
            <div className="input-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            {/* 5.9 LAST NAME */}
            <div className="input-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* 5.10 EMAIL */}
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* 5.11 PHONE */}
          <div className="input-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+91 XXXXX XXXXX"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {/* 5.12 PASSWORD */}
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* 5.13 CONFIRM PASSWORD */}
          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <label className="terms">
            <input type="checkbox" required />
            <span>I agree to the Terms & Privacy Policy</span>
          </label>

          <button type="submit" className="register-button">
            Create Account →
          </button>
        </form>

        <p className="back-login">
          Already have an account?{" "}
          <button type="button" onClick={onBackToLogin}>
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
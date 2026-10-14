import { useState } from "react";
import "./App.css";
import Register from "./pages/Register";
import CitizenDashboard from "./pages/CitizenDashboard";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import { api } from "./services/api";

function App() {
  const [page, setPage] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // 7.5 Add authentication state
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 7.5 Add logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLoggedInUser(null);
    setPage("login");
  };

  const handleUserUpdated = (updates) => {
    const updatedUser = { ...loggedInUser, ...updates };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setLoggedInUser(updatedUser);
  };

  // 6.7 / 7.6 Login Handler Function
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      const data = await api.login({ email, password });

      // Save JWT
      localStorage.setItem("token", data.token);

      // Save user information
      localStorage.setItem("user", JSON.stringify(data.user));

      // 7.6 Set logged in user state
      setLoggedInUser(data.user);

      console.log("Logged in user:", data.user);
    } catch (error) {
      console.error(error);
      setLoginError("Cannot connect to the backend.");
    }
  };

  // 7.7 Show dashboard after login
  if (loggedInUser?.role === "citizen") {
    return (
      <CitizenDashboard
        user={loggedInUser}
        onLogout={handleLogout}
        onUserUpdated={handleUserUpdated}
      />
    );
  }

  if (["authority", "admin"].includes(loggedInUser?.role)) {
    return <AuthorityDashboard user={loggedInUser} onLogout={handleLogout} />;
  }

  if (loggedInUser?.role === "worker") {
    return <WorkerDashboard user={loggedInUser} onLogout={handleLogout} />;
  }

  if (page === "register") {
    return <Register onBackToLogin={() => setPage("login")} />;
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="brand">
          <div className="logo">🌿</div>
          <h1>SwachhLens</h1>
        </div>

        <h2>Smart Waste Management</h2>

        <p>
          Empowering citizens and authorities with AI-powered waste detection
          and intelligent cleanup decisions.
        </p>

        <div className="feature-list">
          <div>🤖 AI Waste Detection</div>
          <div>📍 Smart Hotspot Mapping</div>
          <div>🚛 Intelligent Team Dispatch</div>
          <div>♻️ Sustainable Waste Management</div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="mobile-logo">🌿</div>

          <h2>Welcome Back 👋</h2>

          <p className="login-subtitle">
            Sign in to continue to SwachhLens
          </p>

          {/* Feedback Error Message */}
          {loginError && <p className="error-message">{loginError}</p>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="login-options">
              <label>
                <input type="checkbox" />
                Remember me
              </label>

              <button type="button" className="forgot-password">
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="login-button">
              Login →
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button className="demo-button" type="button">
            Continue as Demo User
          </button>

          <p className="register-text">
            Don't have an account?{" "}
            <button type="button" onClick={() => setPage("register")}>
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
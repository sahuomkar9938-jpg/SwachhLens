require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path"); // 👉 Added: Path module
const pool = require("./config/database");

// 1. Routes Imports
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const alertRoutes = require("./routes/alertRoutes");

// 2. Initialize Express App
const app = express();

// 3. Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// 👉 9.10 Serve uploaded images statically
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// 4. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/alerts", alertRoutes);

// 5. Test Routes
app.get("/api/test", (req, res) => {
  res.json({ message: "SwachhLens backend is active!" });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connection successful!",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// 6. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("Request error:", error.message);
  const status = error.code === "LIMIT_FILE_SIZE" || error.message?.startsWith("Only ") ? 400 : 500;
  res.status(status).json({ message: status === 400 ? error.message : "Internal server error." });
});
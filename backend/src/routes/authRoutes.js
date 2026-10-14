const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // 👈 Added this missing import

const pool = require("../config/database");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// ==================== REGISTER ROUTE ====================
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Check required fields
    if (!firstName || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields.",
      });
    }

    // Public registration creates citizen accounts only. Privileged roles must be provisioned by an administrator.
    const safeRole = "citizen";

    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await pool.query(
      `INSERT INTO users
      (first_name, last_name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, email, phone, role, created_at`,
      [firstName, lastName || null, email, phone || null, passwordHash, safeRole]
    );

    res.status(201).json({
      message: "Account created successfully!",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error while creating account.",
    });
  }
});

// ==================== LOGIN ROUTE ====================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // Find user
    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login.",
    });
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = $1",
      [req.user.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "User not found." });
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Profile lookup error:", error.message);
    res.status(500).json({ message: "Unable to load profile." });
  }
});

router.patch("/me", authenticateToken, async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  if (!firstName || typeof firstName !== "string") return res.status(400).json({ message: "First name is required." });

  try {
    const result = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, phone = $3
       WHERE id = $4
       RETURNING id, first_name, last_name, email, phone, role, created_at`,
      [firstName.trim().slice(0, 100), lastName?.trim().slice(0, 100) || null, phone?.trim().slice(0, 30) || null, req.user.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "User not found." });
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Profile update error:", error.message);
    res.status(500).json({ message: "Unable to update profile." });
  }
});

module.exports = router;
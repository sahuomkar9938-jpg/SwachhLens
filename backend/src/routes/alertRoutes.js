const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, report_id, message, is_read, created_at
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 100`,
      [req.user.userId]
    );
    res.json({ alerts: result.rows });
  } catch (error) {
    console.error("Alerts error:", error.message);
    res.status(500).json({ message: "Unable to load alerts." });
  }
});

router.patch("/:id/read", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Alert not found." });
    res.json({ alert: result.rows[0] });
  } catch (error) {
    console.error("Alert update error:", error.message);
    res.status(500).json({ message: "Unable to update alert." });
  }
});

module.exports = router;

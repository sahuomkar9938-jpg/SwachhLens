const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../config/database");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { analyzeWasteImage } = require("../services/aiService");
const { calculatePriority } = require("../services/priorityService");
const { findDuplicateCandidate } = require("../services/duplicateService");
const { getHotspots } = require("../services/hotspotService");

const router = express.Router();

// 1. Directory & Storage Configuration
const uploadDirectory = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// 2. File Filter (Images Only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and WEBP images are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const reportSelect = `
  SELECT r.*, u.first_name, u.last_name,
    w.first_name AS worker_first_name, w.last_name AS worker_last_name
  FROM reports r
  LEFT JOIN users u ON u.id = r.user_id
  LEFT JOIN users w ON w.id = r.assigned_worker_id`;

router.get("/my", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `${reportSelect} WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
      [req.user.userId]
    );
    res.json({ reports: result.rows });
  } catch (error) {
    console.error("My reports error:", error.message);
    res.status(500).json({ message: "Unable to load reports." });
  }
});

router.get("/worker", authenticateToken, authorizeRoles("worker"), async (req, res) => {
  try {
    const result = await pool.query(
      `${reportSelect} WHERE r.assigned_worker_id = $1 ORDER BY r.priority DESC, r.created_at ASC`,
      [req.user.userId]
    );
    res.json({ reports: result.rows });
  } catch (error) {
    console.error("Worker reports error:", error.message);
    res.status(500).json({ message: "Unable to load assigned reports." });
  }
});

router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::integer AS total,
        COUNT(*) FILTER (WHERE status = 'pending')::integer AS pending,
        COUNT(*) FILTER (WHERE status = 'assigned')::integer AS assigned,
        COUNT(*) FILTER (WHERE status = 'in_progress')::integer AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved')::integer AS resolved
       FROM reports WHERE user_id = $1`,
      [req.user.userId]
    );
    const stats = result.rows[0];
    res.json({ stats: { ...stats, impactPoints: stats.resolved * 10 } });
  } catch (error) {
    console.error("Report stats error:", error.message);
    res.status(500).json({ message: "Unable to load report statistics." });
  }
});

router.get("/hotspots", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT latitude, longitude, category, ai_category, priority
       FROM reports WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
       ORDER BY created_at DESC`
    );
    res.json({ hotspots: getHotspots(result.rows) });
  } catch (error) {
    console.error("Hotspots error:", error.message);
    res.status(500).json({ message: "Unable to load hotspots." });
  }
});

router.get("/analytics", authenticateToken, authorizeRoles("authority", "admin"), async (req, res) => {
  try {
    const [category, status, priority, overTime, resolution] = await Promise.all([
      pool.query("SELECT COALESCE(ai_category, category) AS label, COUNT(*)::integer AS count FROM reports GROUP BY label ORDER BY count DESC"),
      pool.query("SELECT status AS label, COUNT(*)::integer AS count FROM reports GROUP BY status ORDER BY count DESC"),
      pool.query("SELECT priority AS label, COUNT(*)::integer AS count FROM reports GROUP BY priority ORDER BY count DESC"),
      pool.query("SELECT DATE(created_at) AS date, COUNT(*)::integer AS count FROM reports WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY date"),
      pool.query("SELECT ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400)::numeric, 2) AS average_resolution_days FROM reports WHERE resolved_at IS NOT NULL"),
    ]);
    res.json({
      analytics: {
        byCategory: category.rows,
        byStatus: status.rows,
        byPriority: priority.rows,
        overTime: overTime.rows,
        averageResolutionDays: resolution.rows[0].average_resolution_days,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error.message);
    res.status(500).json({ message: "Unable to load analytics." });
  }
});

router.get(
  "/",
  authenticateToken,
  authorizeRoles("authority", "admin"),
  async (req, res) => {
    try {
      const result = await pool.query(`${reportSelect} ORDER BY r.created_at DESC`);
      res.json({ reports: result.rows });
    } catch (error) {
      console.error("Authority reports error:", error.message);
      res.status(500).json({ message: "Unable to load reports." });
    }
  }
);

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`${reportSelect} WHERE r.id = $1`, [req.params.id]);
    const report = result.rows[0];
    const isAdmin = ["authority", "admin"].includes(req.user.role);
    const isWorker = report?.assigned_worker_id === req.user.userId;

    if (!report || (!isAdmin && !isWorker && report.user_id !== req.user.userId)) {
      return res.status(404).json({ message: "Report not found." });
    }

    res.json({ report });
  } catch (error) {
    console.error("Report details error:", error.message);
    res.status(500).json({ message: "Unable to load report." });
  }
});

router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("authority", "admin", "worker"),
  async (req, res) => {
    const statuses = ["pending", "assigned", "accepted", "in_progress", "cleanup_completed", "resolved", "rejected"];
    if (!statuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid report status." });
    }

    try {
      const result = await pool.query(
        `UPDATE reports SET status = $1, resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
         WHERE id = $2 AND ($3 IN ('authority', 'admin') OR assigned_worker_id = $4)
         RETURNING *`,
        [req.body.status, req.params.id, req.user.role, req.user.userId]
      );
      if (result.rowCount === 0) return res.status(404).json({ message: "Report not found." });

      await pool.query(
        "INSERT INTO notifications (user_id, report_id, message) VALUES ($1, $2, $3)",
        [result.rows[0].user_id, result.rows[0].id, `Your report status changed to ${req.body.status}.`]
      );
      res.json({ report: result.rows[0] });
    } catch (error) {
      console.error("Status update error:", error.message);
      res.status(500).json({ message: "Unable to update report status." });
    }
  }
);

router.patch(
  "/:id/priority",
  authenticateToken,
  authorizeRoles("authority", "admin"),
  async (req, res) => {
    const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (!priorities.includes(req.body.priority)) return res.status(400).json({ message: "Invalid priority." });
    try {
      const result = await pool.query(
        "UPDATE reports SET priority = $1 WHERE id = $2 RETURNING *",
        [req.body.priority, req.params.id]
      );
      if (result.rowCount === 0) return res.status(404).json({ message: "Report not found." });
      res.json({ report: result.rows[0] });
    } catch (error) {
      console.error("Priority update error:", error.message);
      res.status(500).json({ message: "Unable to update priority." });
    }
  }
);

router.patch(
  "/:id/assign",
  authenticateToken,
  authorizeRoles("authority", "admin"),
  async (req, res) => {
    const workerId = Number(req.body.workerId);
    if (!Number.isInteger(workerId)) return res.status(400).json({ message: "A valid workerId is required." });
    try {
      const worker = await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'worker'", [workerId]);
      if (worker.rowCount === 0) return res.status(400).json({ message: "Worker not found." });
      const result = await pool.query(
        "UPDATE reports SET assigned_worker_id = $1, status = 'assigned' WHERE id = $2 RETURNING *",
        [workerId, req.params.id]
      );
      if (result.rowCount === 0) return res.status(404).json({ message: "Report not found." });
      await pool.query(
        "INSERT INTO notifications (user_id, report_id, message) VALUES ($1, $2, $3)",
        [workerId, result.rows[0].id, "A new waste report has been assigned to you."]
      );
      res.json({ report: result.rows[0] });
    } catch (error) {
      console.error("Assignment error:", error.message);
      res.status(500).json({ message: "Unable to assign report." });
    }
  }
);

router.post(
  "/:id/cleanup-proof",
  authenticateToken,
  authorizeRoles("worker"),
  upload.single("proofImage"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "Cleanup proof image is required." });
      const report = await pool.query(
        "SELECT id FROM reports WHERE id = $1 AND assigned_worker_id = $2",
        [req.params.id, req.user.userId]
      );
      if (report.rowCount === 0) {
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ message: "Assigned report not found." });
      }

      const result = await pool.query(
        `INSERT INTO cleanup_proofs (report_id, worker_id, image_url, notes)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.params.id, req.user.userId, `/uploads/${req.file.filename}`, req.body.notes || null]
      );
      await pool.query("UPDATE reports SET status = 'cleanup_completed' WHERE id = $1", [req.params.id]);
      res.status(201).json({ proof: result.rows[0] });
    } catch (error) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      console.error("Cleanup proof error:", error.message);
      res.status(500).json({ message: "Unable to save cleanup proof." });
    }
  }
);

// 3. Create Waste Report API Route
router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const uploadedImage = req.file;

      if (!uploadedImage) {
        return res.status(400).json({
          message: "Waste image is required.",
        });
      }

      const { category, description, latitude, longitude } = req.body;

      const latitudeNumber = Number(latitude);
      const longitudeNumber = Number(longitude);

      if (
        !category ||
        !Number.isFinite(latitudeNumber) ||
        !Number.isFinite(longitudeNumber) ||
        latitudeNumber < -90 ||
        latitudeNumber > 90 ||
        longitudeNumber < -180 ||
        longitudeNumber > 180
      ) {
        return res.status(400).json({
          message: "A valid category and location are required.",
        });
      }

      let aiAnalysis;
      let aiStatus = "unavailable";

      try {
        aiAnalysis = await analyzeWasteImage(uploadedImage.path);
        aiStatus = "available";
      } catch (aiError) {
        console.error("Waste image analysis failed.");
        aiAnalysis = null;
      }

      const duplicate = await findDuplicateCandidate({
        latitude: latitudeNumber,
        longitude: longitudeNumber,
        category,
      });
      const priorityData = calculatePriority({
        analysis: aiAnalysis || { category },
        nearbyReportCount: duplicate ? 1 : 0,
      });

      const result = await pool.query(
        `INSERT INTO reports
        (
          user_id,
          image_url,
          category,
          description,
          latitude,
          longitude,
          status,
          priority,
          ai_category,
          ai_confidence,
          ai_volume,
          ai_severity,
          ai_objects_detected,
          ai_estimated_count,
          ai_condition,
          ai_clean_or_dirty,
          ai_wet_or_dry,
          ai_recyclable,
          ai_amount,
          ai_disposal_recommendation,
          ai_description,
          ai_model,
          ai_status,
          duplicate_candidate,
          duplicate_of_report_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        RETURNING *`,
        [
          userId,
          `/uploads/${uploadedImage.filename}`,
          category,
          description || null,
          latitudeNumber,
          longitudeNumber,
          priorityData.priority,
          aiAnalysis?.garbage_type || null,
          aiAnalysis?.confidence || null,
          aiAnalysis?.amount || null,
          aiAnalysis?.severity || null,
          JSON.stringify(aiAnalysis?.objects_detected || []),
          aiAnalysis?.estimated_count ?? null,
          aiAnalysis?.condition || null,
          aiAnalysis?.clean_or_dirty || null,
          aiAnalysis?.wet_or_dry || null,
          aiAnalysis?.recyclable ?? null,
          aiAnalysis?.amount || null,
          aiAnalysis?.disposal_recommendation || null,
          aiAnalysis?.description || null,
          aiAnalysis?.model_used || null,
          aiStatus,
          Boolean(duplicate),
          duplicate?.id || null,
        ]
      );

      const report = result.rows[0];
      if (duplicate) {
        await pool.query(
          "INSERT INTO notifications (user_id, report_id, message) VALUES ($1, $2, $3)",
          [userId, report.id, `Possible duplicate of report #${duplicate.id}. An authority will review it.`]
        );
      }

      if (priorityData.priority === "CRITICAL") {
        await pool.query(
          `INSERT INTO notifications (user_id, report_id, message)
           SELECT id, $1, $2 FROM users WHERE role IN ('authority', 'admin')`,
          [report.id, "Critical waste report detected."]
        );
      }

      res.status(201).json({
        message: "Waste report created successfully! 🎉",
        report,
        ai_analysis: aiAnalysis,
        priority: priorityData,
        duplicate_candidate: Boolean(duplicate),
      });
    } catch (error) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      console.error("Report creation error:", error.message);
      res.status(500).json({
        message: "Unable to create report.",
      });
    }
  }
);

module.exports = router;
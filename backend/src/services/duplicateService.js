const pool = require("../config/database");

async function findDuplicateCandidate({ latitude, longitude, category }) {
  const result = await pool.query(
    `SELECT id, category
     FROM reports
     WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
       AND status NOT IN ('resolved', 'rejected')
       AND LOWER(category) = LOWER($3)
       AND (6371 * acos(LEAST(1, GREATEST(-1,
         cos(radians($1::numeric)) * cos(radians(latitude)) *
         cos(radians(longitude) - radians($2::numeric)) +
         sin(radians($1::numeric)) * sin(radians(latitude))
       )))) <= 0.5
     ORDER BY created_at DESC
     LIMIT 1`,
    [latitude, longitude, category]
  );

  return result.rows[0] || null;
}

module.exports = { findDuplicateCandidate };

const AMOUNT_SCORE = {
  low: 10,
  medium: 25,
  high: 40,
};

const TYPE_SCORE = {
  "Electronic Waste": 20,
  "Medical Waste": 25,
  "Organic Waste": 10,
  "Food Waste": 10,
  Plastic: 12,
  Metal: 12,
  Glass: 12,
  "Mixed Waste": 15,
};

const SEVERITY_SCORE = {
  low: 0,
  medium: 10,
  high: 20,
  critical: 30,
};

function calculatePriority({ analysis = {}, nearbyReportCount = 0, createdAt = new Date() }) {
  const reasons = [];
  let score = AMOUNT_SCORE[analysis.amount] || 0;
  const wasteType = analysis.garbage_type || analysis.category;
  score += TYPE_SCORE[wasteType] || 0;
  score += SEVERITY_SCORE[String(analysis.severity || "").toLowerCase()] || 0;

  const count = Number(analysis.estimated_count);
  if (Number.isFinite(count) && count >= 10) {
    score += 20;
    reasons.push("Many visible items");
  } else if (Number.isFinite(count) && count >= 5) {
    score += 10;
    reasons.push("Several visible items");
  }

  if (analysis.amount === "high") reasons.push("High visible waste amount");
  if (wasteType) reasons.push(`Waste type: ${wasteType}`);
  if (analysis.severity) reasons.push(`Reported visual severity: ${analysis.severity}`);

  if (nearbyReportCount > 0) {
    score += Math.min(nearbyReportCount * 5, 20);
    reasons.push(`${nearbyReportCount} recent nearby unresolved report(s)`);
  }

  const ageHours = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 36e5);
  if (ageHours >= 72) {
    score += 10;
    reasons.push("Report has been open for at least 72 hours");
  }

  score = Math.min(100, Math.round(score));
  const priority = score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";

  if (reasons.length === 0) reasons.push("Limited visual risk signals available");
  return { score, priority, reasons };
}

module.exports = { calculatePriority };

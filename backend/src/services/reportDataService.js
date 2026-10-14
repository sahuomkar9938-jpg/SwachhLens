function normalizeAiAnalysis(raw, model) {
  const analysis = raw || {};
  const allowedTypes = new Set([
    "Plastic", "Paper", "Cardboard", "Glass", "Metal", "Organic Waste",
    "Food Waste", "Electronic Waste", "Textile", "Mixed Waste", "Other",
  ]);
  const allowedAmounts = new Set(["low", "medium", "high"]);
  const garbageType = allowedTypes.has(analysis.garbage_type) ? analysis.garbage_type : "Other";
  const objects = Array.isArray(analysis.objects_detected)
    ? analysis.objects_detected.filter((item) => typeof item === "string").slice(0, 50)
    : [];
  const count = Number(analysis.estimated_count);

  if (!analysis.description || !analysis.disposal_recommendation || !allowedAmounts.has(analysis.amount)) {
    throw new Error("AI response failed validation");
  }

  return {
    garbage_type: garbageType,
    objects_detected: objects,
    estimated_count: Number.isInteger(count) && count >= 0 ? count : 0,
    condition: String(analysis.condition || "Unknown").slice(0, 500),
    clean_or_dirty: String(analysis.clean_or_dirty || "Unknown").slice(0, 30),
    wet_or_dry: String(analysis.wet_or_dry || "Unknown").slice(0, 30),
    recyclable: typeof analysis.recyclable === "boolean" ? analysis.recyclable : null,
    confidence: Number.isFinite(Number(analysis.confidence))
      ? Math.max(0, Math.min(100, Number(analysis.confidence)))
      : null,
    amount: analysis.amount,
    disposal_recommendation: String(analysis.disposal_recommendation).slice(0, 1000),
    description: String(analysis.description).slice(0, 1000),
    severity: typeof analysis.severity === "string" ? analysis.severity.slice(0, 20) : null,
    model_used: model,
  };
}

module.exports = { normalizeAiAnalysis };

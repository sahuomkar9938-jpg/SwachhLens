function distanceInKilometers(first, second) {
  const latitudeDelta = (second.latitude - first.latitude) * Math.PI / 180;
  const longitudeDelta = (second.longitude - first.longitude) * Math.PI / 180;
  const latitude = first.latitude * Math.PI / 180;
  const value = Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 * Math.cos(latitude) *
    Math.cos(second.latitude * Math.PI / 180);
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function getHotspots(reports) {
  const clusters = [];

  for (const report of reports) {
    const existing = clusters.find((cluster) => distanceInKilometers(cluster, report) <= 0.5);
    if (existing) {
      existing.reports.push(report);
      existing.latitude = existing.reports.reduce((sum, item) => sum + Number(item.latitude), 0) / existing.reports.length;
      existing.longitude = existing.reports.reduce((sum, item) => sum + Number(item.longitude), 0) / existing.reports.length;
    } else {
      clusters.push({ latitude: Number(report.latitude), longitude: Number(report.longitude), reports: [report] });
    }
  }

  return clusters
    .filter((cluster) => cluster.reports.length > 1)
    .map((cluster) => {
      const categories = cluster.reports.map((report) => report.ai_category || report.category);
      const dominantCategory = categories.sort((first, second) =>
        categories.filter((item) => item === second).length - categories.filter((item) => item === first).length
      )[0];
      const priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
      const priority = priorities.find((level) => cluster.reports.some((report) => report.priority === level)) || "LOW";

      return {
        latitude: Number(cluster.latitude.toFixed(6)),
        longitude: Number(cluster.longitude.toFixed(6)),
        report_count: cluster.reports.length,
        dominant_category: dominantCategory,
        priority,
        risk_level: priority,
      };
    });
}

module.exports = { getHotspots };

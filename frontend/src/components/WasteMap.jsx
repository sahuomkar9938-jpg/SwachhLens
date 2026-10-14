import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../App.css";

const COLORS = {
  CRITICAL: "#dc3545",
  HIGH: "#fd7e14",
  MEDIUM: "#e0a800",
  LOW: "#198754",
};

function WasteMap({ reports = [], hotspots = [], height = "360px" }) {
  const locations = [...reports, ...hotspots].filter((item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)));
  const center = locations.length ? [Number(locations[0].latitude), Number(locations[0].longitude)] : [20.5937, 78.9629];

  return (
    <div className="waste-map" style={{ height }}>
      <MapContainer center={center} zoom={locations.length ? 13 : 5} scrollWheelZoom className="waste-map-container">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {reports.map((report) => {
          const priority = report.priority || "LOW";
          return <CircleMarker key={`report-${report.id}`} center={[Number(report.latitude), Number(report.longitude)]} pathOptions={{ color: COLORS[priority] || COLORS.LOW, fillColor: COLORS[priority] || COLORS.LOW, fillOpacity: 0.75 }} radius={9}><Popup><strong>{report.category}</strong><br />AI: {report.ai_category || "Unavailable"}<br />Priority: {priority}<br />Status: {report.status}<br />Date: {new Date(report.created_at).toLocaleDateString()}<br />{report.description || "No description"}</Popup></CircleMarker>;
        })}
        {hotspots.map((hotspot, index) => <CircleMarker key={`hotspot-${index}`} center={[Number(hotspot.latitude), Number(hotspot.longitude)]} pathOptions={{ color: COLORS[hotspot.priority] || COLORS.LOW, fillColor: COLORS[hotspot.priority] || COLORS.LOW, fillOpacity: 0.35 }} radius={14}><Popup><strong>AI-assisted hotspot risk estimation</strong><br />Category: {hotspot.dominant_category}<br />Reports: {hotspot.report_count}<br />Risk: {hotspot.risk_level}</Popup></CircleMarker>)}
      </MapContainer>
    </div>
  );
}

export default WasteMap;

import { useState } from "react";
import "../App.css";
import { api } from "../services/api";

function ReportWaste({ onBack }) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState({
    latitude: "",
    longitude: "",
  });
  const [image, setImage] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
  };

  // Detect location
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoadingLocation(false);
      },
      () => {
        setError("Unable to detect your location.");
        setLoadingLocation(false);
      }
    );
  };

  // Submit report
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setAiUnavailable(false);

    if (!image) {
      setError("Please upload a waste image.");
      return;
    }

    if (!category) {
      setError("Please select a waste category.");
      return;
    }

    if (!location.latitude || !location.longitude) {
      setError("Please detect your location.");
      return;
    }

    try {
      setLoadingAnalysis(true);
      const formData = new FormData();
      formData.append("image", image);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("latitude", location.latitude);
      formData.append("longitude", location.longitude);

      const data = await api.createReport(formData);

      setMessage("Waste report submitted successfully! 🎉");
      setAiAnalysis(data.ai_analysis);
      setAiUnavailable(!data.ai_analysis);
      setCategory("");
      setDescription("");
      setLocation({
        latitude: "",
        longitude: "",
      });
      setImage(null);
    } catch (err) {
      console.error(err);
      setError("Unable to submit report.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-page-header">
        <div>
          <span className="panel-label">CITIZEN REPORTING</span>
          <h1>Report Waste</h1>
          <p>Help keep your community clean by reporting waste near you.</p>
        </div>

        <button className="back-button" onClick={onBack}>
          ← Dashboard
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      {aiAnalysis && !aiAnalysis.error && (
        <div className="ai-analysis-card">
          <span className="panel-label">AI WASTE ANALYSIS</span>
          <h2>AI Waste Analysis</h2>
          <div className="ai-analysis-grid">
            <span>Waste Type<strong>{aiAnalysis.garbage_type}</strong></span>
            <span>Objects Detected<strong>{aiAnalysis.objects_detected?.join(", ") || "None detected"}</strong></span>
            <span>Estimated Count<strong>{aiAnalysis.estimated_count}</strong></span>
            <span>Condition<strong>{aiAnalysis.condition}</strong></span>
            <span>Clean / Dirty<strong>{aiAnalysis.clean_or_dirty}</strong></span>
            <span>Wet / Dry<strong>{aiAnalysis.wet_or_dry}</strong></span>
            <span>Recyclable<strong>{aiAnalysis.recyclable === null ? "Unknown" : aiAnalysis.recyclable ? "Yes" : "No"}</strong></span>
            <span>Amount<strong>{aiAnalysis.amount}</strong></span>
            {Number.isFinite(aiAnalysis.confidence) && <span>Confidence<strong>{aiAnalysis.confidence}%</strong></span>}
            <span>AI Model<strong>{aiAnalysis.model_used}</strong></span>
          </div>
          <p><strong>Disposal recommendation:</strong> {aiAnalysis.disposal_recommendation}</p>
          <p>{aiAnalysis.description}</p>
        </div>
      )}
      {aiUnavailable && <div className="ai-analysis-card"><span className="panel-label">AI WASTE ANALYSIS</span><h2>Analysis unavailable</h2><p>This report was saved and is available for manual review.</p></div>}

      <form className="report-form" onSubmit={handleSubmit}>
        {/* IMAGE */}
        <div className="form-section">
          <h2>📸 Waste Image</h2>
          <p>Upload a clear photo of the waste.</p>

          <label className="image-upload">
            {image ? (
              <div className="selected-image">
                <span>📷</span>
                <strong>{image.name}</strong>
                <small>{(image.size / 1024 / 1024).toFixed(2)} MB</small>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📷</div>
                <strong>Upload waste image</strong>
                <span>Click here to browse</span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        </div>

        {/* CATEGORY */}
        <div className="form-section">
          <h2>🗑️ Waste Category</h2>
          <p>Select the type of waste.</p>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select waste category</option>
            <option value="plastic">Plastic Waste</option>
            <option value="organic">Organic Waste</option>
            <option value="paper">Paper Waste</option>
            <option value="metal">Metal Waste</option>
            <option value="construction">Construction Waste</option>
            <option value="electronic">Electronic Waste</option>
            <option value="mixed">Mixed Waste</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* DESCRIPTION */}
        <div className="form-section">
          <h2>📝 Description</h2>
          <p>Tell us more about the waste.</p>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: Large garbage pile near the road..."
            rows="5"
          />
        </div>

        {/* LOCATION */}
        <div className="form-section">
          <div className="location-header">
            <div>
              <h2>📍 Location</h2>
              <p>Detect where the waste was found.</p>
            </div>

            <button
              type="button"
              className="location-button"
              onClick={detectLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? "Detecting..." : "📍 Detect My Location"}
            </button>
          </div>

          {location.latitude && (
            <div className="location-result">
              <span>✅</span>
              <div>
                <strong>Location detected</strong>
                <small>
                  Latitude: {location.latitude}
                  <br />
                  Longitude: {location.longitude}
                </small>
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT */}
        <button type="submit" className="submit-report-button" disabled={loadingAnalysis}>
          {loadingAnalysis ? "Analyzing image..." : "Submit Waste Report →"}
        </button>
      </form>
    </div>
  );
}

export default ReportWaste;
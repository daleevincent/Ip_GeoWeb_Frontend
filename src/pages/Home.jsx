import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/global.css";

// Map updater for changing view when new coordinates are loaded
function MapUpdater({ loc }) {
  const map = useMap();
  if (loc) map.setView(loc.split(",").map(Number), 10);
  return null;
}

function Home() {
  const navigate = useNavigate();
  const [geoData, setGeoData] = useState(null);
  const [searchIp, setSearchIp] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Token from localStorage
  const token = localStorage.getItem("token");
  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ── Load current IP and history on mount ──
  useEffect(() => {
  let isMounted = true;

  const loadData = async () => {
    try {
      // Load current IP info
      const geoRes = await axios.get("https://ipinfo.io/geo");
      if (isMounted) setGeoData(geoRes.data);

      // Load history only if token exists
      if (token) {
        try {
          const histRes = await axios.get(`${BASE_URL}/api/history`, authHeaders);
          if (isMounted) {
            setHistory(histRes.data.map((item) => ({ ...item, selected: false })));
          }
        } catch {
          // <-- silently ignore history fetch errors
          // console.error("Failed to fetch history:", err.response?.data || err);
          // Do NOT setError here to avoid showing "Failed to fetch search history."
        }
      }

    } catch {
      if (isMounted) setError("Failed to fetch IP information."); // only for IP info
    }
  };

  loadData();
  return () => { isMounted = false; };
}, [authHeaders, BASE_URL, token]);

  // ── Refresh history ──
  const refreshHistory = async () => {
    if (!token) return;
    try {
      const histRes = await axios.get(`${BASE_URL}/api/history`, authHeaders);
      setHistory(histRes.data.map((item) => ({ ...item, selected: false })));
    } catch {
      setError("Failed to refresh history.");
    }
  };

  // ── Fetch IP info and optionally save to history ──
  const fetchGeoByIp = async (ip = searchIp, save = true) => {
    setError("");
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      setError("Please enter a valid IPv4 address.");
      return;
    }

    setLoading(true);

    // Fetch IP info
    try {
      const response = await axios.get(`https://ipinfo.io/${ip}/geo`);
      setGeoData(response.data);
    } catch {
      setError("IP address not found or network error.");
      setLoading(false);
      return;
    }

    // Save to history only if logged in
    if (save && token) {
      try {
        await axios.post(`${BASE_URL}/api/history`, { ip }, authHeaders);
        await refreshHistory();
      } catch (error) {
        console.error("Failed to save history:", error.response?.data || error);
        setError("Failed to save search history.");
      }
    } else if (save && !token) {
      setError("You are not logged in. Cannot save search history.");
    }

    setLoading(false);
  };

  // ── Clear search input ──
  const clearSearch = async () => {
    setSearchIp("");
    setError("");
    try {
      const response = await axios.get("https://ipinfo.io/geo");
      setGeoData(response.data);
    } catch {
      setError("Failed to fetch current IP.");
    }
  };

  // ── Toggle select in history ──
  const toggleSelect = (index) => {
    setHistory((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  // ── Select / deselect all ──
  const selectAll = () => {
    const allSelected = history.every((i) => i.selected);
    setHistory((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  // ── Delete selected history items ──
  const deleteSelected = async () => {
    const toDelete = history.filter((item) => item.selected);
    try {
      await Promise.all(
        toDelete.map((item) => axios.delete(`${BASE_URL}/api/history/${item.id}`, authHeaders))
      );
      await refreshHistory();
    } catch {
      setError("Failed to delete selected items.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") fetchGeoByIp(searchIp);
  };

  const selectedCount = history.filter((i) => i.selected).length;

  return (
    <div className="container">
      {/* ─── Header ─── */}
      <div className="header">
        <div className="header-brand">
          <div className="brand-icon">🌐</div>
          <h2>GeoTracer</h2>
        </div>
        <button className="btn-ghost" onClick={handleLogout}>
          Sign out
        </button>
      </div>

      {/* ─── Search ─── */}
      <div className="searchBox">
        <input
          type="text"
          placeholder="Enter an IPv4 address…"
          value={searchIp}
          onChange={(e) => setSearchIp(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={() => fetchGeoByIp(searchIp)} disabled={loading}>
          {loading ? "Looking up…" : "Search"}
        </button>
        <button className="btn-ghost" onClick={clearSearch}>
          Clear
        </button>
      </div>

      {/* ─── Error ─── */}
      {error && <div className="error">⚠️ {error}</div>}

      {/* ─── Geo Info ─── */}
      {geoData && (
        <div className="card">
          <p className="section-title">Location Details</p>
          <div className="geo-grid">
            {[
              { label: "IP", value: geoData.ip },
              { label: "City", value: geoData.city || "—" },
              { label: "Region", value: geoData.region || "—" },
              { label: "Country", value: geoData.country || "—" },
              { label: "Coordinates", value: geoData.loc || "—" },
              { label: "Org", value: geoData.org || "—" },
            ].map(({ label, value }) => (
              <div className="geo-item" key={label}>
                <div className="geo-label">{label}</div>
                <p className="geo-value">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Map ─── */}
      {geoData?.loc && (
        <div className="card" style={{ padding: "0", overflow: "hidden" }}>
          <MapContainer
            center={geoData.loc.split(",").map(Number)}
            zoom={10}
            style={{ height: "340px", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={geoData.loc.split(",").map(Number)}>
              <Popup>
                {geoData.city}, {geoData.country}
              </Popup>
            </Marker>
            <MapUpdater loc={geoData.loc} />
          </MapContainer>
        </div>
      )}

      {/* ─── History ─── */}
      <div className="history card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <p className="section-title" style={{ margin: 0 }}>
            Search History
          </p>
          {history.length > 0 && (
            <button
              className="btn-ghost"
              onClick={selectAll}
              style={{ padding: "4px 12px", fontSize: "0.75rem" }}
            >
              {history.every((i) => i.selected) ? "Deselect all" : "Select all"}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            No searches yet. Look up an IP to get started.
          </div>
        ) : (
          <ul>
            {history.map((item, index) => (
              <li
                key={item.id}
                className={item.selected ? "selected" : ""}
                onClick={() => toggleSelect(index)}
              >
                <input
                  type="checkbox"
                  checked={item.selected || false}
                  onChange={() => toggleSelect(index)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span
                  className="ip-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchGeoByIp(item.ip, false); // do not re-save
                  }}
                >
                  {item.ip}
                </span>
                {item.created_at && (
                  <span className="ip-time">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {selectedCount > 0 && (
          <div className="history-footer">
            <button className="btn-danger" onClick={deleteSelected}>
              Delete {selectedCount} selected
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
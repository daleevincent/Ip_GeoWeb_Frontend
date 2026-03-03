import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/global.css";

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

  const token = localStorage.getItem("token");
  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token],
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [geoRes, histRes] = await Promise.all([
          axios.get("https://ipinfo.io/geo"),
          axios.get("http://localhost:8000/api/history", authHeaders),
        ]);
        if (isMounted) {
          setGeoData(geoRes.data);
          setHistory(
            histRes.data.map((item) => ({ ...item, selected: false })),
          );
        }
      } catch {
        if (isMounted) setError("Failed to fetch IP information or history.");
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [authHeaders]);

  const refreshHistory = async () => {
    const histRes = await axios.get(
      "http://localhost:8000/api/history",
      authHeaders,
    );
    setHistory(histRes.data.map((item) => ({ ...item, selected: false })));
  };

  const fetchGeoByIp = async (ip = searchIp, save = true) => {
    setError("");
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      setError("Please enter a valid IPv4 address.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`https://ipinfo.io/${ip}/geo`);
      setGeoData(response.data);

      if (save) {
        await axios.post(
          "http://localhost:8000/api/history",
          { ip },
          authHeaders,
        );
        await refreshHistory();
      }
    } catch {
      setError("IP address not found or network error.");
    } finally {
      setLoading(false);
    }
  };

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

  const toggleSelect = (index) => {
    setHistory((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const selectAll = () => {
    const allSelected = history.every((i) => i.selected);
    setHistory((prev) =>
      prev.map((item) => ({ ...item, selected: !allSelected })),
    );
  };

  const deleteSelected = async () => {
    const toDelete = history.filter((item) => item.selected);
    try {
      await Promise.all(
        toDelete.map((item) =>
          axios.delete(
            `http://localhost:8000/api/history/${item.id}`,
            authHeaders,
          ),
        ),
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
                    fetchGeoByIp(item.ip, false); // ← already in history, don't re-save
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

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import sateliteWebp from "../assets/icons/satelite.webp";



const satelliteIcon = new L.Icon({
  iconUrl: sateliteWebp,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function RecenterButton({ latest, mapRef, isCentered, onRecenter }) {
  return (
    !isCentered && (
      <button
        className="fixed bottom-8 right-8 z-[60] px-5 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
        onClick={() => {
          if (mapRef.current) {
            mapRef.current.setView([latest.satlatitude, latest.satlongitude], mapRef.current.getZoom(), { animate: true });
            onRecenter();
          }
        }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="white" strokeWidth="2" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41m0-14.14l1.41 1.41m11.32 11.32l1.41 1.41M12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>
        Track Satellite
      </button>
    )
  );
}

export default function SatellitePositions() {
  const [positions, setPositions] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [isCentered, setIsCentered] = useState(true);
  const [location, setLocation] = useState("Loading...");
  const mapRef = useRef(null);

  // Define latest immediately after positions
  const latest = positions.length > 0 ? positions[positions.length - 1] : null;

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const id = 25544; // ISS NORAD ID
        const lat = 41.702;
        const lng = -76.014;
        const alt = 0;
        const seconds = 10;

        const url = `http://localhost:5000/api/satellite/${id}/${lat}/${lng}/${alt}/${seconds}`;
        const response = await axios.get(url);

        setPositions(response.data.positions || []);
      } catch (error) {
        console.error("Error fetching positions:", error.message);
      }
    };

    fetchPositions();
    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchPositions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // When new position arrives, check if map is centered
    if (mapRef.current && latest) {
      const map = mapRef.current;
      const center = map.getCenter();
      const dist = Math.sqrt(
        Math.pow(center.lat - latest.satlatitude, 2) +
        Math.pow(center.lng - latest.satlongitude, 2)
      );
      setIsCentered(dist < 0.01); // threshold for "centered"
    }
  }, [positions, latest]);

  useEffect(() => {
    if (!latest) return;
    const fetchLocation = async () => {
      try {
        const url = `http://localhost:5000/api/reverse-geocode/${latest.satlatitude}/${latest.satlongitude}`;
        const response = await axios.get(url);
        setLocation(response.data.location || "Unknown/Ocean");
      } catch (error) {
        setLocation("Unknown/Ocean");
      }
    };
    fetchLocation();
  }, [latest]);

  if (!positions || positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 text-lg">No positions available</p>
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Satellite Positions</h2>
        <button
          onClick={() => setShowLog((v) => !v)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-medium"
        >
          {showLog ? "Hide Log" : "Show Log"}
        </button>
      </div>
      <div className="mb-8 flex gap-8 flex-wrap">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow flex-1 min-w-[220px] border border-blue-100">
          <div className="text-gray-500 mb-2 text-lg">Latest Position</div>
          <div className="space-y-2 text-lg">
            <div>
              <span className="font-semibold">Latitude:</span>{" "}
              <span className="text-blue-700">{latest.satlatitude.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-semibold">Longitude:</span>{" "}
              <span className="text-blue-700">{latest.satlongitude.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-semibold">Altitude:</span>{" "}
              <span className="text-blue-700">{latest.sataltitude.toFixed(2)} km</span>
            </div>
            <div>
              <span className="font-semibold">Location:</span>{" "}
              <span className="text-blue-700">{location}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden shadow-lg border border-blue-100">
        <MapContainer
          center={[latest.satlatitude, latest.satlongitude]}
          zoom={3}
          style={{ height: "500px", width: "100%" }}
          className="rounded-xl"
          whenCreated={mapInstance => { mapRef.current = mapInstance; }}
          onMove={() => {
            if (mapRef.current && positions.length > 0) {
              const map = mapRef.current;
              const center = map.getCenter();
              const dist = Math.sqrt(
                Math.pow(center.lat - latest.satlatitude, 2) +
                Math.pow(center.lng - latest.satlongitude, 2)
              );
              setIsCentered(dist < 0.01);
            }
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker
            position={[latest.satlatitude, latest.satlongitude]}
            icon={satelliteIcon}
          >
            <Popup>
              <div>
                <p>
                  <strong>Latitude:</strong> {latest.satlatitude.toFixed(2)}
                </p>
                <p>
                  <strong>Longitude:</strong> {latest.satlongitude.toFixed(2)}
                </p>
                <p>
                  <strong>Altitude:</strong> {latest.sataltitude.toFixed(2)} km
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
        <RecenterButton
          latest={latest}
          mapRef={mapRef}
          isCentered={isCentered}
          onRecenter={() => setIsCentered(true)}
        />
      </div>
      {/* Log Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl border-l z-50 transition-transform duration-300 ${
          showLog ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ maxHeight: "100vh", overflowY: "auto" }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-700">Live Position Log</h3>
          <button
            onClick={() => setShowLog(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <ul className="p-4 space-y-3">
          {positions.map((pos, idx) => (
            <li
              key={idx}
              className={`rounded-lg p-3 bg-gray-50 shadow-sm border ${
                idx === positions.length - 1 ? "border-blue-500 bg-blue-50" : ""
              }`}
            >
              <div>
                <span className="font-medium">Lat:</span>{" "}
                <span>{pos.satlatitude.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">Lng:</span>{" "}
                <span>{pos.satlongitude.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">Alt:</span>{" "}
                <span>{pos.sataltitude.toFixed(2)} km</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom satellite icon
const satelliteIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3212/3212608.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function SatellitePositions() {
  const [positions, setPositions] = useState([]);

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
  }, []);

  if (!positions || positions.length === 0) {
    return <p className="text-gray-500">No positions available</p>;
  }

  const latest = positions[positions.length - 1]; // last known position

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Satellite Positions</h2>
      <MapContainer
        center={[latest.satlatitude, latest.satlongitude]}
        zoom={3}
        style={{ height: "500px", width: "100%" }}
        className="rounded-lg shadow-lg"
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
    </div>
  );
}

// server.js (or routes/positions.js)
import express from "express";
import axios from "axios";

const app = express();

app.get("/api/positions", async (req, res) => {
  try {
    // Extract query params
    const { lat, lng, alt, seconds } = req.query;

    if (!lat || !lng || !seconds) {
      return res.status(400).json({ error: "lat, lng, and seconds are required" });
    }

    // Example call to external API (adjust to your source)
    const response = await axios.get("https://api.n2yo.com/rest/v1/satellite/positions/25544", {
      params: {
        observer_lat: lat,
        observer_lng: lng,
        observer_alt: alt || 0,
        seconds: seconds,
        apiKey: process.env.N2YO_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching positions:", error.message);
    res.status(500).json({ error: "Failed to fetch positions" });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));

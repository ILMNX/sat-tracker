// backend/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow Vite dev server by default, override with CORS_ORIGIN in .env if needed
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));

// simple in-memory cache to avoid hammering N2YO while dev/testing
const cache = new Map();
function cacheKey(id, lat, lng, alt, seconds) {
  return `${id}:${lat}:${lng}:${alt}:${seconds}`;
}

app.get('/api/satellite/:id/:lat/:lng/:alt/:seconds', async (req, res) => {
  try {
    const { id, lat, lng, alt, seconds } = req.params;
    const key = cacheKey(id, lat, lng, alt, seconds);
    const now = Date.now();

    if (cache.has(key)) {
      const { ts, data } = cache.get(key);
      if (now - ts < 30 * 1000) { // reuse for 30s
        return res.json(data);
      }
    }

    const apiKey = process.env.N2YO_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'N2YO_API_KEY not set in backend/.env' });

    const url = `https://api.n2yo.com/rest/v1/satellite/positions/${id}/${lat}/${lng}/${alt}/${seconds}/?apiKey=${apiKey}`;
    const r = await axios.get(url, { timeout: 8000 });
    cache.set(key, { ts: now, data: r.data });
    res.json(r.data);
  } catch (err) {
    console.error('backend error', err.message || err);
    res.status(500).json({ error: 'Failed to fetch satellite data' });
  }
});

app.get('/api/reverse-geocode/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const apiKey = process.env.OPENCAGE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENCAGE_API_KEY not set' });
    }

    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat},${lng}&key=${apiKey}`;
    const r = await axios.get(url, { timeout: 8000 });

    if (r.data && r.data.results && r.data.results.length > 0) {
      const result = r.data.results[0];
      // Check if the location is in the ocean or unknown
      if (
        result.components &&
        (result.components._type === 'ocean' ||
         result.components._type === 'water' ||
         result.components.ocean ||
         result.formatted.toLowerCase().includes('ocean'))
      ) {
        return res.json({ location: 'Unknown/Ocean', raw: result });
      }
      const location = result.formatted;
      return res.json({ location, raw: result });
    } else {
      return res.json({ location: 'Unknown/Ocean' });
    }
  } catch (err) {
    console.error('Reverse geocode error', err.message);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

app.get('/test', (req, res) => res.send('OK'));

// Log requests
app.use((req, res, next) => {
  console.log('Request:', req.method, req.url);
  next();
});

app.listen(PORT, () => {
  console.log(`Backend listening at http://localhost:${PORT}`);
});

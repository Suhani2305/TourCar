const axios = require('axios');

/**
 * Real-time Route Helper using Google Maps Distance Matrix API.
 */

// Simple in-memory cache to avoid repeated API calls for same routes
const routeCache = new Map();

const getTravelTime = async (from, to) => {
    if (!from || !to) return 1;

    const f = from.toLowerCase().trim();
    const t = to.toLowerCase().trim();

    // 1. Same city/location logic
    if (f === t || f.includes(t) || t.includes(f)) return 1;

    // 2. Check Cache
    const cacheKey = `${f}-${t}`;
    if (routeCache.has(cacheKey)) return routeCache.get(cacheKey);

    // 3. Google Maps API Call
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ GOOGLE_MAPS_API_KEY missing in .env. Using fallback estimation.');
        return estimateFallback(f, t);
    }

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: from,
                destinations: to,
                key: apiKey,
                mode: 'driving',
                region: 'in' // Prioritize India
            }
        });

        if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
            const durationInSeconds = response.data.rows[0].elements[0].duration.value;
            const hours = Math.ceil(durationInSeconds / 3600);

            // Add 1 hour extra for traffic/safety margin in India
            const finalBuffer = hours + 1;

            routeCache.set(cacheKey, finalBuffer);
            return finalBuffer;
        } else {
            console.error('Google Maps API Error:', response.data.error_message || 'Route not found');
            return estimateFallback(f, t);
        }
    } catch (error) {
        console.error('Distance Matrix API call failed:', error.message);
        return estimateFallback(f, t);
    }
};

// Fallback estimation if API fails or key missing
const estimateFallback = (f, t) => {
    // Basic heuristic: Inter-city India usually takes time
    // If locations are provided, assume at least 4 hours for unknown outstation
    return 4;
};

module.exports = { getTravelTime };

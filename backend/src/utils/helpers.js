/**
 * Calculates the distance between two geo coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if a given lat/lng is within the configured geofence.
 * @param {number} lat
 * @param {number} lng
 * @returns {boolean}
 */
const isWithinGeofence = (lat, lng) => {
  const officeLat = parseFloat(process.env.GEO_LAT);
  const officeLng = parseFloat(process.env.GEO_LNG);
  const radius = parseFloat(process.env.GEO_RADIUS_METERS || 500);

  if (isNaN(officeLat) || isNaN(officeLng)) return true; // skip if not configured

  const distance = haversineDistance(officeLat, officeLng, lat, lng);
  return distance <= radius;
};

/**
 * Get today's date string in YYYY-MM-DD format
 */
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Format hours to readable string e.g. "8h 30m"
 */
const formatHours = (decimalHours) => {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  return `${h}h ${m}m`;
};

module.exports = { haversineDistance, isWithinGeofence, getTodayDate, formatHours };

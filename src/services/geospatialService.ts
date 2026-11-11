/**
 * Geospatial Utilities for RuralCare 360
 * Haversine formula, compass bearing, ETA calculation, and distance helpers.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Calculates Great-Circle distance between two points on Earth using the Haversine formula.
 * Returns distance in kilometers (km) accurate to 2 decimal places.
 */
export function calculateHaversineDistance(
  point1: LatLng,
  point2: LatLng
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Calculates initial compass bearing / heading in degrees (0 - 360) from point1 to point2.
 */
export function calculateBearing(point1: LatLng, point2: LatLng): number {
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Estimates travel time in minutes based on rural transit conditions (avg 35 km/h) plus 2 min handling overhead.
 */
export function estimateEtaMinutes(distanceKm: number, speedKmh: number = 35): number {
  if (distanceKm <= 0.1) return 1;
  const transitMinutes = (distanceKm / speedKmh) * 60;
  return Math.max(1, Math.round(transitMinutes + 1.5));
}

/**
 * Formats distance in km or meters for clean UI display.
 */
export function formatDistance(km?: number): string {
  if (km === undefined || km === null || isNaN(km)) return '--';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Formats estimated time of arrival.
 */
export function formatEta(minutes?: number): string {
  if (minutes === undefined || minutes === null || isNaN(minutes)) return '--';
  if (minutes <= 1) return '< 1 min';
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  }
  return `${minutes} mins`;
}

/**
 * Checks if a location update timestamp is considered stale (> 60 seconds without packet).
 */
export function isLocationStale(lastLocationIso?: string, thresholdSeconds: number = 60): boolean {
  if (!lastLocationIso) return true;
  const diffMs = Date.now() - new Date(lastLocationIso).getTime();
  return diffMs > thresholdSeconds * 1000;
}

/**
 * Formats relative time elapsed since last GPS ping (e.g. "Just now", "45s ago", "2 mins ago").
 */
export function formatLastPingTime(lastLocationIso?: string): string {
  if (!lastLocationIso) return 'Never';
  const diffSec = Math.floor((Date.now() - new Date(lastLocationIso).getTime()) / 1000);
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHrs = Math.floor(diffMin / 60);
  return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Default rural healthcare cluster coordinates for testing and demo evaluation:
 * Bilaspur / Mandla Primary Health Centre (Madhya Pradesh, India)
 */
export const RURAL_DEMO_COORDINATES: LatLng = {
  latitude: 22.5992,
  longitude: 80.3712,
};


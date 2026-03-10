import { v4 as uuidv4 } from 'uuid';

// Calculate haversine distance between two coordinates (in km)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Estimate travel time based on distance (simple calculation)
// Assumes average speed of 40 km/h in city with emergency lights
export const estimateTravelTime = (distanceKm: number): number => {
  const avgSpeedKmh = 40;
  const timeHours = distanceKm / avgSpeedKmh;
  return Math.ceil(timeHours * 60); // Convert to minutes and round up
};

// Generate request ID for logging/tracing
export const generateRequestId = (): string => {
  return uuidv4();
};

// Safe JSON parse
export const safeJSONParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

// Retry helper for external API calls
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError!;
};

// Sanitize phone number
export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/[^\d+]/g, '');
};

// Check if location is within bounds
export const isLocationValid = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Calculate bearing between two points (in degrees)
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return bearing;
};

// Format duration for display
export const formatDuration = (minutes: number): string => {
  if (minutes < 1) {
    return '< 1 min';
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  }
  
  return `${hours}h ${mins}m`;
};

// Check if ambulance is moving (based on location updates)
export const isAmbulanceMoving = (
  prevLat: number,
  prevLng: number,
  currentLat: number,
  currentLng: number,
  thresholdMeters: number = 50
): boolean => {
  const distanceKm = calculateDistance(prevLat, prevLng, currentLat, currentLng);
  const distanceMeters = distanceKm * 1000;
  return distanceMeters > thresholdMeters;
};

// Calculate speed from two location points and time difference
export const calculateSpeed = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  timeDiffSeconds: number
): number => {
  if (timeDiffSeconds === 0) return 0;
  
  const distanceKm = calculateDistance(lat1, lng1, lat2, lng2);
  const timeHours = timeDiffSeconds / 3600;
  return distanceKm / timeHours; // km/h
};

// Validate GPS accuracy
export const isGPSAccuracyAcceptable = (accuracyMeters: number): boolean => {
  const threshold = parseInt(process.env.GPS_ACCURACY_THRESHOLD_METERS || '50');
  return accuracyMeters <= threshold;
};

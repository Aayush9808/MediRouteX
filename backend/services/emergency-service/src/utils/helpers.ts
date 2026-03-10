import { v4 as uuidv4 } from 'uuid';

// Generate emergency number (E-2024-XXXX format)
export const generateEmergencyNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `E-${year}-${random}`;
};

// Calculate priority score based on severity and other factors
export const calculatePriorityScore = (severity: string, patientAge?: string): number => {
  let score = 5; // Default medium priority
  
  // Severity scoring
  switch (severity) {
    case 'Critical':
      score = 10;
      break;
    case 'High':
      score = 8;
      break;
    case 'Medium':
      score = 5;
      break;
    case 'Low':
      score = 3;
      break;
  }
  
  // Age factor (elderly and children get higher priority)
  if (patientAge) {
    const age = parseInt(patientAge);
    if (!isNaN(age)) {
      if (age < 5 || age > 65) {
        score = Math.min(score + 1, 10);
      }
    }
  }
  
  return score;
};

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

// Format response time for display
export const formatResponseTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
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

// Check if emergency is overdue (past target response time)
export const isEmergencyOverdue = (createdAt: Date, targetMinutes: number = 8): boolean => {
  const now = new Date();
  const elapsedMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  return elapsedMinutes > targetMinutes;
};

/**
 * Hospital Service Helper Functions
 * Utility functions for calculations, formatting, and common operations
 */

import { v4 as uuidv4 } from 'uuid';
import { BedCapacity, CapacityAlert } from '../types';

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return uuidv4();
}

// ==================== Distance & Location Helpers ====================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
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
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate travel time to hospital
 * @param distanceKm Distance in kilometers
 * @param isEmergency Whether this is an emergency (affects average speed)
 * @returns Estimated time in minutes
 */
export function estimateTravelTime(distanceKm: number, isEmergency: boolean = true): number {
  // Average speeds: Emergency = 50 km/h, Normal = 30 km/h
  const averageSpeed = isEmergency ? 50 : 30;
  const timeInHours = distanceKm / averageSpeed;
  return Math.ceil(timeInHours * 60); // Convert to minutes
}

// ==================== Bed Capacity Helpers ====================

/**
 * Calculate occupancy percentage
 */
export function calculateOccupancyPercent(occupied: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
}

/**
 * Check if hospital has critical capacity
 */
export function isCriticalCapacity(available: number, total: number, threshold: number = 10): boolean {
  if (total === 0) return false;
  const availablePercent = (available / total) * 100;
  return availablePercent <= threshold;
}

/**
 * Check if hospital has low capacity
 */
export function isLowCapacity(available: number, total: number, threshold: number = 20): boolean {
  if (total === 0) return false;
  const availablePercent = (available / total) * 100;
  return availablePercent <= threshold && availablePercent > 10;
}

/**
 * Generate capacity alert if needed
 */
export function generateCapacityAlert(
  hospitalId: string,
  hospitalName: string,
  bedCapacity: BedCapacity
): CapacityAlert | null {
  const { bed_type, available_beds, total_beds } = bedCapacity;
  const occupancyPercent = calculateOccupancyPercent(
    total_beds - available_beds,
    total_beds
  );

  if (available_beds === 0) {
    return {
      hospital_id: hospitalId,
      hospital_name: hospitalName,
      alert_type: 'full_capacity',
      bed_type,
      available_beds,
      total_beds,
      occupancy_percent: occupancyPercent,
      timestamp: new Date(),
    };
  }

  if (isCriticalCapacity(available_beds, total_beds)) {
    return {
      hospital_id: hospitalId,
      hospital_name: hospitalName,
      alert_type: 'critical_capacity',
      bed_type,
      available_beds,
      total_beds,
      occupancy_percent: occupancyPercent,
      timestamp: new Date(),
    };
  }

  if (isLowCapacity(available_beds, total_beds)) {
    return {
      hospital_id: hospitalId,
      hospital_name: hospitalName,
      alert_type: 'low_capacity',
      bed_type,
      available_beds,
      total_beds,
      occupancy_percent: occupancyPercent,
      timestamp: new Date(),
    };
  }

  return null;
}

/**
 * Validate bed capacity numbers
 */
export function validateBedCapacity(bedCapacity: {
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  reserved_beds: number;
  maintenance_beds: number;
}): { valid: boolean; error?: string } {
  const { total_beds, available_beds, occupied_beds, reserved_beds, maintenance_beds } =
    bedCapacity;

  // Check for negative values
  if (
    total_beds < 0 ||
    available_beds < 0 ||
    occupied_beds < 0 ||
    reserved_beds < 0 ||
    maintenance_beds < 0
  ) {
    return { valid: false, error: 'Bed counts cannot be negative' };
  }

  // Check if sum matches total
  const sum = available_beds + occupied_beds + reserved_beds + maintenance_beds;
  if (sum !== total_beds) {
    return {
      valid: false,
      error: `Sum of bed types (${sum}) does not match total beds (${total_beds})`,
    };
  }

  return { valid: true };
}

// ==================== Data Formatting Helpers ====================

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as +91-XXXXX-XXXXX for Indian numbers
  if (cleaned.length === 10) {
    return `+91-${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }

  // Format with country code if present
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91-${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }

  return phone; // Return original if format unknown
}

/**
 * Format address for display
 */
export function formatAddress(
  address: string,
  city: string,
  state: string,
  pincode: string
): string {
  return `${address}, ${city}, ${state} - ${pincode}`;
}

/**
 * Sanitize hospital name for URL/slug
 */
export function sanitizeHospitalName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ==================== Retry Logic Helpers ====================

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== Date/Time Helpers ====================

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Check if timestamp is within last N minutes
 */
export function isWithinLastMinutes(timestamp: Date, minutes: number): boolean {
  const now = new Date();
  const diffMs = now.getTime() - new Date(timestamp).getTime();
  return diffMs <= minutes * 60 * 1000;
}

// ==================== Array Helpers ====================

/**
 * Remove duplicates from array
 */
export function uniqueArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Group array by key
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

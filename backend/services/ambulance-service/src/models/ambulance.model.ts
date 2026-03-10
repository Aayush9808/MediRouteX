import { query } from '../config/database';
import { logger } from '../utils/logger';
import {
  Ambulance,
  CreateAmbulanceInput,
  UpdateAmbulanceStatusInput,
  UpdateLocationInput,
  PaginationParams,
  FilterAmbulancesParams,
  PaginatedResponse,
  AmbulanceWithDistance,
  AmbulanceStats,
} from '../types';
import { estimateTravelTime } from '../utils/helpers';

export class AmbulanceModel {
  // Create new ambulance
  static async create(input: CreateAmbulanceInput): Promise<Ambulance> {
    const sql = `
      INSERT INTO ambulances (
        registration_number,
        type,
        equipment_level,
        status,
        base_location,
        base_location_address
      ) VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7)
      RETURNING 
        id,
        registration_number as "registrationNumber",
        type,
        equipment_level as "equipmentLevel",
        status,
        ST_X(current_location::geometry) as "currentLocationLng",
        ST_Y(current_location::geometry) as "currentLocationLat",
        last_location_update as "lastLocationUpdate",
        driver_id as "driverId",
        driver_name as "driverName",
        driver_phone as "driverPhone",
        assigned_emergency_id as "assignedEmergencyId",
        ST_X(base_location::geometry) as "baseLocationLng",
        ST_Y(base_location::geometry) as "baseLocationLat",
        base_location_address as "baseLocationAddress",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      input.registrationNumber,
      input.type,
      input.equipmentLevel || 'Standard',
      'Available',
      input.baseLocation.lng,
      input.baseLocation.lat,
      input.baseLocation.address,
    ];

    const result = await query<Ambulance>(sql, values);

    logger.info('Ambulance created', {
      id: result.rows[0].id,
      registrationNumber: input.registrationNumber,
    });

    return result.rows[0];
  }

  // Find ambulance by ID
  static async findById(id: string): Promise<Ambulance | null> {
    const sql = `
      SELECT 
        id,
        registration_number as "registrationNumber",
        type,
        equipment_level as "equipmentLevel",
        status,
        ST_X(current_location::geometry) as "currentLocationLng",
        ST_Y(current_location::geometry) as "currentLocationLat",
        last_location_update as "lastLocationUpdate",
        driver_id as "driverId",
        driver_name as "driverName",
        driver_phone as "driverPhone",
        assigned_emergency_id as "assignedEmergencyId",
        ST_X(base_location::geometry) as "baseLocationLng",
        ST_Y(base_location::geometry) as "baseLocationLat",
        base_location_address as "baseLocationAddress",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ambulances
      WHERE id = $1
    `;

    const result = await query<Ambulance>(sql, [id]);
    return result.rows[0] || null;
  }

  // Find ambulance by registration number
  static async findByRegistrationNumber(regNumber: string): Promise<Ambulance | null> {
    const sql = `
      SELECT 
        id,
        registration_number as "registrationNumber",
        type,
        equipment_level as "equipmentLevel",
        status,
        ST_X(current_location::geometry) as "currentLocationLng",
        ST_Y(current_location::geometry) as "currentLocationLat",
        last_location_update as "lastLocationUpdate",
        driver_id as "driverId",
        driver_name as "driverName",
        driver_phone as "driverPhone",
        assigned_emergency_id as "assignedEmergencyId",
        ST_X(base_location::geometry) as "baseLocationLng",
        ST_Y(base_location::geometry) as "baseLocationLat",
        base_location_address as "baseLocationAddress",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ambulances
      WHERE registration_number = $1
    `;

    const result = await query<Ambulance>(sql, [regNumber]);
    return result.rows[0] || null;
  }

  // Find all ambulances with pagination and filters
  static async findAll(
    params: PaginationParams,
    filters: FilterAmbulancesParams = {}
  ): Promise<PaginatedResponse<Ambulance>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.type) {
      conditions.push(`type = $${paramIndex++}`);
      values.push(filters.type);
    }

    if (filters.hasDriver !== undefined) {
      if (filters.hasDriver) {
        conditions.push(`driver_id IS NOT NULL`);
      } else {
        conditions.push(`driver_id IS NULL`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM ambulances ${whereClause}`;
    const countResult = await query<{ count: string }>(countSql, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const dataSql = `
      SELECT 
        id,
        registration_number as "registrationNumber",
        type,
        equipment_level as "equipmentLevel",
        status,
        ST_X(current_location::geometry) as "currentLocationLng",
        ST_Y(current_location::geometry) as "currentLocationLat",
        last_location_update as "lastLocationUpdate",
        driver_id as "driverId",
        driver_name as "driverName",
        driver_phone as "driverPhone",
        assigned_emergency_id as "assignedEmergencyId",
        ST_X(base_location::geometry) as "baseLocationLng",
        ST_Y(base_location::geometry) as "baseLocationLat",
        base_location_address as "baseLocationAddress",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ambulances
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    values.push(limit, offset);
    const dataResult = await query<Ambulance>(dataSql, values);

    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  // Find nearest ambulances using PostGIS
  static async findNearby(
    lat: number,
    lng: number,
    maxDistanceKm: number = 50,
    filters: { type?: string; status?: string } = {}
  ): Promise<AmbulanceWithDistance[]> {
    const conditions: string[] = ['current_location IS NOT NULL'];
    const values: any[] = [lng, lat, maxDistanceKm];
    let paramIndex = 4;

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.type) {
      conditions.push(`type = $${paramIndex++}`);
      values.push(filters.type);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        id,
        registration_number as "registrationNumber",
        type,
        equipment_level as "equipmentLevel",
        status,
        ST_X(current_location::geometry) as "currentLocationLng",
        ST_Y(current_location::geometry) as "currentLocationLat",
        last_location_update as "lastLocationUpdate",
        driver_id as "driverId",
        driver_name as "driverName",
        driver_phone as "driverPhone",
        assigned_emergency_id as "assignedEmergencyId",
        ST_X(base_location::geometry) as "baseLocationLng",
        ST_Y(base_location::geometry) as "baseLocationLat",
        base_location_address as "baseLocationAddress",
        created_at as "createdAt",
        updated_at as "updatedAt",
        ST_Distance(
          current_location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000 as "distanceKm"
      FROM ambulances
      WHERE ${whereClause}
        AND ST_DWithin(
          current_location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3 * 1000
        )
      ORDER BY "distanceKm" ASC
      LIMIT 10
    `;

    const result = await query<AmbulanceWithDistance>(sql, values);

    // Add estimated time
    return result.rows.map(ambulance => ({
      ...ambulance,
      estimatedTimeMinutes: estimateTravelTime(ambulance.distanceKm),
    }));
  }

  // Update ambulance status
  static async updateStatus(
    id: string,
    input: UpdateAmbulanceStatusInput
  ): Promise<Ambulance | null> {
    const sql = `
      UPDATE ambulances
      SET 
        status = $1,
        assigned_emergency_id = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING 
        id,
        registration_number as "registrationNumber",
        type,
        equipment_level as "equipmentLevel",
        status,
        ST_X(current_location::geometry) as "currentLocationLng",
        ST_Y(current_location::geometry) as "currentLocationLat",
        last_location_update as "lastLocationUpdate",
        driver_id as "driverId",
        driver_name as "driverName",
        driver_phone as "driverPhone",
        assigned_emergency_id as "assignedEmergencyId",
        ST_X(base_location::geometry) as "baseLocationLng",
        ST_Y(base_location::geometry) as "baseLocationLat",
        base_location_address as "baseLocationAddress",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      input.status,
      input.assignedEmergencyId !== undefined ? input.assignedEmergencyId : null,
      id,
    ];

    const result = await query<Ambulance>(sql, values);

    if (result.rows[0]) {
      logger.info('Ambulance status updated', {
        id,
        status: input.status,
        assignedEmergencyId: input.assignedEmergencyId,
      });
    }

    return result.rows[0] || null;
  }

  // Update ambulance location
  static async updateLocation(
    id: string,
    location: UpdateLocationInput
  ): Promise<Ambulance | null> {
    const sql = `
      UPDATE ambulances
      SET 
        current_location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
        last_location_update = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING 
        id,
        registration_number as "registrationNumber",
        type,
        equipment_level as "equipmentLevel",
        status,
        ST_X(current_location::geometry) as "currentLocationLng",
        ST_Y(current_location::geometry) as "currentLocationLat",
        last_location_update as "lastLocationUpdate",
        driver_id as "driverId",
        driver_name as "driverName",
        driver_phone as "driverPhone",
        assigned_emergency_id as "assignedEmergencyId",
        ST_X(base_location::geometry) as "baseLocationLng",
        ST_Y(base_location::geometry) as "baseLocationLat",
        base_location_address as "baseLocationAddress",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query<Ambulance>(sql, [location.lng, location.lat, id]);
    return result.rows[0] || null;
  }

  // Assign driver to ambulance
  static async assignDriver(
    id: string,
    driverId: string,
    driverName: string,
    driverPhone: string
  ): Promise<Ambulance | null> {
    const sql = `
      UPDATE ambulances
      SET 
        driver_id = $1,
        driver_name = $2,
        driver_phone = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING 
        id,
        registration_number as "registrationNumber",
        type,
        equipment_level as "equipmentLevel",
        status,
        ST_X(current_location::geometry) as "currentLocationLng",
        ST_Y(current_location::geometry) as "currentLocationLat",
        last_location_update as "lastLocationUpdate",
        driver_id as "driverId",
        driver_name as "driverName",
        driver_phone as "driverPhone",
        assigned_emergency_id as "assignedEmergencyId",
        ST_X(base_location::geometry) as "baseLocationLng",
        ST_Y(base_location::geometry) as "baseLocationLat",
        base_location_address as "baseLocationAddress",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query<Ambulance>(sql, [driverId, driverName, driverPhone, id]);

    if (result.rows[0]) {
      logger.info('Driver assigned to ambulance', { ambulanceId: id, driverId, driverName });
    }

    return result.rows[0] || null;
  }

  // Remove driver from ambulance
  static async removeDriver(id: string): Promise<Ambulance | null> {
    const sql = `
      UPDATE ambulances
      SET 
        driver_id = NULL,
        driver_name = NULL,
        driver_phone = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING 
        id,
        registration_number as "registrationNumber",
        type,
        equipment_level as "equipmentLevel",
        status,
        ST_X(current_location::geometry) as "currentLocationLng",
        ST_Y(current_location::geometry) as "currentLocationLat",
        last_location_update as "lastLocationUpdate",
        driver_id as "driverId",
        driver_name as "driverName",
        driver_phone as "driverPhone",
        assigned_emergency_id as "assignedEmergencyId",
        ST_X(base_location::geometry) as "baseLocationLng",
        ST_Y(base_location::geometry) as "baseLocationLat",
        base_location_address as "baseLocationAddress",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query<Ambulance>(sql, [id]);
    return result.rows[0] || null;
  }

  // Get ambulance statistics
  static async getStats(): Promise<AmbulanceStats> {
    const sql = `
      SELECT 
        COUNT(*) as total_ambulances,
        COUNT(*) FILTER (WHERE status = 'Available') as available_ambulances,
        COUNT(*) FILTER (WHERE status = 'Busy') as busy_ambulances,
        COUNT(*) FILTER (WHERE status = 'Offline') as offline_ambulances,
        COUNT(*) FILTER (WHERE status = 'Maintenance') as maintenance_ambulances,
        COUNT(*) FILTER (WHERE type = 'Basic') as basic_count,
        COUNT(*) FILTER (WHERE type = 'Advanced') as advanced_count,
        COUNT(*) FILTER (WHERE type = 'ICU') as icu_count
      FROM ambulances
    `;

    const result = await query(sql);
    const row = result.rows[0];

    return {
      totalAmbulances: parseInt(row.total_ambulances || '0'),
      availableAmbulances: parseInt(row.available_ambulances || '0'),
      busyAmbulances: parseInt(row.busy_ambulances || '0'),
      offlineAmbulances: parseInt(row.offline_ambulances || '0'),
      maintenanceAmbulances: parseInt(row.maintenance_ambulances || '0'),
      basicCount: parseInt(row.basic_count || '0'),
      advancedCount: parseInt(row.advanced_count || '0'),
      icuCount: parseInt(row.icu_count || '0'),
      avgResponseTime: 0, // TODO: Calculate from routes table
      totalTripsToday: 0, // TODO: Calculate from routes table
    };
  }

  // Get available ambulances
  static async findAvailable(): Promise<Ambulance[]> {
    const sql = `
      SELECT 
        id,
        registration_number as "registrationNumber",
        type,
        equipment_level as "equipmentLevel",
        status,
        ST_X(current_location::geometry) as "currentLocationLng",
        ST_Y(current_location::geometry) as "currentLocationLat",
        last_location_update as "lastLocationUpdate",
        driver_id as "driverId",
        driver_name as "driverName",
        driver_phone as "driverPhone",
        assigned_emergency_id as "assignedEmergencyId",
        ST_X(base_location::geometry) as "baseLocationLng",
        ST_Y(base_location::geometry) as "baseLocationLat",
        base_location_address as "baseLocationAddress",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ambulances
      WHERE status = 'Available'
      ORDER BY created_at DESC
    `;

    const result = await query<Ambulance>(sql);
    return result.rows;
  }

  // Delete ambulance (soft delete by setting to Maintenance)
  static async delete(id: string): Promise<boolean> {
    const sql = `
      UPDATE ambulances
      SET status = 'Offline', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

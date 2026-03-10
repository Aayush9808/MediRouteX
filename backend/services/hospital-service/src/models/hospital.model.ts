/**
 * Hospital Model
 * Database operations for hospital management and bed capacity tracking
 */

import { QueryResultRow } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import logger from '../utils/logger';
import {
  Hospital,
  CreateHospitalDTO,
  UpdateHospitalDTO,
  HospitalWithDistance,
  NearbyHospitalFilters,
  HospitalSearchFilters,
  BedCapacity,
  BedCapacityDTO,
  UpdateBedCapacityDTO,
  HospitalStats,
  HospitalCapacityStats,
  PaginatedResponse,
} from '../types';

export class HospitalModel {
  // ==================== Hospital CRUD Operations ====================

  static async create(data: CreateHospitalDTO): Promise<Hospital> {
    const id = uuidv4();
    const sql = `
      INSERT INTO hospitals (
        id, name, type, address, city, state, pincode,
        location, contact_number, email, emergency_contact,
        is_trauma_center, specializations, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        ST_SetSRID(ST_MakePoint($8, $9), 4326),
        $10, $11, $12, $13, $14, 'operational'
      ) RETURNING *,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude
    `;

    const values = [
      id,
      data.name,
      data.type,
      data.address,
      data.city,
      data.state,
      data.pincode,
      data.longitude,
      data.latitude,
      data.contact_number,
      data.email,
      data.emergency_contact,
      data.is_trauma_center,
      data.specializations,
    ];

    try {
      const result = await pool.query<Hospital & QueryResultRow>(sql, values);
      logger.info(`Hospital created: ${id} - ${data.name}`);
      return this.formatHospital(result.rows[0]);
    } catch (error) {
      logger.error('Error creating hospital:', error);
      throw new Error('Failed to create hospital');
    }
  }

  static async findById(id: string): Promise<Hospital | null> {
    const sql = `
      SELECT *,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude
      FROM hospitals
      WHERE id = $1
    `;

    try {
      const result = await pool.query<Hospital & QueryResultRow>(sql, [id]);
      return result.rows.length > 0 ? this.formatHospital(result.rows[0]) : null;
    } catch (error) {
      logger.error(`Error finding hospital ${id}:`, error);
      throw new Error('Failed to fetch hospital');
    }
  }

  static async findAll(
    filters: HospitalSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Hospital>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (filters.city) {
      conditions.push(`city ILIKE $${++paramCount}`);
      values.push(`%${filters.city}%`);
    }

    if (filters.state) {
      conditions.push(`state ILIKE $${++paramCount}`);
      values.push(`%${filters.state}%`);
    }

    if (filters.hospital_type) {
      conditions.push(`type = $${++paramCount}`);
      values.push(filters.hospital_type);
    }

    if (filters.status) {
      conditions.push(`status = $${++paramCount}`);
      values.push(filters.status);
    }

    if (filters.is_trauma_center !== undefined) {
      conditions.push(`is_trauma_center = $${++paramCount}`);
      values.push(filters.is_trauma_center);
    }

    if (filters.specializations && filters.specializations.length > 0) {
      conditions.push(`specializations && $${++paramCount}`);
      values.push(filters.specializations);
    }

    if (filters.min_rating !== undefined) {
      conditions.push(`rating >= $${++paramCount}`);
      values.push(filters.min_rating);
    }

    if (filters.has_available_beds) {
      conditions.push(`available_beds > 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM hospitals ${whereClause}`;
    const countResult = await pool.query<{ count: string } & QueryResultRow>(countSql, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated data
    const dataSql = `
      SELECT *,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude
      FROM hospitals
      ${whereClause}
      ORDER BY rating DESC, name ASC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    values.push(limit, offset);

    try {
      const result = await pool.query<Hospital & QueryResultRow>(dataSql, values);
      return {
        data: result.rows.map((row) => this.formatHospital(row)),
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching hospitals:', error);
      throw new Error('Failed to fetch hospitals');
    }
  }

  static async update(id: string, data: UpdateHospitalDTO): Promise<Hospital | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.name) {
      updates.push(`name = $${++paramCount}`);
      values.push(data.name);
    }

    if (data.type) {
      updates.push(`type = $${++paramCount}`);
      values.push(data.type);
    }

    if (data.status) {
      updates.push(`status = $${++paramCount}`);
      values.push(data.status);
    }

    if (data.address) {
      updates.push(`address = $${++paramCount}`);
      values.push(data.address);
    }

    if (data.city) {
      updates.push(`city = $${++paramCount}`);
      values.push(data.city);
    }

    if (data.state) {
      updates.push(`state = $${++paramCount}`);
      values.push(data.state);
    }

    if (data.pincode) {
      updates.push(`pincode = $${++paramCount}`);
      values.push(data.pincode);
    }

    if (data.latitude !== undefined && data.longitude !== undefined) {
      updates.push(`location = ST_SetSRID(ST_MakePoint($${++paramCount}, $${++paramCount}), 4326)`);
      values.push(data.longitude, data.latitude);
    }

    if (data.contact_number) {
      updates.push(`contact_number = $${++paramCount}`);
      values.push(data.contact_number);
    }

    if (data.email) {
      updates.push(`email = $${++paramCount}`);
      values.push(data.email);
    }

    if (data.emergency_contact) {
      updates.push(`emergency_contact = $${++paramCount}`);
      values.push(data.emergency_contact);
    }

    if (data.is_trauma_center !== undefined) {
      updates.push(`is_trauma_center = $${++paramCount}`);
      values.push(data.is_trauma_center);
    }

    if (data.specializations) {
      updates.push(`specializations = $${++paramCount}`);
      values.push(data.specializations);
    }

    if (data.rating !== undefined) {
      updates.push(`rating = $${++paramCount}`);
      values.push(data.rating);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `
      UPDATE hospitals
      SET ${updates.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING *,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude
    `;

    try {
      const result = await pool.query<Hospital & QueryResultRow>(sql, values);
      if (result.rows.length === 0) {
        return null;
      }
      logger.info(`Hospital updated: ${id}`);
      return this.formatHospital(result.rows[0]);
    } catch (error) {
      logger.error(`Error updating hospital ${id}:`, error);
      throw new Error('Failed to update hospital');
    }
  }

  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM hospitals WHERE id = $1';

    try {
      const result = await pool.query(sql, [id]);
      const deleted = (result.rowCount ?? 0) > 0;
      if (deleted) {
        logger.info(`Hospital deleted: ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Error deleting hospital ${id}:`, error);
      throw new Error('Failed to delete hospital');
    }
  }

  // ==================== Nearby Hospital Search ====================

  static async findNearby(filters: NearbyHospitalFilters): Promise<HospitalWithDistance[]> {
    const {
      latitude,
      longitude,
      max_distance_km,
      required_bed_type,
      min_available_beds,
      is_trauma_center,
      specializations,
      hospital_type,
    } = filters;

    const conditions: string[] = ['h.status = \'operational\''];
    const values: any[] = [longitude, latitude, max_distance_km * 1000];
    let paramCount = 3;

    if (is_trauma_center !== undefined) {
      conditions.push(`h.is_trauma_center = $${++paramCount}`);
      values.push(is_trauma_center);
    }

    if (hospital_type) {
      conditions.push(`h.type = $${++paramCount}`);
      values.push(hospital_type);
    }

    if (specializations && specializations.length > 0) {
      conditions.push(`h.specializations && $${++paramCount}`);
      values.push(specializations);
    }

    if (required_bed_type && min_available_beds) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM bed_capacities bc
          WHERE bc.hospital_id = h.id
            AND bc.bed_type = $${++paramCount}
            AND bc.available_beds >= $${++paramCount}
        )
      `);
      values.push(required_bed_type, min_available_beds);
    }

    const sql = `
      SELECT 
        h.*,
        ST_X(h.location::geometry) as longitude,
        ST_Y(h.location::geometry) as latitude,
        ROUND(
          ST_Distance(
            h.location::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) / 1000::numeric, 2
        ) as distance_km,
        COALESCE(
          json_agg(
            json_build_object(
              'bed_type', bc.bed_type,
              'total_beds', bc.total_beds,
              'available_beds', bc.available_beds,
              'occupancy_percent', ROUND((bc.occupied_beds::numeric / NULLIF(bc.total_beds, 0)) * 100, 2)
            )
          ) FILTER (WHERE bc.id IS NOT NULL), '[]'::json
        ) as bed_availability
      FROM hospitals h
      LEFT JOIN bed_capacities bc ON h.id = bc.hospital_id
      WHERE ${conditions.join(' AND ')}
        AND ST_DWithin(
          h.location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
      GROUP BY h.id, h.location
      ORDER BY distance_km ASC
      LIMIT 10
    `;

    try {
      const result = await pool.query<any>(sql, values);
      return result.rows.map((row) => ({
        ...this.formatHospital(row),
        distance_km: parseFloat(row.distance_km),
        estimated_time_minutes: Math.ceil(parseFloat(row.distance_km) / 50 * 60), // 50 km/h avg
        bed_availability: row.bed_availability,
      }));
    } catch (error) {
      logger.error('Error finding nearby hospitals:', error);
      throw new Error('Failed to find nearby hospitals');
    }
  }

  // ==================== Bed Capacity Operations ====================

  static async createBedCapacity(hospitalId: string, data: BedCapacityDTO): Promise<BedCapacity> {
    const id = uuidv4();
    const sql = `
      INSERT INTO bed_capacities (
        id, hospital_id, bed_type, total_beds, available_beds,
        occupied_beds, reserved_beds, maintenance_beds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      id,
      hospitalId,
      data.bed_type,
      data.total_beds,
      data.available_beds,
      data.occupied_beds,
      data.reserved_beds,
      data.maintenance_beds,
    ];

    try {
      const result = await pool.query<BedCapacity & QueryResultRow>(sql, values);
      
      // Update hospital's total and available beds
      await this.updateHospitalBedCounts(hospitalId);
      
      logger.info(`Bed capacity created for hospital ${hospitalId}: ${data.bed_type}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating bed capacity:', error);
      throw new Error('Failed to create bed capacity');
    }
  }

  static async getBedCapacity(hospitalId: string): Promise<BedCapacity[]> {
    const sql = `
      SELECT * FROM bed_capacities
      WHERE hospital_id = $1
      ORDER BY bed_type
    `;

    try {
      const result = await pool.query<BedCapacity & QueryResultRow>(sql, [hospitalId]);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching bed capacity for hospital ${hospitalId}:`, error);
      throw new Error('Failed to fetch bed capacity');
    }
  }

  static async updateBedCapacity(
    hospitalId: string,
    bedType: string,
    data: UpdateBedCapacityDTO
  ): Promise<BedCapacity | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.total_beds !== undefined) {
      updates.push(`total_beds = $${++paramCount}`);
      values.push(data.total_beds);
    }

    if (data.available_beds !== undefined) {
      updates.push(`available_beds = $${++paramCount}`);
      values.push(data.available_beds);
    }

    if (data.occupied_beds !== undefined) {
      updates.push(`occupied_beds = $${++paramCount}`);
      values.push(data.occupied_beds);
    }

    if (data.reserved_beds !== undefined) {
      updates.push(`reserved_beds = $${++paramCount}`);
      values.push(data.reserved_beds);
    }

    if (data.maintenance_beds !== undefined) {
      updates.push(`maintenance_beds = $${++paramCount}`);
      values.push(data.maintenance_beds);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`last_updated = CURRENT_TIMESTAMP`, `updated_at = CURRENT_TIMESTAMP`);
    values.push(hospitalId, bedType);

    const sql = `
      UPDATE bed_capacities
      SET ${updates.join(', ')}
      WHERE hospital_id = $${++paramCount} AND bed_type = $${++paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query<BedCapacity & QueryResultRow>(sql, values);
      
      if (result.rows.length > 0) {
        // Update hospital's total and available beds
        await this.updateHospitalBedCounts(hospitalId);
        logger.info(`Bed capacity updated for hospital ${hospitalId}: ${bedType}`);
        return result.rows[0];
      }
      
      return null;
    } catch (error) {
      logger.error(`Error updating bed capacity for hospital ${hospitalId}:`, error);
      throw new Error('Failed to update bed capacity');
    }
  }

  // Update hospital's aggregated bed counts
  private static async updateHospitalBedCounts(hospitalId: string): Promise<void> {
    const sql = `
      UPDATE hospitals h
      SET 
        total_beds = (SELECT COALESCE(SUM(total_beds), 0) FROM bed_capacities WHERE hospital_id = h.id),
        available_beds = (SELECT COALESCE(SUM(available_beds), 0) FROM bed_capacities WHERE hospital_id = h.id),
        updated_at = CURRENT_TIMESTAMP
      WHERE h.id = $1
    `;

    await pool.query(sql, [hospitalId]);
  }

  // ==================== Statistics ====================

  static async getStats(): Promise<HospitalStats> {
    const sql = `
      WITH hospital_stats AS (
        SELECT
          COUNT(*) as total_hospitals,
          COUNT(*) FILTER (WHERE status = 'operational') as operational_hospitals,
          COALESCE(SUM(total_beds), 0) as total_beds_all,
          COALESCE(SUM(available_beds), 0) as available_beds_all,
          COUNT(*) FILTER (WHERE is_trauma_center = true) as trauma_centers
        FROM hospitals
      ),
      bed_type_stats AS (
        SELECT
          bc.bed_type,
          COALESCE(SUM(bc.total_beds), 0) as total_beds,
          COALESCE(SUM(bc.available_beds), 0) as available_beds,
          ROUND(
            (COALESCE(SUM(bc.occupied_beds), 0)::numeric / NULLIF(SUM(bc.total_beds), 0)) * 100, 2
          ) as occupancy_percent
        FROM bed_capacities bc
        GROUP BY bc.bed_type
      ),
      type_stats AS (
        SELECT
          type,
          COUNT(*) as count
        FROM hospitals
        GROUP BY type
      )
      SELECT
        hs.*,
        ROUND(
          (hs.total_beds_all - hs.available_beds_all)::numeric / NULLIF(hs.total_beds_all, 0) * 100, 2
        ) as avg_occupancy_percent,
        (SELECT json_agg(bts.*) FROM bed_type_stats bts) as bed_type_distribution,
        (SELECT json_agg(ts.*) FROM type_stats ts) as hospitals_by_type
      FROM hospital_stats hs
    `;

    try {
      const result = await pool.query<any>(sql);
      const row = result.rows[0];
      
      return {
        total_hospitals: parseInt(row.total_hospitals, 10),
        operational_hospitals: parseInt(row.operational_hospitals, 10),
        total_beds_all_hospitals: parseInt(row.total_beds_all, 10),
        available_beds_all_hospitals: parseInt(row.available_beds_all, 10),
        average_occupancy_percent: parseFloat(row.avg_occupancy_percent) || 0,
        bed_type_distribution: row.bed_type_distribution || [],
        hospitals_by_type: row.hospitals_by_type || [],
        trauma_centers_count: parseInt(row.trauma_centers, 10),
      };
    } catch (error) {
      logger.error('Error fetching hospital stats:', error);
      throw new Error('Failed to fetch statistics');
    }
  }

  static async getHospitalCapacityStats(hospitalId: string): Promise<HospitalCapacityStats | null> {
    const sql = `
      SELECT
        h.id as hospital_id,
        h.name as hospital_name,
        h.total_beds,
        h.available_beds,
        (h.total_beds - h.available_beds) as occupied_beds,
        (SELECT COALESCE(SUM(reserved_beds), 0) FROM bed_capacities WHERE hospital_id = h.id) as reserved_beds,
        ROUND(((h.total_beds - h.available_beds)::numeric / NULLIF(h.total_beds, 0)) * 100, 2) as overall_occupancy_percent,
        COALESCE(
          json_agg(
            json_build_object(
              'bed_type', bc.bed_type,
              'total', bc.total_beds,
              'available', bc.available_beds,
              'occupancy_percent', ROUND((bc.occupied_beds::numeric / NULLIF(bc.total_beds, 0)) * 100, 2)
            )
          ) FILTER (WHERE bc.id IS NOT NULL), '[]'::json
        ) as bed_types,
        NOW() as last_updated
      FROM hospitals h
      LEFT JOIN bed_capacities bc ON h.id = bc.hospital_id
      WHERE h.id = $1
      GROUP BY h.id
    `;

    try {
      const result = await pool.query<any>(sql, [hospitalId]);
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        hospital_id: row.hospital_id,
        hospital_name: row.hospital_name,
        total_beds: parseInt(row.total_beds, 10),
        available_beds: parseInt(row.available_beds, 10),
        occupied_beds: parseInt(row.occupied_beds, 10),
        reserved_beds: parseInt(row.reserved_beds, 10),
        overall_occupancy_percent: parseFloat(row.overall_occupancy_percent) || 0,
        bed_types: row.bed_types,
        last_updated: row.last_updated,
      };
    } catch (error) {
      logger.error(`Error fetching capacity stats for hospital ${hospitalId}:`, error);
      throw new Error('Failed to fetch capacity statistics');
    }
  }

  // ==================== Helper Methods ====================

  private static formatHospital(row: any): Hospital {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      address: row.address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      location: {
        type: 'Point',
        coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)],
      },
      contact_number: row.contact_number,
      email: row.email,
      emergency_contact: row.emergency_contact,
      is_trauma_center: row.is_trauma_center,
      specializations: row.specializations,
      rating: parseFloat(row.rating) || 0,
      total_beds: parseInt(row.total_beds, 10) || 0,
      available_beds: parseInt(row.available_beds, 10) || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export default HospitalModel;

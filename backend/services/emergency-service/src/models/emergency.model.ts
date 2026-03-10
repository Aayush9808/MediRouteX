import { query } from '../config/database';
import { Emergency, CreateEmergencyInput, PaginatedResponse, PaginationParams } from '../types';
import { generateEmergencyNumber, calculatePriorityScore } from '../utils/helpers';
import { logger } from '../utils/logger';

export class EmergencyModel {
  // Create new emergency
  static async create(input: CreateEmergencyInput, userId?: string): Promise<Emergency> {
    const emergencyNumber = generateEmergencyNumber();
    const priorityScore = calculatePriorityScore(input.severity, input.patientAge);
    
    const sql = `
      INSERT INTO emergencies (
        emergency_number, user_id, patient_name, patient_age, patient_gender,
        patient_phone, type, severity, description, location_lat, location_lng,
        location_address, status, priority_score, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, ST_SetSRID(ST_MakePoint($11, $10), 4326))
      RETURNING *
    `;
    
    const values = [
      emergencyNumber,
      userId || null,
      input.patientName,
      input.patientAge,
      input.patientGender,
      input.patientPhone || null,
      input.type,
      input.severity,
      input.description || null,
      input.location.lat,
      input.location.lng,
      input.locationAddress || null,
      'Pending',
      priorityScore,
    ];
    
    try {
      const result = await query(sql, values);
      logger.info('Emergency created', { emergencyNumber, priorityScore });
      return this.mapRowToEmergency(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create emergency', { error, input });
      throw new Error('Failed to create emergency');
    }
  }
  
  // Find emergency by ID
  static async findById(id: string): Promise<Emergency | null> {
    const sql = 'SELECT * FROM emergencies WHERE id = $1';
    
    try {
      const result = await query(sql, [id]);
      return result.rows.length > 0 ? this.mapRowToEmergency(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to find emergency', { error, id });
      throw new Error('Failed to find emergency');
    }
  }
  
  // Find emergency by number
  static async findByNumber(emergencyNumber: string): Promise<Emergency | null> {
    const sql = 'SELECT * FROM emergencies WHERE emergency_number = $1';
    
    try {
      const result = await query(sql, [emergencyNumber]);
      return result.rows.length > 0 ? this.mapRowToEmergency(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to find emergency by number', { error, emergencyNumber });
      throw new Error('Failed to find emergency');
    }
  }
  
  // Get all emergencies with pagination and filters
  static async findAll(
    params: PaginationParams,
    filters?: {
      status?: string;
      severity?: string;
      type?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<PaginatedResponse<Emergency>> {
    const offset = (params.page - 1) * params.limit;
    let sql = 'SELECT * FROM emergencies WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;
    
    // Apply filters
    if (filters?.status) {
      sql += ` AND status = $${paramIndex++}`;
      values.push(filters.status);
    }
    
    if (filters?.severity) {
      sql += ` AND severity = $${paramIndex++}`;
      values.push(filters.severity);
    }
    
    if (filters?.type) {
      sql += ` AND type = $${paramIndex++}`;
      values.push(filters.type);
    }
    
    if (filters?.fromDate) {
      sql += ` AND created_at >= $${paramIndex++}`;
      values.push(filters.fromDate);
    }
    
    if (filters?.toDate) {
      sql += ` AND created_at <= $${paramIndex++}`;
      values.push(filters.toDate);
    }
    
    // Add sorting
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'desc';
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;
    
    // Add pagination
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(params.limit, offset);
    
    try {
      // Get total count
      let countSql = 'SELECT COUNT(*) FROM emergencies WHERE 1=1';
      const countValues: any[] = [];
      let countIndex = 1;
      
      if (filters?.status) {
        countSql += ` AND status = $${countIndex++}`;
        countValues.push(filters.status);
      }
      if (filters?.severity) {
        countSql += ` AND severity = $${countIndex++}`;
        countValues.push(filters.severity);
      }
      if (filters?.type) {
        countSql += ` AND type = $${countIndex++}`;
        countValues.push(filters.type);
      }
      if (filters?.fromDate) {
        countSql += ` AND created_at >= $${countIndex++}`;
        countValues.push(filters.fromDate);
      }
      if (filters?.toDate) {
        countSql += ` AND created_at <= $${countIndex++}`;
        countValues.push(filters.toDate);
      }
      
      const [dataResult, countResult] = await Promise.all([
        query(sql, values),
        query(countSql, countValues),
      ]);
      
      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / params.limit);
      
      return {
        data: dataResult.rows.map(row => this.mapRowToEmergency(row)),
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasMore: params.page < totalPages,
        },
      };
    } catch (error) {
      logger.error('Failed to fetch emergencies', { error, params, filters });
      throw new Error('Failed to fetch emergencies');
    }
  }
  
  // Get active emergencies
  static async findActive(): Promise<Emergency[]> {
    const sql = `
      SELECT * FROM emergencies 
      WHERE status NOT IN ('Completed', 'Cancelled')
      ORDER BY priority_score DESC, created_at ASC
    `;
    
    try {
      const result = await query(sql);
      return result.rows.map(row => this.mapRowToEmergency(row));
    } catch (error) {
      logger.error('Failed to fetch active emergencies', { error });
      throw new Error('Failed to fetch active emergencies');
    }
  }
  
  // Update emergency status
  static async updateStatus(
    id: string,
    status: string,
    updatedBy?: string
  ): Promise<Emergency | null> {
    const now = new Date();
    let sql = 'UPDATE emergencies SET status = $1, updated_at = $2';
    const values: any[] = [status, now];
    let paramIndex = 3;
    
    // Set specific timestamps based on status
    if (status === 'Dispatched' && !await this.hasTimestamp(id, 'dispatched_at')) {
      sql += `, dispatched_at = $${paramIndex++}`;
      values.push(now);
      
      // Calculate response time
      const responseTime = await this.calculateResponseTime(id);
      if (responseTime) {
        sql += `, response_time_seconds = $${paramIndex++}`;
        values.push(responseTime);
      }
    }
    
    if (status === 'Arrived' && !await this.hasTimestamp(id, 'arrived_at')) {
      sql += `, arrived_at = $${paramIndex++}`;
      values.push(now);
      
      // Calculate arrival time
      const arrivalTime = await this.calculateArrivalTime(id);
      if (arrivalTime) {
        sql += `, arrival_time_seconds = $${paramIndex++}`;
        values.push(arrivalTime);
      }
    }
    
    if (status === 'Completed' && !await this.hasTimestamp(id, 'completed_at')) {
      sql += `, completed_at = $${paramIndex++}`;
      values.push(now);
      
      // Calculate total time
      const totalTime = await this.calculateTotalTime(id);
      if (totalTime) {
        sql += `, total_time_seconds = $${paramIndex++}`;
        values.push(totalTime);
      }
    }
    
    sql += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);
    
    try {
      const result = await query(sql, values);
      if (result.rows.length === 0) return null;
      
      logger.info('Emergency status updated', { id, status, updatedBy });
      return this.mapRowToEmergency(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update emergency status', { error, id, status });
      throw new Error('Failed to update emergency status');
    }
  }
  
  // Assign ambulance to emergency
  static async assignAmbulance(
    emergencyId: string,
    ambulanceId: string,
    dispatcherId?: string
  ): Promise<Emergency | null> {
    const sql = `
      UPDATE emergencies 
      SET assigned_ambulance_id = $1, assigned_dispatcher_id = $2, updated_at = NOW()
      WHERE id = $3 
      RETURNING *
    `;
    
    try {
      const result = await query(sql, [ambulanceId, dispatcherId || null, emergencyId]);
      if (result.rows.length === 0) return null;
      
      logger.info('Ambulance assigned to emergency', { emergencyId, ambulanceId, dispatcherId });
      return this.mapRowToEmergency(result.rows[0]);
    } catch (error) {
      logger.error('Failed to assign ambulance', { error, emergencyId, ambulanceId });
      throw new Error('Failed to assign ambulance');
    }
  }
  
  // Assign hospital to emergency
  static async assignHospital(emergencyId: string, hospitalId: string): Promise<Emergency | null> {
    const sql = `
      UPDATE emergencies 
      SET assigned_hospital_id = $1, updated_at = NOW()
      WHERE id = $2 
      RETURNING *
    `;
    
    try {
      const result = await query(sql, [hospitalId, emergencyId]);
      if (result.rows.length === 0) return null;
      
      logger.info('Hospital assigned to emergency', { emergencyId, hospitalId });
      return this.mapRowToEmergency(result.rows[0]);
    } catch (error) {
      logger.error('Failed to assign hospital', { error, emergencyId, hospitalId });
      throw new Error('Failed to assign hospital');
    }
  }
  
  // Get emergency statistics
  static async getStats(): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total_emergencies,
        COUNT(*) FILTER (WHERE status NOT IN ('Completed', 'Cancelled')) as active_emergencies,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status = 'Completed') as completed_today,
        COALESCE(AVG(response_time_seconds), 0) as avg_response_time,
        COUNT(*) FILTER (WHERE severity = 'Critical') as critical_count,
        COUNT(*) FILTER (WHERE severity = 'High') as high_count,
        COUNT(*) FILTER (WHERE severity = 'Medium') as medium_count,
        COUNT(*) FILTER (WHERE severity = 'Low') as low_count
      FROM emergencies
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;
    
    try {
      const result = await query(sql);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to fetch emergency stats', { error });
      throw new Error('Failed to fetch emergency stats');
    }
  }
  
  // Helper methods
  private static async hasTimestamp(id: string, field: string): Promise<boolean> {
    const sql = `SELECT ${field} FROM emergencies WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows.length > 0 && result.rows[0][field] !== null;
  }
  
  private static async calculateResponseTime(id: string): Promise<number | null> {
    const sql = 'SELECT EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER as seconds FROM emergencies WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? result.rows[0].seconds : null;
  }
  
  private static async calculateArrivalTime(id: string): Promise<number | null> {
    const sql = 'SELECT EXTRACT(EPOCH FROM (NOW() - dispatched_at))::INTEGER as seconds FROM emergencies WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? result.rows[0].seconds : null;
  }
  
  private static async calculateTotalTime(id: string): Promise<number | null> {
    const sql = 'SELECT EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER as seconds FROM emergencies WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? result.rows[0].seconds : null;
  }
  
  // Map database row to Emergency object
  private static mapRowToEmergency(row: any): Emergency {
    return {
      id: row.id,
      emergencyNumber: row.emergency_number,
      userId: row.user_id,
      patientName: row.patient_name,
      patientAge: row.patient_age,
      patientGender: row.patient_gender,
      patientPhone: row.patient_phone,
      type: row.type,
      severity: row.severity,
      description: row.description,
      locationLat: parseFloat(row.location_lat),
      locationLng: parseFloat(row.location_lng),
      locationAddress: row.location_address,
      status: row.status,
      priorityScore: row.priority_score,
      assignedAmbulanceId: row.assigned_ambulance_id,
      assignedHospitalId: row.assigned_hospital_id,
      assignedDispatcherId: row.assigned_dispatcher_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      dispatchedAt: row.dispatched_at,
      arrivedAt: row.arrived_at,
      completedAt: row.completed_at,
      responseTimeSeconds: row.response_time_seconds,
      arrivalTimeSeconds: row.arrival_time_seconds,
      totalTimeSeconds: row.total_time_seconds,
    };
  }
}

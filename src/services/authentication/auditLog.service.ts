import { getConnection, Repository } from "typeorm";
import { AuditLog } from "./auditLog.entity";
import logger from "../../config/logger";

export class AuditLogService {
  private auditLogRepository: Repository<AuditLog>;

  constructor() {
    this.auditLogRepository = getConnection().getRepository(AuditLog);
  }

  /**
   * Log authentication event
   */
  public async logEvent(
    userId: string | null,
    event: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any
  ): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: userId || null,
        event,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: metadata || null,
      });

      const saved = await this.auditLogRepository.save(auditLog);
      
      // Also log to console in development
      if (process.env.NODE_ENV === "development") {
        logger.info(`[AUDIT] ${event} - User: ${userId || "anonymous"} - IP: ${ipAddress || "unknown"}`);
      }

      return saved;
    } catch (error) {
      logger.error("Error logging audit event:", error);
      // Don't throw - audit logging failures shouldn't break the app
      return null as any;
    }
  }

  /**
   * Get audit logs for a user
   */
  public async getUserAuditLogs(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { userId },
      order: { timestamp: "DESC" },
      take: limit,
    });
  }

  /**
   * Get all audit logs
   */
  public async getAllAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      order: { timestamp: "DESC" },
      take: limit,
    });
  }
}


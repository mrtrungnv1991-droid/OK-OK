import { db } from '../db/store';
import { ServerAuditLog, UserRole } from '../types';

export class AuditService {
  public static log(params: {
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    action: string;
    resource: string;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }): ServerAuditLog {
    const entry: ServerAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      oldValue: params.oldValue,
      newValue: params.newValue,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'CyberPool-API/1.0',
      timestamp: new Date().toISOString()
    };

    db.auditLogs.unshift(entry);
    // Keep max 2000 logs in memory
    if (db.auditLogs.length > 2000) {
      db.auditLogs.pop();
    }

    return entry;
  }

  public static getLogs(limit = 100) {
    return db.auditLogs.slice(0, limit);
  }
}

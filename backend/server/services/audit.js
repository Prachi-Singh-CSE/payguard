import AuditLog from '../models/AuditLog.js';

export async function log(taskId, event, detail) {
  await AuditLog.create({ taskId, event, detail });
}
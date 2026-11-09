import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  event: String,
  detail: String,
}, { timestamps: true });

export default mongoose.model('AuditLog', auditSchema);
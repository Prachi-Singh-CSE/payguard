import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  text: String,
  mandateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandate' },
  proposal: mongoose.Schema.Types.Mixed,
  decision: String,
  reason: String,
  status: { type: String, default: 'RECEIVED' },
  orderId: String,
  approveUrl: String,
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
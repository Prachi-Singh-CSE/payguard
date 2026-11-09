import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  orderId: String,
  amount: Number,
  currency: { type: String, default: 'USD' },
  description: String,
  status: { type: String, default: 'CREATED' },
  captureId: String,
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  orderId: String,
  amount: Number,
  currency: { type: String, default: 'USD' },
  description: String,
  status: { type: String, default: 'CREATED' }, // CREATED, COMPLETED, FAILED
  captureId: String,
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
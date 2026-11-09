import mongoose from 'mongoose';

const mandateSchema = new mongoose.Schema({
  text: String,
  policy: mongoose.Schema.Types.Mixed,
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Mandate', mandateSchema);
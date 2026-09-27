import mongoose from 'mongoose';

const capabilitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  level: { type: String, required: true },
  score: { type: Number, required: true },
  icon: { type: String, default: 'Cpu' },
  proofCount: { type: String, required: true },
  description: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Capability', capabilitySchema);

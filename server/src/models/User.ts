import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['CANDIDATE', 'RECRUITER', 'ADMIN', 'EXPERT'], default: 'CANDIDATE' },
  track: { type: String, enum: ['TECHNICAL', 'NON_TECHNICAL'] },
  careerArea: { type: String, default: '' },
  targetRole: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);

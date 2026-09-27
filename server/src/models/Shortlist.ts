import mongoose from 'mongoose';

const shortlistSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  notes: { type: String },
  addedAt: { type: Date, default: Date.now }
}, { timestamps: true });

shortlistSchema.index({ recruiter: 1, candidate: 1, job: 1 }, { unique: true });
shortlistSchema.index({ recruiter: 1 });

export default mongoose.model('Shortlist', shortlistSchema);

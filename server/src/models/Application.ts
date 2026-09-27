import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  status: {
    type: String,
    enum: ['APPLIED', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW', 'OFFER', 'REJECTED'],
    default: 'SUBMITTED'
  },
  stage: { 
    type: String, 
    enum: ['APPLIED', 'SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'],
    default: 'APPLIED'
  },
  coverNote: { type: String, default: '' },
  matchedSkills: [{ type: String }],
  notes: { type: String, default: '' },
  appliedAt: { type: Date, default: Date.now },
  stageHistory: [{
    stage: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String }
  }]
}, { timestamps: true });

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ recruiter: 1, stage: 1 });
applicationSchema.index({ candidate: 1, appliedAt: -1 });

export default mongoose.model('Application', applicationSchema);

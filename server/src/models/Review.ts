import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerName: { type: String, default: 'Peer Reviewer' },
  reviewerRole: { type: String, default: 'Software Engineer' },
  reviewerCompany: { type: String, default: 'ProofHire Community' },
  score: { type: Number, default: 85 },
  overallRating: { type: Number, default: 4 },
  dimensions: {
    scalability: { type: Number, default: 85 },
    security: { type: Number, default: 85 },
    maintainability: { type: Number, default: 85 },
    concurrency: { type: Number, default: 85 }
  },
  feedback: { type: String, default: '' },
  comments: { type: String, default: '' },
  highlightedCode: { type: String, default: '' },
  evidenceConsistency: { type: String, default: 'HIGH' },
  practicalViability: { type: String, default: 'HIGH' }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);

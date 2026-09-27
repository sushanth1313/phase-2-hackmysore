import mongoose from 'mongoose';

const candidateProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Identity
  headline: { type: String, default: '' },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  phone: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  links: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' }
  },

  // Career
  careerArea: { type: String, default: '' },
  currentStatus: { 
    type: String, 
    enum: ['Actively Looking', 'Open to Offers', 'Not Looking', 'Exploring Opportunities'], 
    default: 'Actively Looking' 
  },
  targetRole: { type: String, default: '' },
  preferredRoles: [{ type: String }],
  preferredDomains: [{ type: String }],
  experienceLevel: { type: String, default: 'Not specified' },
  availability: { type: String, default: 'Immediately' },

  // Skills: Explicit separation of Claimed vs Verified
  claimedSkills: [{ type: String }],
  verifiedSkills: [{ type: String }],

  // Education & Experience
  education: [{
    institution: { type: String, default: '' },
    degree: { type: String, default: '' },
    field: { type: String, default: '' },
    year: { type: String, default: '' },
    startYear: { type: String, default: '' },
    endYear: { type: String, default: '' },
    description: { type: String, default: '' }
  }],
  experience: [{
    title: { type: String, default: '' },
    company: { type: String, default: '' },
    location: { type: String, default: '' },
    duration: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    current: { type: Boolean, default: false },
    description: { type: String, default: '' }
  }],

  // Capability Dimension Scores (Read-only, derived from real evidence)
  scores: {
    workQuality: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    domainKnowledge: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    documentation: { type: Number, default: 0 },
    creativity: { type: Number, default: 0 },
    aiAssessment: { type: Number, default: 0 },
    expertReview: { type: Number, default: 0 }
  }
}, { timestamps: true });

candidateProfileSchema.index({ user: 1 });

export default mongoose.model('CandidateProfile', candidateProfileSchema);

import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  title: { type: String, required: true },
  company: { type: String, required: true, default: 'TechCorp Engineering' },
  companyLogo: { type: String, default: '' },
  industry: { type: String, default: 'Software & Technology' },
  companySize: { type: String, default: '100-500 employees' },
  department: { type: String, default: 'Engineering' },
  description: { type: String, required: true },
  location: { type: String, default: 'San Francisco, CA / Remote' },
  locationType: { type: String, enum: ['REMOTE', 'HYBRID', 'ONSITE'], default: 'REMOTE' },
  workMode: { type: String, default: 'Remote' },
  type: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'], default: 'FULL_TIME' },
  seniority: { type: String, enum: ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'STAFF', 'PRINCIPAL'], default: 'SENIOR' },
  track: { type: String, enum: ['TECHNICAL', 'NON_TECHNICAL'], default: 'TECHNICAL' },
  
  requiredSkills: [String],
  preferredSkills: [String],
  requirements: [String],
  
  minCapabilitySignal: { type: Number, default: 0 },
  deadline: { type: Date },
  
  status: { 
    type: String, 
    enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'FILLED', 'CLOSED'],
    default: 'ACTIVE'
  },
  
  applicantCount: { type: Number, default: 0 },
  
  closedAt: { type: Date }
}, { timestamps: true });

jobSchema.index({ recruiter: 1, status: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ requiredSkills: 1 });

export default mongoose.model('Job', jobSchema);

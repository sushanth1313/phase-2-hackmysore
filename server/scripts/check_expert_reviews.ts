import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/proofhire');
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const ExpertReview = mongoose.model('ExpertReview', new mongoose.Schema({}, { strict: false }));
  
  const user = await User.findOne({ email: 'expert_1790434226931@example.com' });
  console.log('Test Expert:', user?._id, user?.email);

  const reviews = await ExpertReview.find({ $or: [{ expert: user?._id }, { expertId: user?._id }] });
  console.log('Reviews count for expert:', reviews.length);
  reviews.forEach(r => {
    console.log(JSON.stringify({
      _id: r._id,
      title: r.submissionTitle,
      status: r.status,
      verificationStatus: r.verificationStatus,
      completedAt: r.completedAt,
      overallScore: r.overallScore,
      strengths: r.strengths,
      weaknesses: r.weaknesses,
      improvements: r.improvements
    }, null, 2));
  });
  await mongoose.disconnect();
}
inspect().catch(console.error);

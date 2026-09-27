const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/proofhire');
  const db = mongoose.connection.db;
  const candId = new mongoose.Types.ObjectId('6ab828e156a1fcd29d1ab1b3');
  const resumes = await db.collection('resumes').find({ candidate: candId }).toArray();
  console.log('=== CANDIDATE RESUMES ===', resumes.length);
  for (const r of resumes) {
    console.log({ id: r._id, fileName: r.originalName || r.fileName, track: r.track, careerArea: r.careerArea, parsedSkills: r.parsedSkills?.length });
  }

  const interviews = await db.collection('interviewsessions').find({ candidate: candId }).toArray();
  console.log('=== INTERVIEWS ===', interviews.length);

  const nonTechPows = await db.collection('nontechproofofworks').find({}).toArray();
  console.log('=== ALL NON TECH POWS ===', nonTechPows.length);
  for (const p of nonTechPows) {
    console.log({ id: p._id, title: p.title, candidate: p.candidate, track: p.track, careerArea: p.careerArea, artifactFiles: p.artifactFiles, externalWorkUrl: p.externalWorkUrl, notes: p.notes });
  }

  process.exit(0);
}
run();

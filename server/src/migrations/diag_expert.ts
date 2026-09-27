import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/proofhire');
  const db = mongoose.connection.db!;

  // List all collections
  const cols = await db.listCollections().toArray();
  console.log('=== COLLECTIONS ===');
  cols.forEach((c: any) => console.log(' -', c.name));

  // Count docs in key collections
  for (const col of ['reviews', 'projects', 'projectevidences', 'users', 'challengesubmissions', 'nontechproofofworks', 'expertreviews']) {
    try {
      const count = await db.collection(col).countDocuments();
      console.log(`${col}: ${count} docs`);
    } catch(e) { console.log(`${col}: error`); }
  }

  // Dump all reviews
  const reviews = await db.collection('reviews').find({}).toArray();
  console.log('\n=== ALL REVIEWS (reviews collection) ===');
  reviews.forEach((r: any) => console.log(JSON.stringify({
    _id: r._id?.toString(), reviewer: r.reviewer?.toString(), candidate: r.candidate?.toString(),
    project: r.project?.toString(), score: r.score, evidenceConsistency: r.evidenceConsistency,
    status: r.status, createdAt: r.createdAt
  })));

  // Dump projects with status
  const projects = await db.collection('projects').find({}).project({ projectName:1, status:1, user:1 }).toArray();
  console.log('\n=== ALL PROJECTS ===');
  projects.forEach((p: any) => console.log(JSON.stringify({ _id: p._id?.toString(), projectName: p.projectName, status: p.status, user: p.user?.toString() })));

  // Expert users
  const experts = await db.collection('users').find({ role: 'EXPERT' }).project({ firstName:1, lastName:1, email:1, role:1 }).toArray();
  console.log('\n=== EXPERT USERS ===');
  experts.forEach((e: any) => console.log(JSON.stringify({ _id: e._id?.toString(), firstName: e.firstName, lastName: e.lastName, email: e.email, role: e.role })));

  // Challenge submissions
  const subs = await db.collection('challengesubmissions').find({}).project({ 
    status:1, track:1, workTitle:1, githubUrl:1, candidate:1, submittedAt:1 
  }).toArray();
  console.log('\n=== CHALLENGE SUBMISSIONS ===');
  subs.forEach((s: any) => console.log(JSON.stringify({ 
    _id: s._id?.toString(), status: s.status, track: s.track, 
    workTitle: s.workTitle, candidate: s.candidate?.toString(), submittedAt: s.submittedAt 
  })));

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

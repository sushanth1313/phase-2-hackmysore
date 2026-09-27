const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/proofhire');
  const db = mongoose.connection.db;

  const expertUser = await db.collection('users').findOne({ email: 'testexpert@proofhire.io' });
  console.log('1. Expert User:', expertUser ? { id: expertUser._id, email: expertUser.email, role: expertUser.role } : 'NOT FOUND');

  // Check existing reviews for this expert
  const existingReviews = await db.collection('expertreviews').find({ expert: expertUser._id }).toArray();
  console.log('2. Expert Reviews Count:', existingReviews.length);
  for (const r of existingReviews) {
    console.log(`   - Review ${r._id}: "${r.submissionTitle}", track: ${r.track}, status: ${r.status}`);
  }

  // Ensure expert has a Non-Technical review assigned
  let nonTechReview = existingReviews.find(r => r.track === 'NON_TECHNICAL');
  if (!nonTechReview) {
    console.log('3. Assigning Non-Technical submission to testexpert@proofhire.io...');
    const nonTechPow = await db.collection('nontechproofofworks').findOne({ _id: new mongoose.Types.ObjectId('6ab8374fae4e9d588cd44e8c') });
    if (!nonTechPow) {
      console.error('Non-technical submission 6ab8374fae4e9d588cd44e8c not found!');
      process.exit(1);
    }
    const created = await db.collection('expertreviews').insertOne({
      expert: expertUser._id,
      candidate: nonTechPow.candidate,
      nonTechProofOfWork: nonTechPow._id,
      track: 'NON_TECHNICAL',
      submissionTitle: nonTechPow.title,
      submissionDescription: nonTechPow.description || nonTechPow.notes || '',
      status: 'ASSIGNED',
      assignedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('   Assigned Non-Technical Review ID:', created.insertedId);
    nonTechReview = await db.collection('expertreviews').findOne({ _id: created.insertedId });
  } else {
    console.log('3. Non-Technical review already exists:', nonTechReview._id);
  }

  // Check technical review
  const techReview = existingReviews.find(r => r.track === 'TECHNICAL');
  console.log('4. Technical Review:', techReview ? { id: techReview._id, title: techReview.submissionTitle, status: techReview.status } : 'NONE');

  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

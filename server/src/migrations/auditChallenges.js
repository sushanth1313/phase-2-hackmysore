const { MongoClient } = require('mongodb');
async function check() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('proofhire');

  // List all collections
  const cols = await db.listCollections().toArray();
  console.log('Collections:', cols.map(c => c.name).join(', '));

  // Check challenges collection
  const count = await db.collection('challenges').countDocuments();
  console.log('\nChallenge total count:', count);

  // Sample documents
  const docs = await db.collection('challenges').find({}).limit(3).toArray();
  docs.forEach(d => {
    console.log('---');
    console.log('title:', d.title);
    console.log('track:', JSON.stringify(d.track));
    console.log('status:', JSON.stringify(d.status));
    console.log('deadline:', d.deadline);
    console.log('difficulty:', d.difficulty);
    console.log('technologies:', d.technologies);
  });

  // Aggregate by track and status
  const byTrack = await db.collection('challenges').aggregate([
    { $group: { _id: { track: '$track', status: '$status' }, count: { $sum: 1 } } }
  ]).toArray();
  console.log('\nBreakdown by track+status:', JSON.stringify(byTrack, null, 2));

  const now = new Date();
  const techOpenFuture = await db.collection('challenges').countDocuments({
    track: 'TECHNICAL',
    status: 'OPEN',
    deadline: { $gt: now }
  });
  console.log('\ntrack=TECHNICAL + status=OPEN + future deadline:', techOpenFuture);

  await client.close();
}
check().catch(console.error);

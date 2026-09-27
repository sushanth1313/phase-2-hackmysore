const { MongoClient } = require('mongodb');

async function inspect() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = client.db('proofhire');
  
  const openByDiff = await db.collection('challenges').aggregate([
    { $match: { status: 'OPEN', track: 'TECHNICAL' } },
    { $group: { _id: '$difficulty', count: { $sum: 1 } } }
  ]).toArray();
  console.log('Open Technical by difficulty:', openByDiff);

  const titles = await db.collection('challenges').find(
    { status: 'OPEN', track: 'TECHNICAL' },
    { projection: { title: 1, difficulty: 1, slug: 1 } }
  ).toArray();
  console.log('Titles & difficulties (' + titles.length + '):');
  titles.forEach(t => console.log(`- [${t.difficulty}] ${t.title} (${t.slug})`));

  await client.close();
}

inspect().catch(console.error);

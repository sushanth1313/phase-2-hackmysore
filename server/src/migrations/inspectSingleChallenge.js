const { MongoClient } = require('mongodb');

async function inspectFields() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = client.db('proofhire');
  const c = await db.collection('challenges').findOne({ slug: 'two-sum-api' });
  console.log('Sample challenge fields:', Object.keys(c));
  console.log('Sample challenge document:', JSON.stringify(c, null, 2));
  await client.close();
}

inspectFields().catch(console.error);

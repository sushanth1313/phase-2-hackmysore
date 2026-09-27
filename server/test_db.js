const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/proofhire');
  const collections = await mongoose.connection.db.collections();
  for (let c of collections) {
    if (c.collectionName === 'users') {
      const experts = await c.find({role: 'EXPERT'}).limit(5).toArray();
      console.log('EXPERTS:', experts.map(u => u.email));
    }
  }
  mongoose.disconnect();
}
check();

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkCategoryData() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB);
  const categories = await db.collection('categories').find({}).toArray();
  console.log('Number of categories:', categories.length);
  console.log('\nAll categories data:');
  categories.forEach(cat => {
    console.log(JSON.stringify(cat, null, 2));
  });
  await client.close();
}

checkCategoryData().catch(console.error); 
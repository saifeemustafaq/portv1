const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkProjectData() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB);
  const projects = await db.collection('projects').find({}).toArray();
  console.log('Number of projects:', projects.length);
  console.log('\nSample project data:');
  if (projects.length > 0) {
    const sample = projects[0];
    console.log(JSON.stringify(sample, null, 2));
  }
  await client.close();
}

checkProjectData().catch(console.error); 
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    await client.db().command({ ping: 1 });
    console.log('Database ping successful!');
    await client.close();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

testConnection(); 
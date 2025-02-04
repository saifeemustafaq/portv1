import * as dotenv from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';

// Load environment variables from the root .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

async function testConnection() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Successfully connected to MongoDB!');
    
    if (mongoose.connection.db) {
      console.log(`Database name: ${mongoose.connection.db.databaseName}`);
    }
    
    // Close the connection
    await mongoose.disconnect();
    console.log('Connection closed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

testConnection(); 
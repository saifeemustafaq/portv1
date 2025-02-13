// This ensures this code only runs on the server side
import mongoose from 'mongoose';
import type { Connection } from 'mongoose';

const isServer = () => {
  return typeof window === 'undefined' && (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NODE_ENV === 'development');
};

if (!isServer()) {
  throw new Error('This module is server-side only');
}

type CachedConnection = {
  conn: Connection | null;
  promise: Promise<Connection> | null;
};

interface GlobalWithMongoose {
  mongoose?: CachedConnection;
}

declare const global: GlobalWithMongoose;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MONGODB_URI to .env file');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please add your MONGODB_DB to .env file');
}

const MONGODB_URI: string = process.env.MONGODB_URI;
const MONGODB_DB: string = process.env.MONGODB_DB;

const cached: CachedConnection = global.mongoose || {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<Connection> {
  if (!isServer()) {
    throw new Error('Database connection is only available in server-side contexts');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      dbName: MONGODB_DB // Explicitly set the database name
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts).then(mongooseInstance => mongooseInstance.connection);
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
    if (!cached.conn) throw new Error('Failed to establish database connection');
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export default connectDB; 
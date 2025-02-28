import { MongoClient, MongoClientOptions } from 'mongodb';
import { bootstrapCategories } from './bootstrap';
import { logger } from '@/app/utils/logger';

// Environment validation
const requiredEnvVars = {
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB: process.env.MONGODB_DB
} as const;

// Type guard to ensure URI is defined
function assertEnvVar(value: string | undefined, name: string): asserts value is string {
  if (!value) {
    const error = new Error(`Invalid/Missing environment variable: "${name}"`);
    logger.error('mongodb', `Configuration error: ${error.message}`);
    throw error;
  }
}

// Validate environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  assertEnvVar(value, key);
});

// After validation, we know these are defined
const uri = requiredEnvVars.MONGODB_URI as string;
const dbName = requiredEnvVars.MONGODB_DB as string;

const options: MongoClientOptions = {
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000,  // 45 seconds
  serverSelectionTimeoutMS: 5000, // 5 seconds
  maxPoolSize: 10,
  minPoolSize: 1,
};

let clientPromise: Promise<MongoClient>;

async function initializeClient(): Promise<MongoClient> {
  try {
    const newClient = new MongoClient(uri, options);
    const connectedClient = await newClient.connect();
    
    // Test the connection
    await connectedClient.db(dbName).command({ ping: 1 });
    logger.info('mongodb', 'Successfully connected to MongoDB');
    
    // Initialize database
    await bootstrapCategories().catch(error => {
      logger.error('mongodb', 'Bootstrap categories failed', { error });
    });
    
    return connectedClient;
  } catch (error) {
    logger.error('mongodb', 'Failed to connect to MongoDB', { error });
    throw error;
  }
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = initializeClient();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  clientPromise = initializeClient();
}

// Add connection error handler
clientPromise.catch(error => {
  logger.error('mongodb', 'MongoDB connection error', { error });
  process.exit(1); // Exit on connection failure
});

export default clientPromise; 
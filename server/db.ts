import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure websocket for serverless environment
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 15, // Optimized connection pool size
  min: 3, // Minimum connections to maintain
  connectionTimeoutMillis: 8000, // Connection timeout
  idleTimeoutMillis: 60000, // Idle timeout (1 minute)
  acquireTimeoutMillis: 3000, // Timeout for acquiring connection
  allowExitOnIdle: false, // Keep connections alive
  application_name: 'liberty-bar-management'
});

export const db = drizzle({ client: pool, schema });

// Database connection monitoring
pool.on('connect', () => {
  console.log('Database connection established');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

pool.on('remove', () => {
  console.log('Database connection removed from pool');
});
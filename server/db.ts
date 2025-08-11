import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// WebSocket configuration for Node.js environment
if (typeof window === 'undefined') { 
  neonConfig.webSocketConstructor = ws;
  // neonConfig.webSocketKeepAlive = true; // Enable keep-alive (removed, property does not exist)
  neonConfig.pipelineConnect = 'password'; // Optimize connection startup
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

// Connection pool singleton with Neon-specific optimizations
let poolInstance: Pool | null = null;
let isShuttingDown = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

export function getPool(): Pool {
  if (!poolInstance && !isShuttingDown) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 6, // Optimal for Neon's free tier
      min: 1, 
      connectionTimeoutMillis: 3000, // Faster timeout for serverless
      idleTimeoutMillis: 10000, // Shorter idle timeout
      ssl: true,
      allowExitOnIdle: false,
    });

    // Enhanced event handling
    poolInstance.on('connect', (client) => {
      reconnectAttempts = 0; // Reset on successful connection
      console.debug('New database connection established');
    });

    poolInstance.on('remove', (client) => {
      if (!isShuttingDown) {
        console.debug('Connection returned to pool');
      }
    });

    poolInstance.on('error', (err) => {
      console.error('Database pool error:', err);
      if (!isShuttingDown && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(() => {
          if (poolInstance) {
            poolInstance.end().then(() => {
              poolInstance = null;
              getPool(); // Reinitialize pool
            });
          }
        }, 1000 * reconnectAttempts); // Exponential backoff
      }
    });
  }
  return poolInstance as Pool;
}

// Drizzle ORM instance with Neon-optimized configuration
export const pool = getPool();
export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV !== 'production'
});

// Health check function for connection validation
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('Database health check failed:', err);
    return false;
  }
}

// Graceful shutdown handler with connection draining
export async function shutdownPool(): Promise<void> {
  if (isShuttingDown || !poolInstance) return;
  
  isShuttingDown = true;
  console.log('Starting database pool shutdown...');
  
  try {
    // Allow existing queries to complete
    await poolInstance.end();
    poolInstance = null;
    console.log('Database pool successfully shutdown');
  } catch (err) {
    console.error('Error during pool shutdown:', err);
  } finally {
    isShuttingDown = false;
  }
}

// Process event handlers with connection management
const setupProcessHandlers = () => {
  const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  
  shutdownSignals.forEach(signal => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, initiating shutdown...`);
      await shutdownPool();
      process.exit(0);
    });
  });

  process.on('uncaughtException', async (err) => {
    console.error('Uncaught exception:', err);
    await shutdownPool();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    await shutdownPool();
    process.exit(1);
  });
};

setupProcessHandlers();

// Periodic health checks in production
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    if (!isShuttingDown) {
      await checkDatabaseHealth();
    }
  }, 300000); // Every 5 minutes
}

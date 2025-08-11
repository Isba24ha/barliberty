import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import crypto from "crypto";
import os from "os";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool, shutdownPool } from "./db"; // Import the updated pool and shutdownPool

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10); // Render uses process.env.PORT for binding

// Function to get the server's local IPv4 address (non-internal)
const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const details of iface) {
      if (details.family === 'IPv4' && !details.internal) {
        return details.address;
      }
    }
  }
  return 'localhost';
};

// HTTPS redirect middleware for production
if (isProduction) {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = isProduction 
      ? [
          process.env.FRONTEND_URL,
          'https://liberty-bar-management.replit.app'
        ].filter(Boolean)
      : [
          `http://localhost:${PORT}`,
          `http://127.0.0.1:${PORT}`,
          /https:\/\/.*\.replit\.(dev|app)$/
        ];
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    callback(null, isAllowed || !isProduction);
  },
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware configuration
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });
  next();
});

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  store: new session.MemoryStore()
};

app.use(session(sessionConfig));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: isProduction ? 'Something went wrong' : err.message
  });
});

// Server startup
(async () => {
  try {
    // Verify database connection with retry
    let dbConnected = false;
    let attempts = 0;
    const maxAttempts = 5;
    const retryDelay = 2000;

    while (!dbConnected && attempts < maxAttempts) {
      try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        log('Database connection verified');
        dbConnected = true;
      } catch (error) {
        attempts++;
        console.error(`Database connection attempt ${attempts} failed:`, error);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    if (!dbConnected) {
      throw new Error('Failed to connect to database after multiple attempts');
    }

    const server = await registerRoutes(app);

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const ip = getLocalIp();

    server.listen(PORT, '0.0.0.0', () => {
      log(`🚀 Server running on http://${ip}:${PORT}`);
      log(`📊 Database: Connected`);
      log(`🌐 Environment: ${app.get("env")}`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${PORT} is already in use`);
        log('Try:');
        log(`1. Changing the PORT in your .env file`);
        log(`2. Running 'netstat -ano | findstr :${PORT}' to find the process using the port`);
        log(`3. Killing the process with 'taskkill /PID [PID] /F'`);
      } else {
        log(`Server error: ${err.message}`);
      }
      process.exit(1);
    });

  } catch (error) {
    log(`Server startup failed: ${error}`);
    await shutdownPool(); // Use the centralized shutdown function
    process.exit(1);
  }
})();

// Graceful shutdown handler
const gracefulShutdown = async () => {
  log('Starting graceful shutdown...');
  try {
    // Add any additional cleanup here if needed
    await shutdownPool(); // Use the centralized shutdown function
    log('Shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Process termination handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Uncaught exception handlers
process.on('uncaughtException', async (err) => {
  console.error('Uncaught exception:', err);
  await gracefulShutdown();
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  await gracefulShutdown();
});

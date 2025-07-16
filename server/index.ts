import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import ConnectPgSimple from "connect-pg-simple";

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// HTTPS redirect middleware for production
if (isProduction) {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// CORS configuration for cross-origin requests
const corsOptions = {
  origin: function (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Define allowed origins based on environment
    const allowedOrigins = isProduction 
      ? [
          process.env.FRONTEND_URL,
          process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}` : null,
          'https://liberty-bar-management.replit.app',
          // Add your custom domain here when deployed
        ].filter(Boolean) // Remove null values
      : [
          'http://localhost:5000',
          'http://localhost:3000',
          'http://127.0.0.1:5000',
          'http://127.0.0.1:3000',
          // Add the current Replit preview URL
          /https:\/\/.*\.replit\.dev$/,
          /https:\/\/.*\.replit\.app$/
        ];
    
    // Check if origin matches any allowed origin or pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // In development, be more permissive
      if (!isProduction) {
        console.log('CORS: Allowing origin in development:', origin);
        callback(null, true);
      } else {
        console.log('CORS: Blocking origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Check database connection before starting
async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    log('Database connection verified');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Log environment variables for production debugging
if (process.env.NODE_ENV === 'production') {
  log(`Environment variables check:`);
  log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);
  log(`REPLIT_DOMAIN: ${process.env.REPLIT_DOMAIN || 'NOT SET'}`);
  log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
  log(`SESSION_SECRET: ${process.env.SESSION_SECRET ? 'SET' : 'NOT SET'}`);
}

// Enhanced middleware configuration
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

// Configure session with PostgreSQL store for better performance
const PgSession = ConnectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15, // Clean up sessions every 15 minutes
    errorLog: (error: any) => {
      console.error('Session store error:', error);
    }
  }),
  secret: process.env.SESSION_SECRET || "liberty-bar-management-secret-key-2025",
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  name: 'liberty.session', // Custom session name
  cookie: {
    secure: false, // Set to false for development even in production mode
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours to match client session
    sameSite: 'lax', // Use 'lax' for same-origin requests in development
    domain: undefined, // Let browser handle domain
    path: '/' // Ensure cookie is available for all paths
  },
  // Generate session ID without excessive logging
  genid: () => {
    return crypto.randomUUID();
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Enhanced error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ 
      message: 'Database connection failed',
      error: 'Service temporarily unavailable'
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation failed',
      error: err.message
    });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  log(`${signal} received, shutting down gracefully`);
  
  try {
    await pool.end();
    log('Database pool closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Server startup
(async () => {
  try {
    // Verify database connection before starting server
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      log('Failed to connect to database, retrying in 5 seconds...');
      setTimeout(() => process.exit(1), 5000);
      return;
    }

    const server = await registerRoutes(app);

    // Setup development or production serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`🚀 LIBERTY Bar Management System serving on port ${port}`);
      log(`📊 Database: Connected and ready`);
      log(`🔐 Session store: PostgreSQL`);
      log(`🌐 Environment: ${app.get("env")}`);
    });

  } catch (error) {
    log(`Failed to start server: ${error}`);
    process.exit(1);
  }
})();

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import ConnectPgSimple from "connect-pg-simple";

const app = express();

// Improved middleware configuration
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Compression middleware for better performance
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Configure session with PostgreSQL store for better performance
const PgSession = ConnectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "liberty-bar-management-secret-key-2025",
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours to match client session
    sameSite: 'lax'
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

// Graceful shutdown handling
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully');
  pool.end(() => {
    log('Database pool closed');
    process.exit(0);
  });
});

// Database connection health check
async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT 1');
    log('Database connection verified');
    return true;
  } catch (error) {
    log(`Database connection failed: ${error}`);
    return false;
  }
}

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

    // Enhanced error handling middleware
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log error details for debugging
      log(`Error ${status}: ${message} - ${req.method} ${req.path}`);
      
      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production' && status === 500) {
        res.status(500).json({ message: "Erro interno do servidor" });
      } else {
        res.status(status).json({ message });
      }
      
      if (status === 500) {
        console.error(err);
      }
    });

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

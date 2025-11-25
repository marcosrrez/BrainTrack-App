import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as dotenv from "dotenv";
import helmet from "helmet";
import { apiLimiter } from "./rate-limit";
import "./config"; // Validate environment variables on startup

dotenv.config();

const app = express();

// PRODUCTION: Trust Railway proxy (required for rate limiting to work correctly)
// Railway sits behind a proxy that sets X-Forwarded-For headers
// Without this, express-rate-limit cannot identify unique users
app.set('trust proxy', true);

// SECURITY: Helmet adds various HTTP headers to protect against common vulnerabilities
// - X-Content-Type-Options: Prevents MIME sniffing
// - X-Frame-Options: Prevents clickjacking
// - X-XSS-Protection: Enables browser XSS protection
// - Strict-Transport-Security: Enforces HTTPS
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Vite dev server compatibility
  crossOriginEmbedderPolicy: false, // Disabled for external resources
}));

// SECURITY: Rate limiting for all API routes
// Limits: 100 requests per 15 minutes per IP address
app.use('/api', apiLimiter);

// SECURITY: Set reasonable request size limits
// Using 10MB as the default limit, which is sufficient for most operations
// This prevents DOS attacks via large payload submissions
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Custom error handler for payload too large
// This middleware catches JSON parsing errors including payload size errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      message: "Request payload too large. Maximum size is 10MB. Please reduce file sizes or compress your data."
    });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      message: "Invalid JSON in request body. Please check your request format."
    });
  }
  next(err);
});

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

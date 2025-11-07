/**
 * Environment Configuration Validation
 *
 * This file validates that all required environment variables are present
 * before the server starts. This prevents runtime errors and ensures
 * security-critical variables are properly configured in production.
 */

interface Config {
  nodeEnv: string;
  sessionSecret: string;
  databaseUrl: string;
  port: number;
  isProduction: boolean;
  isDevelopment: boolean;
}

/**
 * Validates and loads environment configuration
 * @throws Error if required environment variables are missing in production
 */
export function validateConfig(): Config {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';

  // Critical security check: SESSION_SECRET must be set in production
  if (isProduction && !process.env.SESSION_SECRET) {
    throw new Error(
      'SECURITY ERROR: SESSION_SECRET environment variable must be set in production. ' +
      'Generate a secure random string (at least 32 characters) and set it in your environment.'
    );
  }

  // Database URL is required for all environments
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is required. ' +
      'Please configure your database connection string.'
    );
  }

  const sessionSecret = process.env.SESSION_SECRET || 'dev-secret-change-in-production';

  // Warn in development if using default secret
  if (isDevelopment && sessionSecret === 'dev-secret-change-in-production') {
    console.warn(
      '⚠️  WARNING: Using default session secret in development. ' +
      'Set SESSION_SECRET environment variable for better security.'
    );
  }

  const config: Config = {
    nodeEnv,
    sessionSecret,
    databaseUrl: process.env.DATABASE_URL,
    port: parseInt(process.env.PORT || '5000', 10),
    isProduction,
    isDevelopment,
  };

  return config;
}

// Validate config on module load
export const config = validateConfig();

// Log configuration status (without exposing secrets)
console.log('✓ Configuration validated successfully');
console.log(`  Environment: ${config.nodeEnv}`);
console.log(`  Port: ${config.port}`);
console.log(`  Database: ${config.databaseUrl ? '✓ Configured' : '✗ Missing'}`);
console.log(`  Session Secret: ${config.sessionSecret ? '✓ Configured' : '✗ Missing'}`);

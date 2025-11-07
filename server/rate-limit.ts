/**
 * Rate Limiting Configuration
 *
 * Implements rate limiting to protect against brute-force attacks,
 * DDoS attempts, and API abuse. Different limits are applied to
 * different route types based on their sensitivity.
 */

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Applies to all /api routes
 * Limit: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for successful requests in development
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.path.startsWith('/api/analytics');
  },
});

/**
 * Strict rate limiter for authentication routes
 * Applies to login, register, and password reset endpoints
 * Limit: 5 requests per 15 minutes per IP
 *
 * This helps prevent:
 * - Brute force password attacks
 * - Account enumeration
 * - Credential stuffing
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // In development, allow more attempts for testing
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  },
});

/**
 * Memory creation rate limiter
 * Applies to POST /api/memories
 * Limit: 20 requests per 15 minutes per IP
 *
 * This prevents abuse of the memory creation endpoint,
 * which involves expensive AI processing operations.
 */
export const memoryCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 memory creations per windowMs
  message: {
    message: 'Too many memories created from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

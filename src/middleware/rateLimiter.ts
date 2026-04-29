import { adminService } from '../services/adminService';
import logger from '../services/logger';

/**
 * Rate Limiter Middleware for Express/API routes
 * This middleware checks IP-based rate limits before allowing requests
 */

interface RateLimitRequest {
  ip?: string;
  headers?: { [key: string]: string | string[] | undefined };
}

interface RateLimitResponse {
  status: (code: number) => RateLimitResponse;
  json: (data: Record<string, unknown>) => void;
  setHeader: (name: string, value: string) => void;
}

// Firebase Functions types (when used in Firebase context)
interface FirebaseFunctionsRequest extends RateLimitRequest {
  method?: string;
  url?: string;
  body?: unknown;
}

interface FirebaseFunctionsResponse extends RateLimitResponse {
  send: (data: unknown) => void;
  end: () => void;
}

/**
 * Get client IP address from request
 * Handles various proxy configurations
 */
export function getClientIP(req: RateLimitRequest): string {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (ips && typeof ips === 'string') {
      const parts = ips.split(',');
      return parts[0]?.trim() || '127.0.0.1';
    }
    return '127.0.0.1';
  }

  // Check for real IP header (Cloudflare, etc.)
  const realIP = req.headers?.['x-real-ip'];
  if (realIP) {
    const ip = Array.isArray(realIP) ? realIP[0] : realIP;
    return ip || '127.0.0.1';
  }

  // Fall back to direct connection IP
  return req.ip || '127.0.0.1';
}

/**
 * Rate limiter middleware factory
 * Creates a middleware function that enforces rate limits
 */
export function createRateLimiter() {
  return async function rateLimiter(
    req: RateLimitRequest,
    res: RateLimitResponse,
    next: () => void
  ) {
    try {
      const clientIP = getClientIP(req);
      
      // Check rate limit for this IP
      const result = await adminService.checkIPRateLimit(clientIP);
      
      if (!result.allowed) {
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', '20');
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());
        res.setHeader('Retry-After', '60');
        
        // Return 429 Too Many Requests
        res.status(429).json({
          error: 'Too Many Requests',
          message: result.message || 'Rate limit exceeded. Please try again later.',
          retryAfter: 60
        });
        return;
      }
      
      // Request allowed, continue to next middleware
      next();
    } catch (error) {
      logger.error('Rate limiter error', error);
      // On error, allow the request but log the issue
      next();
    }
  };
}

/**
 * Firebase Functions rate limiter
 * For use with Firebase Cloud Functions
 */
export async function checkFirebaseFunctionRateLimit(
  req: FirebaseFunctionsRequest,
  res: FirebaseFunctionsResponse
): Promise<boolean> {
  try {
    const clientIP = getClientIP(req);
    const result = await adminService.checkIPRateLimit(clientIP);
    
    if (!result.allowed) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: result.message || 'Rate limit exceeded. Please try again later.',
        retryAfter: 60
      });
      return false;
    }
    
    return true;
    } catch (error) {
    logger.error('Firebase rate limiter error', error);
    // On error, allow the request but log the issue
    return true;
  }
}

/**
 * React Hook for client-side rate limiting
 * Can be used to prevent excessive API calls from the frontend
 */
export function useRateLimit(
  maxRequests: number = 10,
  windowMs: number = 60000
): {
  checkLimit: () => boolean;
  remaining: number;
  resetTime: Date;
} {
  const requestCounts = new Map<string, { count: number; resetTime: Date }>();
  
  const checkLimit = (key: string = 'default'): boolean => {
    const now = new Date();
    const record = requestCounts.get(key);
    
    if (!record || now > record.resetTime) {
      // Create new window
      requestCounts.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + windowMs)
      });
      return true;
    }
    
    if (record.count >= maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  };
  
  const getRemaining = (key: string = 'default'): number => {
    const record = requestCounts.get(key);
    if (!record) return maxRequests;
    return Math.max(0, maxRequests - record.count);
  };
  
  const getResetTime = (key: string = 'default'): Date => {
    const record = requestCounts.get(key);
    return record?.resetTime || new Date(Date.now() + windowMs);
  };
  
  return {
    checkLimit: () => checkLimit(),
    remaining: getRemaining(),
    resetTime: getResetTime()
  };
}

/**
 * Utility to implement exponential backoff for retries
 */
export function exponentialBackoff(
  attemptNumber: number,
  maxDelay: number = 32000
): number {
  const delay = Math.min(1000 * Math.pow(2, attemptNumber), maxDelay);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
}

/**
 * Rate limit configuration for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Human-like limits for authentication endpoints
  auth: {
    maxRequestsPerMinute: 10,      // Allow a few retries for forgotten passwords
    maxRequestsPerHour: 30,        // Multiple login attempts throughout the hour
    maxRequestsPerDay: 100,        // Reasonable daily auth interactions
    blockDurationMinutes: 60       // 1 hour block for suspicious activity
  },
  // Human-like limits for API endpoints (normal user activity)
  api: {
    maxRequestsPerMinute: 60,      // ~1 request per second during active use
    maxRequestsPerHour: 600,       // Sustained usage with natural breaks
    maxRequestsPerDay: 3000,       // Full day of active usage
    blockDurationMinutes: 30       // 30 min timeout for hitting limits
  },
  // Human-like limits for chat/questions (medical consultations)
  chat: {
    maxRequestsPerMinute: 20,      // Back-and-forth conversation pace
    maxRequestsPerHour: 200,       // Extended consultation session
    maxRequestsPerDay: 500,        // Multiple consultations per day
    blockDurationMinutes: 15       // Short cooldown period
  },
  // Relaxed limits for static content
  static: {
    maxRequestsPerMinute: 120,     // Fast page navigation
    maxRequestsPerHour: 2000,      // Heavy browsing session
    maxRequestsPerDay: 10000,      // All-day usage
    blockDurationMinutes: 10       // Brief timeout
  }
};

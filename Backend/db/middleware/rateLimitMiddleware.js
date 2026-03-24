const rateLimit = require('express-rate-limit');

// General rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Custom key generator to include both IP and user agent for better security
  keyGenerator: (req) => {
    return `${req.ip}-${req.get('User-Agent')}`;
  }
});

// Stricter rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts',
    message: 'Account temporarily locked. Please try again after 15 minutes',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Use phone number if provided, otherwise fall back to IP
    const identifier = req.body?.phoneNumber || req.ip;
    return `login-${identifier}`;
  }
});

// Rate limiter for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts',
    message: 'Please try again after 1 hour',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use phone number or email if provided, otherwise fall back to IP
    const identifier = req.body?.phoneNumber || req.body?.email || req.ip;
    return `reset-${identifier}`;
  }
});

// Rate limiter for signup attempts
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 signup attempts per hour
  message: {
    error: 'Too many signup attempts',
    message: 'Please try again after 1 hour',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `signup-${req.ip}`;
  }
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many API requests',
    message: 'Please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Create account lockout functionality
const createAccountLockout = () => {
  const failedAttempts = new Map();
  
  return {
    // Middleware to track failed login attempts
    trackFailedAttempt: (req, res, next) => {
      const identifier = req.body?.phoneNumber;
      if (!identifier) return next();
      
      const attempts = failedAttempts.get(identifier) || { count: 0, lockedUntil: null };
      
      // Check if account is currently locked
      if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
        const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60);
        return res.status(423).json({
          error: 'Account temporarily locked',
          message: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
          lockedUntil: attempts.lockedUntil
        });
      }
      
      // Reset if lock period has expired
      if (attempts.lockedUntil && attempts.lockedUntil <= Date.now()) {
        failedAttempts.delete(identifier);
      }
      
      next();
    },
    
    // Record a failed attempt
    recordFailedAttempt: (identifier) => {
      if (!identifier) return;
      
      const attempts = failedAttempts.get(identifier) || { count: 0, lockedUntil: null };
      attempts.count += 1;
      
      // Lock account after 5 failed attempts
      if (attempts.count >= 5) {
        attempts.lockedUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
        attempts.count = 0; // Reset count after locking
      }
      
      failedAttempts.set(identifier, attempts);
    },
    
    // Clear failed attempts on successful login
    clearFailedAttempts: (identifier) => {
      if (identifier) {
        failedAttempts.delete(identifier);
      }
    }
  };
};

const accountLockout = createAccountLockout();

module.exports = {
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  signupLimiter,
  apiLimiter,
  accountLockout
};
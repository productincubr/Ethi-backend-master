/**
 * JWT Authentication Middleware
 * 
 * PURPOSE: Protect routes and verify user authentication using JWT tokens
 * 
 * USAGE:
 * - Add to routes that need authentication
 * - Verifies JWT token from Authorization header
 * - Adds decoded user data to req.user
 */

const jwt = require('jsonwebtoken');

// JWT Secret (store in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'ethi_healthcare_secret_key_2025_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7 days

/**
 * Generate JWT token for authenticated user
 * @param {Object} userData - User data to encode in token
 * @returns {String} JWT token
 */
const generateToken = (userData) => {
  try {
    const payload = {
      id: userData._id || userData.id,
      email: userData.email,
      role: userData.role || 'user',
      type: userData.type || 'admin', // admin, doctor, customer
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return token;
  } catch (error) {
    console.error('❌ Error generating JWT token:', error);
    throw new Error('Token generation failed');
  }
};

/**
 * Verify JWT token middleware
 * Protects routes from unauthorized access
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Check if token exists
    if (!token) {
      return res.status(401).send({
        message: 'Access denied. No token provided.',
        error: true,
      });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('❌ JWT verification failed:', err.message);
        return res.status(403).send({
          message: 'Invalid or expired token.',
          error: true,
        });
      }

      // Token valid - attach user data to request
      req.user = decoded;
      console.log('✅ Token verified for user:', decoded.email, 'role:', decoded.role);
      next();
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(500).send({
      message: 'Authentication failed.',
      error: true,
    });
  }
};

/**
 * Verify user role middleware
 * Checks if user has required role
 * @param {Array} allowedRoles - Array of allowed roles ['super_admin', 'admin', 'doctor']
 */
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user data exists (from verifyToken middleware)
      if (!req.user) {
        return res.status(401).send({
          message: 'User not authenticated.',
          error: true,
        });
      }

      // Check if user role is allowed
      if (!allowedRoles.includes(req.user.role)) {
        console.log('❌ Access denied. User role:', req.user.role, 'Required:', allowedRoles);
        return res.status(403).send({
          message: 'Access denied. Insufficient permissions.',
          error: true,
        });
      }

      console.log('✅ Role verified:', req.user.role);
      next();
    } catch (error) {
      console.error('❌ Role verification error:', error);
      return res.status(500).send({
        message: 'Authorization failed.',
        error: true,
      });
    }
  };
};

/**
 * Optional token verification (doesn't block request)
 * Useful for routes that work with or without authentication
 */
const optionalToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token - continue without user data
      req.user = null;
      return next();
    }

    // Verify token if present
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        // Invalid token - continue without user data
        req.user = null;
      } else {
        // Valid token - attach user data
        req.user = decoded;
      }
      next();
    });
  } catch (error) {
    // Error - continue without user data
    req.user = null;
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  verifyRole,
  optionalToken,
  JWT_SECRET,
  JWT_EXPIRES_IN,
};

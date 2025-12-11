/**
 * Password Hashing Helper
 * 
 * PURPOSE: Secure password hashing using bcrypt (replaces MD5)
 * 
 * FEATURES:
 * - Hash passwords before storing in database
 * - Compare plain text password with hashed password
 * - More secure than MD5 (salted hashing)
 */

const bcrypt = require('bcrypt');

// Salt rounds for bcrypt (higher = more secure but slower)
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param {String} password - Plain text password
 * @returns {Promise<String>} Hashed password
 */
const hashPassword = async (password) => {
  try {
    if (!password) {
      throw new Error('Password is required');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('✅ Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    throw new Error('Password hashing failed');
  }
};

/**
 * Synchronous password hashing (for scripts)
 * @param {String} password - Plain text password
 * @returns {String} Hashed password
 */
const hashPasswordSync = (password) => {
  try {
    if (!password) {
      throw new Error('Password is required');
    }

    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare plain text password with hashed password
 * @param {String} plainPassword - Plain text password from user input
 * @param {String} hashedPassword - Hashed password from database
 * @returns {Promise<Boolean>} True if passwords match
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    if (!plainPassword || !hashedPassword) {
      throw new Error('Both passwords are required for comparison');
    }

    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    
    if (isMatch) {
      console.log('✅ Password match');
    } else {
      console.log('❌ Password mismatch');
    }
    
    return isMatch;
  } catch (error) {
    console.error('❌ Error comparing passwords:', error);
    return false;
  }
};

/**
 * Synchronous password comparison (for scripts)
 * @param {String} plainPassword - Plain text password
 * @param {String} hashedPassword - Hashed password from database
 * @returns {Boolean} True if passwords match
 */
const comparePasswordSync = (plainPassword, hashedPassword) => {
  try {
    if (!plainPassword || !hashedPassword) {
      return false;
    }

    return bcrypt.compareSync(plainPassword, hashedPassword);
  } catch (error) {
    console.error('❌ Error comparing passwords:', error);
    return false;
  }
};

module.exports = {
  hashPassword,
  hashPasswordSync,
  comparePassword,
  comparePasswordSync,
  SALT_ROUNDS,
};

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_department_dms_jwt_key_2026_prod_grade';

/**
 * Generate a JWT token containing userId, role, and department.
 * Expires in 24 hours.
 * @param {object} user - User document or object.
 * @returns {string} The signed JWT.
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      department: user.department,
    },
    JWT_SECRET,
    {
      expiresIn: '24h',
    }
  );
};

/**
 * Verify a JWT token.
 * @param {string} token - The JWT string.
 * @returns {object} The decoded token payload.
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};

const express = require('express');
const router = express.Router();
const { login, logout, getProfile, changePassword } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');

// Public route
router.post('/login', login);

// Protected routes
router.post('/logout', authenticateUser, logout);
router.get('/profile', authenticateUser, getProfile);
router.put('/change-password', authenticateUser, changePassword);

module.exports = router;

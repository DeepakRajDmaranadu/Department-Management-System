const express = require('express');
const router = express.Router();
const { createUser, getUsers, updateUser, deleteUser } = require('../controllers/authController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Admin-only user registration endpoint
router.post('/', authenticateUser, authorizeRoles('Admin'), createUser);

// Admin-only user retrieval endpoint
router.get('/', authenticateUser, authorizeRoles('Admin'), getUsers);

// Admin-only user update and delete endpoints
router.put('/:id', authenticateUser, authorizeRoles('Admin'), updateUser);
router.delete('/:id', authenticateUser, authorizeRoles('Admin'), deleteUser);

module.exports = router;

const express = require('express');
const router = express.Router();
const { createCollege, getColleges, updateCollege, deleteCollege } = require('../controllers/collegeController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Authenticated users can list colleges
router.get('/', authenticateUser, getColleges);

// Admin-only routes to create, update, and delete colleges
router.post('/', authenticateUser, authorizeRoles('Admin'), createCollege);
router.put('/:id', authenticateUser, authorizeRoles('Admin'), updateCollege);
router.delete('/:id', authenticateUser, authorizeRoles('Admin'), deleteCollege);

module.exports = router;

const express = require('express');
const router = express.Router();
const { createCourse, getCourses, updateCourse, deleteCourse } = require('../controllers/courseController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Authenticated users can list courses
router.get('/', authenticateUser, getCourses);

// Admin-only routes to create, update, and delete courses
router.post('/', authenticateUser, authorizeRoles('Admin'), createCourse);
router.put('/:id', authenticateUser, authorizeRoles('Admin'), updateCourse);
router.delete('/:id', authenticateUser, authorizeRoles('Admin'), deleteCourse);

module.exports = router;

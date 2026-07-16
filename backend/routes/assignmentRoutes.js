const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  updateSubmissions,
  deleteAssignment,
  getConsolidatedAssignmentsForHOD,
} = require('../controllers/assignmentController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticateUser);

// HOD Consolidated Report Route
router.get('/hod/consolidated', authorizeRoles('HOD'), getConsolidatedAssignmentsForHOD);

// Faculty only routes
router.post('/', authorizeRoles('Faculty'), createAssignment);
router.get('/', authorizeRoles('Faculty'), getAssignments);
router.put('/:id', authorizeRoles('Faculty'), updateSubmissions);
router.delete('/:id', authorizeRoles('Faculty'), deleteAssignment);

module.exports = router;

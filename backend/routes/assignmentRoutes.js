const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  updateSubmissions,
  deleteAssignment,
} = require('../controllers/assignmentController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes - Faculty only
router.use(authenticateUser);
router.use(authorizeRoles('Faculty'));

router.post('/', createAssignment);
router.get('/', getAssignments);
router.put('/:id', updateSubmissions);
router.delete('/:id', deleteAssignment);

module.exports = router;

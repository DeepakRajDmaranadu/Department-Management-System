const express = require('express');
const router = express.Router();
const {
  getMyAllocations,
  getStudentsForAttendance,
  submitAttendance,
  getConsolidatedAttendance,
  getAttendanceHistory,
  getConsolidatedAttendanceForHOD,
} = require('../controllers/attendanceController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticateUser);

// HOD Consolidated Report Route
router.get('/hod/consolidated', authorizeRoles('HOD'), getConsolidatedAttendanceForHOD);

// Faculty & HOD general routes
router.get('/consolidated', authorizeRoles('Faculty', 'HOD'), getConsolidatedAttendance);
router.get('/history', authorizeRoles('Faculty', 'HOD'), getAttendanceHistory);

// Faculty exclusive routes
router.get('/my-allocations', authorizeRoles('Faculty'), getMyAllocations);
router.get('/students', authorizeRoles('Faculty'), getStudentsForAttendance);
router.post('/', authorizeRoles('Faculty'), submitAttendance);

module.exports = router;

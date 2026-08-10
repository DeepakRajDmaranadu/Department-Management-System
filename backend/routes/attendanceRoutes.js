const express = require('express');
const router = express.Router();
const {
  getMyAllocations,
  getStudentsForAttendance,
  submitAttendance,
  getConsolidatedAttendance,
  getAttendanceHistory,
  getConsolidatedAttendanceForHOD,
  getHODDailyAttendance,
  submitHODDailyAttendance,
  getDailyAbsentees,
} = require('../controllers/attendanceController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticateUser);

// HOD Consolidated Report Route
router.get('/hod/consolidated', authorizeRoles('HOD', 'Admin', 'Principal', 'Office Assistant'), getConsolidatedAttendanceForHOD);
router.get('/hod/daily-attendance', authorizeRoles('HOD', 'Admin', 'Principal', 'Office Assistant'), getHODDailyAttendance);
router.post('/hod/daily-attendance', authorizeRoles('HOD', 'Admin'), submitHODDailyAttendance);
router.get('/hod/daily-absentees/:batchId', authorizeRoles('HOD', 'Admin', 'Principal', 'Office Assistant'), getDailyAbsentees);

// Faculty & HOD general routes
router.get('/consolidated', authorizeRoles('Faculty', 'HOD', 'Admin', 'Principal', 'Office Assistant'), getConsolidatedAttendance);
router.get('/history', authorizeRoles('Faculty', 'HOD', 'Admin', 'Principal', 'Office Assistant'), getAttendanceHistory);

// Faculty exclusive routes
router.get('/my-allocations', authorizeRoles('Faculty'), getMyAllocations);
router.get('/students', authorizeRoles('Faculty'), getStudentsForAttendance);
router.post('/', authorizeRoles('Faculty'), submitAttendance);

module.exports = router;

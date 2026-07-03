const express = require('express');
const router = express.Router();
const {
  getMyAllocations,
  getStudentsForAttendance,
  submitAttendance,
  getConsolidatedAttendance,
  getAttendanceHistory,
} = require('../controllers/attendanceController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes - Faculty only
router.use(authenticateUser);
router.use(authorizeRoles('Faculty'));

router.get('/my-allocations', getMyAllocations);
router.get('/students', getStudentsForAttendance);
router.get('/consolidated', getConsolidatedAttendance);
router.get('/history', getAttendanceHistory);
router.post('/', submitAttendance);

module.exports = router;

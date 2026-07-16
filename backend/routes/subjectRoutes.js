const express = require('express');
const router = express.Router();
const {
  createSubject,
  getSubjects,
  deleteSubject,
  createAllocation,
  getAllocations,
  deleteAllocation,
  getFacultyList,
  getBatchLanguageSubjects,
  updateSubject,
  updateAllocation,
} = require('../controllers/subjectController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes - HOD only
router.use(authenticateUser);
router.use(authorizeRoles('HOD'));

// Subjects
router.post('/', createSubject);
router.get('/semesters/:semesterId', getSubjects);
router.get('/batches/:batchId/language-subjects', getBatchLanguageSubjects);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

// Allocations
router.post('/allocations', createAllocation);
router.get('/allocations/semesters/:semesterId', getAllocations);
router.put('/allocations/:id', updateAllocation);
router.delete('/allocations/:id', deleteAllocation);

// Faculty lookup
router.get('/faculty', getFacultyList);

module.exports = router;

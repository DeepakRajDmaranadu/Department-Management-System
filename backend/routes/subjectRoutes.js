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

// Protect all routes - HOD, Admin, Principal, and Office Assistant
router.use(authenticateUser);
router.use(authorizeRoles('HOD', 'Admin', 'Principal', 'Office Assistant'));

// Subjects
router.post('/', authorizeRoles('HOD', 'Admin'), createSubject);
router.get('/semesters/:semesterId', getSubjects);
router.get('/batches/:batchId/language-subjects', getBatchLanguageSubjects);
router.put('/:id', authorizeRoles('HOD', 'Admin'), updateSubject);
router.delete('/:id', authorizeRoles('HOD', 'Admin'), deleteSubject);

// Allocations
router.post('/allocations', authorizeRoles('HOD', 'Admin'), createAllocation);
router.get('/allocations/semesters/:semesterId', getAllocations);
router.put('/allocations/:id', authorizeRoles('HOD', 'Admin'), updateAllocation);
router.delete('/allocations/:id', authorizeRoles('HOD', 'Admin'), deleteAllocation);

// Faculty lookup
router.get('/faculty', getFacultyList);

module.exports = router;

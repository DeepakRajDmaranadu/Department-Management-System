const express = require('express');
const router = express.Router();
const {
  createBatch,
  getBatches,
  deleteBatch,
  addStudent,
  addStudentsBulk,
  getStudents,
  createSemester,
  getSemesters,
  createSection,
  getSections,
  saveAllotments,
  getAllotments,
} = require('../controllers/batchController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes under this router - HOD only
router.use(authenticateUser);
router.use(authorizeRoles('HOD'));

// Batches
router.post('/', createBatch);
router.get('/', getBatches);
router.delete('/:id', deleteBatch);

// Students
router.post('/:batchId/students', addStudent);
router.post('/:batchId/students/bulk', addStudentsBulk);
router.get('/:batchId/students', getStudents);

// Semesters
router.post('/:batchId/semesters', createSemester);
router.get('/:batchId/semesters', getSemesters);

// Sections
router.post('/semesters/:semesterId/sections', createSection);
router.get('/semesters/:semesterId/sections', getSections);

// Allotments
router.post('/semesters/:semesterId/allotments', saveAllotments);
router.get('/semesters/:semesterId/allotments', getAllotments);

module.exports = router;

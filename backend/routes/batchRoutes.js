const express = require('express');
const router = express.Router();
const {
  createBatch,
  getBatches,
  deleteBatch,
  addStudent,
  addStudentsBulk,
  getStudents,
  updateStudent,
  deleteStudent,
  createSemester,
  getSemesters,
  createSection,
  getSections,
  saveAllotments,
  getAllotments,
  getDeleteImpact,
  deleteSection,
} = require('../controllers/batchController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes under this router
router.use(authenticateUser);

// Impact Check (HOD and Faculty)
router.get('/delete-impact', getDeleteImpact);

// Restrict remaining routes to HOD only
router.use(authorizeRoles('HOD'));

// Batches
router.post('/', createBatch);
router.get('/', getBatches);
router.delete('/:id', deleteBatch);

// Students
router.post('/:batchId/students', addStudent);
router.post('/:batchId/students/bulk', addStudentsBulk);
router.get('/:batchId/students', getStudents);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Semesters
router.post('/:batchId/semesters', createSemester);
router.get('/:batchId/semesters', getSemesters);

// Sections
router.post('/semesters/:semesterId/sections', createSection);
router.get('/semesters/:semesterId/sections', getSections);
router.delete('/sections/:id', deleteSection);

// Allotments
router.post('/semesters/:semesterId/allotments', saveAllotments);
router.get('/semesters/:semesterId/allotments', getAllotments);

module.exports = router;

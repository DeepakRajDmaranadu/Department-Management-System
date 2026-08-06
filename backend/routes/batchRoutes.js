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
  updateSemester,
  deleteSemester,
  createSection,
  getSections,
  updateSection,
  deleteSection,
  saveAllotments,
  getAllotments,
  getDeleteImpact,
  getBatchSpecializations,
} = require('../controllers/batchController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes under this router
router.use(authenticateUser);

// Impact Check (HOD and Faculty)
router.get('/delete-impact', getDeleteImpact);

// Restrict remaining routes to HOD, Admin, Principal, and Office Assistant
router.use(authorizeRoles('HOD', 'Admin', 'Principal', 'Office Assistant'));

// Batches
router.post('/', authorizeRoles('HOD', 'Admin'), createBatch);
router.get('/', getBatches);
router.delete('/:id', authorizeRoles('HOD', 'Admin'), deleteBatch);

// Students
router.post('/:batchId/students', authorizeRoles('HOD', 'Admin'), addStudent);
router.post('/:batchId/students/bulk', authorizeRoles('HOD', 'Admin'), addStudentsBulk);
router.get('/:batchId/students', getStudents);
router.get('/:batchId/specializations', getBatchSpecializations);
router.put('/students/:id', authorizeRoles('HOD', 'Admin'), updateStudent);
router.delete('/students/:id', authorizeRoles('HOD', 'Admin'), deleteStudent);

// Semesters
router.post('/:batchId/semesters', authorizeRoles('HOD', 'Admin'), createSemester);
router.get('/:batchId/semesters', getSemesters);
router.put('/semesters/:id', authorizeRoles('HOD', 'Admin'), updateSemester);
router.delete('/semesters/:id', authorizeRoles('HOD', 'Admin'), deleteSemester);

// Sections
router.post('/semesters/:semesterId/sections', authorizeRoles('HOD', 'Admin'), createSection);
router.get('/semesters/:semesterId/sections', getSections);
router.put('/sections/:id', authorizeRoles('HOD', 'Admin'), updateSection);
router.delete('/sections/:id', authorizeRoles('HOD', 'Admin'), deleteSection);

// Allotments
router.post('/semesters/:semesterId/allotments', authorizeRoles('HOD', 'Admin'), saveAllotments);
router.get('/semesters/:semesterId/allotments', getAllotments);

module.exports = router;

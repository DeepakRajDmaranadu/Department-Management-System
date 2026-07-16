const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createAssessment,
  getAssessments,
  deleteAssessment,
  getFacultyAssessmentList,
  getFacultyMarksheet,
  submitMarks,
  getHODConsolidatedReport
} = require('../controllers/internalAssessmentController');

const {
  getDynamicSheetData,
  saveDynamicSheetConfig,
  exportAllDynamicSheets
} = require('../controllers/dynamicSheetController');

// All internal assessment operations require authenticated users
router.use(authenticateUser);

// HOD Only Routes
router.post('/', authorizeRoles('HOD'), createAssessment);
router.delete('/:id', authorizeRoles('HOD'), deleteAssessment);
router.get('/hod/consolidated', authorizeRoles('HOD'), getHODConsolidatedReport);
router.get('/hod/dynamic-sheet/export-all', authorizeRoles('HOD'), exportAllDynamicSheets);
router.get('/hod/dynamic-sheet', authorizeRoles('HOD'), getDynamicSheetData);
router.post('/hod/dynamic-sheet', authorizeRoles('HOD'), saveDynamicSheetConfig);

// Faculty Only Routes
router.get('/faculty/list', authorizeRoles('Faculty'), getFacultyAssessmentList);
router.get('/faculty/marks', authorizeRoles('Faculty'), getFacultyMarksheet);
router.post('/faculty/marks', authorizeRoles('Faculty'), submitMarks);

// Shared/General Routes
router.get('/', getAssessments);

module.exports = router;

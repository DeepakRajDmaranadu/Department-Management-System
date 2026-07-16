const InternalAssessment = require('../models/InternalAssessment');
const InternalAssessmentMark = require('../models/InternalAssessmentMark');
const Subject = require('../models/Subject');
const SubjectAllocation = require('../models/SubjectAllocation');
const Allotment = require('../models/Allotment');
const Student = require('../models/Student');
const Semester = require('../models/Semester');

// 1. Create Internal Assessment (HOD only)
exports.createAssessment = async (req, res) => {
  try {
    const { title, maxMarks, batch, semester } = req.body;

    if (!title || !maxMarks || !batch || !semester) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const assessment = await InternalAssessment.create({
      title,
      maxMarks,
      batch,
      semester,
      college: req.user.college || 'Default College',
    });

    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Assessments for a semester (All Authenticated Users)
exports.getAssessments = async (req, res) => {
  try {
    const { semesterId } = req.query;

    if (!semesterId) {
      return res.status(400).json({ success: false, message: 'semesterId query param is required.' });
    }

    const assessments = await InternalAssessment.find({ semester: semesterId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Delete Assessment and associated marksheets (HOD only)
exports.deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await InternalAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Internal Assessment not found.' });
    }

    // Delete associated mark sheets
    await InternalAssessmentMark.deleteMany({ internalAssessment: id });
    await InternalAssessment.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Internal Assessment and associated marks deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get active assessments list for faculty allocated subjects
exports.getFacultyAssessmentList = async (req, res) => {
  try {
    const facultyId = req.user._id;

    // Find all allocations for this faculty
    const allocations = await SubjectAllocation.find({ faculty: facultyId });
    if (allocations.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const semesterIds = Array.from(new Set(allocations.map(a => a.semester.toString())));
    
    // Find all internal assessments for these semesters
    const assessments = await InternalAssessment.find({ semester: { $in: semesterIds } })
      .populate('semester', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Faculty Marksheet scoring details (Faculty only)
exports.getFacultyMarksheet = async (req, res) => {
  try {
    const { internalAssessmentId, subjectId, sectionId } = req.query;
    const facultyId = req.user._id;

    if (!internalAssessmentId || !subjectId) {
      return res.status(400).json({ success: false, message: 'internalAssessmentId and subjectId are required.' });
    }

    // Verify allocation
    const allocationQuery = { faculty: facultyId, subject: subjectId };
    if (sectionId && sectionId !== 'all') {
      allocationQuery.section = sectionId;
    }
    const allocation = await SubjectAllocation.findOne(allocationQuery);
    if (!allocation) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not allocated to this subject-section.' });
    }

    const assessment = await InternalAssessment.findById(internalAssessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Internal Assessment not found.' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const batchId = assessment.batch;
    const semesterId = assessment.semester;

    // Fetch student roster (filtered by section if sectionId is specific)
    let studentQuery = { batch: batchId };
    if (sectionId && sectionId !== 'all') {
      const allotments = await Allotment.find({ semester: semesterId, section: sectionId });
      const studentIds = allotments.map(a => a.student);
      studentQuery._id = { $in: studentIds };
    }
    const studentsRaw = await Student.find(studentQuery).sort({ studentId: 1 });

    // Filter students if it's a language subject
    let students = [...studentsRaw];
    if (subject.subjectType === 'language') {
      const langCode = subject.subjectId.toUpperCase().trim();
      students = students.filter(student => {
        if (!student.language) return false;
        const studentLang = student.language.toUpperCase().trim();
        return (
          studentLang === langCode ||
          langCode.startsWith(studentLang) ||
          studentLang.startsWith(langCode) ||
          (studentLang.length >= 3 && langCode.substring(0, 3) === studentLang.substring(0, 3))
        );
      });
    }

    // Find any existing marksheet
    const marksQuery = {
      internalAssessment: internalAssessmentId,
      subject: subjectId,
      section: (sectionId && sectionId !== 'all') ? sectionId : null,
    };
    const marksheet = await InternalAssessmentMark.findOne(marksQuery);

    const markData = students.map(student => {
      const existingEntry = marksheet ? marksheet.marks.find(m => m.student.toString() === student._id.toString()) : null;
      return {
        student: {
          _id: student._id,
          studentId: student.studentId,
          admissionNumber: student.admissionNumber || 'N/A',
          fullName: student.fullName,
          email: student.email,
        },
        marksObtained: existingEntry ? existingEntry.marksObtained : 0,
        status: existingEntry ? existingEntry.status : 'present',
      };
    });

    res.status(200).json({
      success: true,
      data: {
        assessment,
        subject,
        maxMarks: marksheet ? marksheet.maxMarks : 50,
        marks: markData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Submit or Update student marks (Faculty only)
exports.submitMarks = async (req, res) => {
  try {
    const { internalAssessmentId, subjectId, sectionId, maxMarks, marks } = req.body;
    const facultyId = req.user._id;

    if (!internalAssessmentId || !subjectId || !marks || !Array.isArray(marks)) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Verify allocation
    const allocationQuery = { faculty: facultyId, subject: subjectId };
    if (sectionId && sectionId !== 'all') {
      allocationQuery.section = sectionId;
    }
    const allocation = await SubjectAllocation.findOne(allocationQuery);
    if (!allocation) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not allocated to this subject.' });
    }

    const assessment = await InternalAssessment.findById(internalAssessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Internal Assessment not found.' });
    }

    const finalMaxMarks = Number(maxMarks) || 50;

    const formattedMarks = marks.map(item => {
      const isAbsent = item.status === 'absent';
      const rawScore = Number(item.marksObtained);
      let score = isAbsent ? 0 : isNaN(rawScore) ? 0 : rawScore;
      
      // Cap at max marks
      if (score > finalMaxMarks) {
        score = finalMaxMarks;
      }
      if (score < 0) {
        score = 0;
      }

      return {
        student: item.studentId || item.student,
        marksObtained: score,
        status: item.status || 'present',
      };
    });

    const query = {
      internalAssessment: internalAssessmentId,
      subject: subjectId,
      section: (sectionId && sectionId !== 'all') ? sectionId : null,
    };

    let marksheet = await InternalAssessmentMark.findOne(query);

    if (marksheet) {
      marksheet.marks = formattedMarks;
      marksheet.maxMarks = finalMaxMarks;
      marksheet.faculty = facultyId;
      await marksheet.save();
    } else {
      marksheet = await InternalAssessmentMark.create({
        ...query,
        maxMarks: finalMaxMarks,
        faculty: facultyId,
        marks: formattedMarks,
      });
    }

    res.status(200).json({ success: true, message: 'Internal assessment marks saved successfully.', data: marksheet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Get HOD Consolidated Assessment Report
exports.getHODConsolidatedReport = async (req, res) => {
  try {
    const { semesterId, sectionId, internalAssessmentId } = req.query;

    if (!semesterId || !internalAssessmentId) {
      return res.status(400).json({ success: false, message: 'semesterId and internalAssessmentId are required.' });
    }

    const assessment = await InternalAssessment.findById(internalAssessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Internal Assessment not found.' });
    }

    const batchId = assessment.batch;

    // Fetch students roster
    let studentQuery = { batch: batchId };
    if (sectionId && sectionId !== 'all') {
      const allotments = await Allotment.find({ semester: semesterId, section: sectionId });
      const studentIds = allotments.map(a => a.student);
      studentQuery._id = { $in: studentIds };
    }
    const students = await Student.find(studentQuery).sort({ studentId: 1 });

    // Fetch all subjects in semester
    const subjectsRaw = await Subject.find({ semester: semesterId }).sort({ subjectId: 1 });

    // Fetch allocations in this semester to get faculty names
    const allocationsQuery = { semester: semesterId };
    if (sectionId && sectionId !== 'all') {
      allocationsQuery.section = sectionId;
    }
    const allocations = await SubjectAllocation.find(allocationsQuery).populate('faculty', 'fullName');

    // Fetch all saved marksheet documents for this assessment and section
    const marksheetQuery = { internalAssessment: internalAssessmentId };
    if (sectionId && sectionId !== 'all') {
      marksheetQuery.section = { $in: [sectionId, null] };
    }
    const marksheets = await InternalAssessmentMark.find(marksheetQuery);

    const subjects = subjectsRaw.map(sub => {
      const subAllocs = allocations.filter(a => a.subject.toString() === sub._id.toString());
      const facultyNames = Array.from(new Set(subAllocs.map(a => a.faculty?.fullName).filter(Boolean)));
      const facultyName = facultyNames.length > 0 ? facultyNames.join(', ') : 'Not Allocated';

      const sheet = marksheets.find(s => s.subject.toString() === sub._id.toString());
      const maxMarks = sheet ? sheet.maxMarks : 50;

      return {
        ...sub.toObject(),
        facultyName,
        maxMarks
      };
    });

    const data = students.map(student => {
      const studentMarks = {};
      let sumPercentages = 0;
      let count = 0;

      subjects.forEach(sub => {
        // Check if student is enrolled in subject
        let isEnrolled = true;
        if (sub.subjectType === 'language') {
          const langCode = sub.subjectId.toUpperCase().trim();
          const studentLang = (student.language || "").toUpperCase().trim();
          isEnrolled = (
            studentLang === langCode ||
            langCode.startsWith(studentLang) ||
            studentLang.startsWith(langCode) ||
            (studentLang.length >= 3 && langCode.substring(0, 3) === studentLang.substring(0, 3))
          );
        }

        if (!isEnrolled) {
          studentMarks[sub._id] = {
            isEnrolled: false,
            maxMarks: sub.maxMarks,
            marksObtained: 0,
            status: 'present',
            percentage: 'N/A',
          };
          return;
        }

        // Find the marksheet for this subject
        const sheet = marksheets.find(s => s.subject.toString() === sub._id.toString());
        const subMaxMarks = sheet ? sheet.maxMarks : sub.maxMarks;
        const entry = sheet ? sheet.marks.find(m => m.student.toString() === student._id.toString()) : null;

        if (entry) {
          const pct = parseFloat(((entry.marksObtained / subMaxMarks) * 100).toFixed(2));
          studentMarks[sub._id] = {
            isEnrolled: true,
            maxMarks: subMaxMarks,
            marksObtained: entry.marksObtained,
            status: entry.status,
            percentage: pct,
          };
          sumPercentages += pct;
          count++;
        } else {
          // Marks not entered yet
          studentMarks[sub._id] = {
            isEnrolled: true,
            maxMarks: subMaxMarks,
            marksObtained: 0,
            status: 'present',
            percentage: 'N/A',
          };
        }
      });

      const overallPercentage = count > 0 ? parseFloat((sumPercentages / count).toFixed(2)) : 'N/A';

      return {
        _id: student._id,
        studentId: student.studentId,
        admissionNumber: student.admissionNumber || 'N/A',
        fullName: student.fullName,
        email: student.email,
        language: student.language,
        marks: studentMarks,
        overallPercentage,
      };
    });

    res.status(200).json({
      success: true,
      assessment,
      subjects,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

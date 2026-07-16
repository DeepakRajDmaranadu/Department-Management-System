const SubjectAllocation = require('../models/SubjectAllocation');
const Student = require('../models/Student');
const Allotment = require('../models/Allotment');
const Assignment = require('../models/Assignment');

// Create new assignment
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, allocationId } = req.body;

    if (!title || !dueDate || !allocationId) {
      return res.status(400).json({ success: false, message: 'Title, dueDate, and allocationId are required' });
    }

    const allocation = await SubjectAllocation.findById(allocationId)
      .populate('subject')
      .populate('semester');

    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Subject allocation not found' });
    }

    const subject = allocation.subject;
    const semester = allocation.semester;
    const batchId = semester.batch;
    const semesterId = semester._id;

    // Fetch students roster for this allocation
    let studentQuery = { batch: batchId };

    if (allocation.section) {
      const allotmentsCount = await Allotment.countDocuments({ semester: semesterId });
      if (allotmentsCount > 0) {
        const allotments = await Allotment.find({ semester: semesterId, section: allocation.section });
        const studentIds = allotments.map(a => a.student);
        studentQuery._id = { $in: studentIds };
      }
    }

    let students = await Student.find(studentQuery).sort({ studentId: 1 });

    // Apply robust case-insensitive language filtering for language subjects
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

    // Map initial submissions status as pending for all roster students
    const submissions = students.map(student => ({
      student: student._id,
      status: 'pending',
    }));

    const assignment = new Assignment({
      title,
      description: description || '',
      dueDate: new Date(dueDate),
      subject: subject._id,
      semester: semesterId,
      section: allocation.section || null,
      faculty: req.user._id,
      submissions,
    });

    await assignment.save();

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get assignments for a subject allocation
exports.getAssignments = async (req, res) => {
  try {
    const { allocationId } = req.query;

    if (!allocationId) {
      return res.status(400).json({ success: false, message: 'allocationId is required' });
    }

    const allocation = await SubjectAllocation.findById(allocationId);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    const assignments = await Assignment.find({
      subject: allocation.subject,
      semester: allocation.semester,
      section: allocation.section || null,
    })
      .sort({ createdAt: -1 })
      .populate('submissions.student', 'studentId fullName language');

    return res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update submissions for an assignment
exports.updateSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissions } = req.body; // Array of { studentId, status }

    if (!submissions || !Array.isArray(submissions)) {
      return res.status(400).json({ success: false, message: 'submissions array is required' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Creator faculty or currently allocated faculty can edit
    const isAllocated = await SubjectAllocation.findOne({
      faculty: req.user._id,
      subject: assignment.subject,
      semester: assignment.semester,
      section: assignment.section || null,
    });

    if (assignment.faculty.toString() !== req.user._id.toString() && !isAllocated) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this assignment' });
    }

    // Update status in submissions array
    assignment.submissions.forEach(sub => {
      const match = submissions.find(s => s.studentId.toString() === sub.student.toString());
      if (match) {
        sub.status = match.status;
      }
    });

    await assignment.save();

    // Populate and return updated assignment
    const populated = await Assignment.findById(id).populate('submissions.student', 'studentId fullName language');

    return res.status(200).json({
      success: true,
      message: 'Submissions updated successfully',
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const isAllocated = await SubjectAllocation.findOne({
      faculty: req.user._id,
      subject: assignment.subject,
      semester: assignment.semester,
      section: assignment.section || null,
    });

    if (assignment.faculty.toString() !== req.user._id.toString() && !isAllocated) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this assignment' });
    }

    await Assignment.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get HOD Consolidated Assignments Report
exports.getConsolidatedAssignmentsForHOD = async (req, res) => {
  try {
    const { semesterId, sectionId, subjectId } = req.query;

    if (!semesterId) {
      return res.status(400).json({ success: false, message: 'semesterId is required' });
    }

    const Semester = require('../models/Semester');
    const Subject = require('../models/Subject');
    const SubjectAllocation = require('../models/SubjectAllocation');
    const Allotment = require('../models/Allotment');
    const Student = require('../models/Student');

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    const batchId = semester.batch;

    // 1. Fetch students roster (filtered by section if sectionId is specific)
    let studentQuery = { batch: batchId };
    if (sectionId && sectionId !== 'all') {
      const allotmentsCount = await Allotment.countDocuments({ semester: semesterId });
      if (allotmentsCount > 0) {
        const allotments = await Allotment.find({ semester: semesterId, section: sectionId });
        const studentIds = allotments.map(a => a.student);
        studentQuery._id = { $in: studentIds };
      }
    }
    const students = await Student.find(studentQuery).sort({ studentId: 1 });

    // 2. Fetch all subjects for this semester
    const subjectsRaw = await Subject.find({ semester: semesterId }).sort({ subjectId: 1 });

    // Fetch allocations in this semester to identify faculties
    const allocationsQuery = { semester: semesterId };
    if (sectionId && sectionId !== 'all') {
      allocationsQuery.section = sectionId;
    }
    const allocations = await SubjectAllocation.find(allocationsQuery).populate('faculty', 'fullName');

    const subjects = subjectsRaw.map(sub => {
      const subAllocs = allocations.filter(a => a.subject.toString() === sub._id.toString());
      const facultyNames = Array.from(new Set(subAllocs.map(a => a.faculty?.fullName).filter(Boolean)));
      const facultyName = facultyNames.length > 0 ? facultyNames.join(', ') : 'Not Allocated';

      return {
        ...sub.toObject(),
        facultyName
      };
    });

    // Fetch assignments for these subjects and semester
    const assignmentsQuery = { semester: semesterId };
    if (sectionId && sectionId !== 'all') {
      assignmentsQuery.section = { $in: [sectionId, null] };
    }
    
    // Mode: Single Subject Consolidated Report
    if (subjectId && subjectId !== 'all') {
      const subjectRaw = await Subject.findById(subjectId);
      if (!subjectRaw) {
        return res.status(404).json({ success: false, message: 'Subject not found' });
      }

      const subAllocs = allocations.filter(a => a.subject.toString() === subjectRaw._id.toString());
      const facultyNames = Array.from(new Set(subAllocs.map(a => a.faculty?.fullName).filter(Boolean)));
      const facultyName = facultyNames.length > 0 ? facultyNames.join(', ') : 'Not Allocated';
      const subject = {
        ...subjectRaw.toObject(),
        facultyName
      };

      // Filter students if this is a language subject
      let filteredStudents = [...students];
      if (subject.subjectType === 'language') {
        const langCode = subject.subjectId.toUpperCase().trim();
        filteredStudents = filteredStudents.filter(student => {
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

      // Fetch assignments for this subject
      assignmentsQuery.subject = subjectId;
      const subjectAssignments = await Assignment.find(assignmentsQuery);

      const data = filteredStudents.map(student => {
        let TA = 0;
        let SA = 0;

        subjectAssignments.forEach(assign => {
          // Check if student was enrolled in this assignment
          const subRecord = assign.submissions.find(s => s.student.toString() === student._id.toString());
          if (subRecord) {
            TA++;
            if (subRecord.status === 'submitted') {
              SA++;
            }
          }
        });

        const percentage = TA > 0 ? parseFloat(((SA / TA) * 100).toFixed(2)) : 'N/A';

        return {
          _id: student._id,
          studentId: student.studentId,
          admissionNumber: student.admissionNumber || 'N/A',
          fullName: student.fullName,
          email: student.email,
          language: student.language,
          TA,
          SA,
          percentage,
        };
      });

      return res.status(200).json({
        success: true,
        mode: 'single',
        subject,
        data,
      });
    }

    // Mode: All Subjects Consolidated Report
    const allAssignments = await Assignment.find(assignmentsQuery);
    const allAllotments = await Allotment.find({ semester: semesterId });

    const data = students.map(student => {
      const studentAllotment = allAllotments.find(a => a.student.toString() === student._id.toString());
      const studentSectionId = studentAllotment ? studentAllotment.section?.toString() : null;

      const studentAssignments = {};
      let totalTA = 0;
      let totalSA = 0;
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
          studentAssignments[sub._id] = {
            percentage: 'N/A',
            SA: 0,
            TA: 0,
            isEnrolled: false
          };
          return;
        }

        // Filter assignments for this subject
        const subAssignments = allAssignments.filter(a => a.subject.toString() === sub._id.toString());
        let TA = 0;
        let SA = 0;

        subAssignments.forEach(assign => {
          const subRecord = assign.submissions.find(s => s.student.toString() === student._id.toString());
          if (subRecord) {
            TA++;
            if (subRecord.status === 'submitted') {
              SA++;
            }
          }
        });

        const percentage = TA > 0 ? parseFloat(((SA / TA) * 100).toFixed(2)) : 'N/A';

        if (TA > 0) {
          totalTA += TA;
          totalSA += SA;
          if (typeof percentage === 'number') {
            sumPercentages += percentage;
            count++;
          }
        }

        studentAssignments[sub._id] = {
          percentage,
          SA,
          TA,
          isEnrolled: true
        };
      });

      const overallPercentage = count > 0 ? parseFloat((sumPercentages / count).toFixed(2)) : 'N/A';

      return {
        _id: student._id,
        studentId: student.studentId,
        admissionNumber: student.admissionNumber || 'N/A',
        fullName: student.fullName,
        email: student.email,
        language: student.language,
        assignments: studentAssignments,
        totalTA,
        totalSA,
        overallPercentage,
      };
    });

    return res.status(200).json({
      success: true,
      mode: 'all',
      subjects,
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

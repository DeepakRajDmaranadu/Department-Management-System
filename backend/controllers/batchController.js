const Batch = require('../models/Batch');
const Student = require('../models/Student');
const Semester = require('../models/Semester');
const Section = require('../models/Section');
const Allotment = require('../models/Allotment');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');

// Create a new batch
exports.createBatch = async (req, res) => {
  try {
    const { batchId, years } = req.body;
    if (!batchId || !years) {
      return res.status(400).json({ success: false, message: 'Batch ID and Years are required' });
    }

    // Check if batch ID is already taken
    const existing = await Batch.findOne({ batchId: batchId.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Batch ID already exists' });
    }

    const course = req.user.department;
    const college = req.user.college;

    if (!course) {
      return res.status(400).json({ success: false, message: 'Your HOD account is not mapped to any Course' });
    }

    const batch = new Batch({
      batchId: batchId.toUpperCase(),
      years,
      course,
      college,
    });

    await batch.save();
    return res.status(201).json({ success: true, data: batch });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all batches for HOD's department
exports.getBatches = async (req, res) => {
  try {
    const course = req.user.department;
    if (!course) {
      return res.status(200).json({ success: true, data: [] });
    }
    const batches = await Batch.find({ course }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: batches });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a batch (cascades)
exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const studentCount = await Student.countDocuments({ batch: id });
    const semesters = await Semester.find({ batch: id });
    const semesterIds = semesters.map(s => s._id);

    const attendanceCount = await Attendance.countDocuments({ semester: { $in: semesterIds } });
    const assignmentCount = await Assignment.countDocuments({ semester: { $in: semesterIds } });

    if (studentCount > 0 || semesters.length > 0 || attendanceCount > 0 || assignmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete batch as it contains active students, semesters, attendance logs, or assignments.'
      });
    }

    // Delete all students in this batch
    await Student.deleteMany({ batch: id });

    // Delete allotments and sections under these semesters
    await Allotment.deleteMany({ semester: { $in: semesterIds } });
    await Section.deleteMany({ semester: { $in: semesterIds } });
    await Semester.deleteMany({ batch: id });

    // Delete the batch itself
    await Batch.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: 'Batch and all associated data deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add a single student manually
exports.addStudent = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { studentId, fullName, email, language } = req.body;

    if (!studentId || !fullName || !email || !language) {
      return res.status(400).json({ success: false, message: 'All student fields are required including language (Subject ID)' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Verify language subject exists for this batch
    const Subject = require('../models/Subject');
    const Semester = require('../models/Semester');
    const semesters = await Semester.find({ batch: batchId });
    const semesterIds = semesters.map(s => s._id);

    const langSubject = await Subject.findOne({
      semester: { $in: semesterIds },
      subjectId: language.toUpperCase().trim(),
      subjectType: 'language',
    });

    if (!langSubject) {
      return res.status(400).json({ success: false, message: `Language Subject ID "${language}" is not registered in this batch. Please register the language subject first.` });
    }

    // Check duplicate student ID globally
    const existing = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Student ID ${studentId} is already registered` });
    }

    const student = new Student({
      studentId: studentId.toUpperCase(),
      fullName,
      email,
      batch: batchId,
      course: batch.course,
      college: batch.college,
      language: language.toUpperCase().trim(),
    });

    await student.save();
    return res.status(201).json({ success: true, data: student });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk upload students (Excel/CSV parse result)
exports.addStudentsBulk = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { students } = req.body; // Array of { studentId, fullName, email, language }

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid students array is required' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Validate duplicates in database and inside the input array
    const studentIds = students.map(s => s.studentId.toUpperCase());
    const duplicates = await Student.find({ studentId: { $in: studentIds } });
    if (duplicates.length > 0) {
      const dupList = duplicates.map(d => d.studentId).join(', ');
      return res.status(400).json({ success: false, message: `The following Student IDs are already registered: ${dupList}` });
    }

    // Get all valid language subjects for this batch to validate inputs
    const Subject = require('../models/Subject');
    const Semester = require('../models/Semester');
    const semesters = await Semester.find({ batch: batchId });
    const semesterIds = semesters.map(s => s._id);
    const validLangSubjects = await Subject.find({
      semester: { $in: semesterIds },
      subjectType: 'language',
    });
    const validLangIds = validLangSubjects.map(sub => sub.subjectId.toUpperCase());

    // Validate that every student has a valid language subject ID
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (!s.language) {
        return res.status(400).json({ success: false, message: `Row ${i + 1} is missing the language Subject ID.` });
      }
      const upperLang = s.language.toUpperCase().trim();
      if (!validLangIds.includes(upperLang)) {
        return res.status(400).json({ success: false, message: `Row ${i + 1} has an invalid language Subject ID "${s.language}". It must match a registered language subject for this batch (e.g. ${validLangIds.join(', ') || 'No language subjects registered yet'}).` });
      }
    }

    // Format students
    const studentsToInsert = students.map(s => ({
      studentId: s.studentId.toUpperCase(),
      fullName: s.fullName,
      email: s.email,
      batch: batchId,
      course: batch.course,
      college: batch.college,
      language: s.language.toUpperCase().trim(),
    }));

    await Student.insertMany(studentsToInsert);
    return res.status(201).json({ success: true, message: `Successfully registered ${studentsToInsert.length} students` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all students in a batch
exports.getStudents = async (req, res) => {
  try {
    const { batchId } = req.params;
    const students = await Student.find({ batch: batchId }).sort({ studentId: 1 });
    return res.status(200).json({ success: true, data: students });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a semester under a batch
exports.createSemester = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Semester name is required' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const semester = new Semester({
      name,
      batch: batchId,
    });

    await semester.save();
    return res.status(201).json({ success: true, data: semester });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Semester name already exists for this batch' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get semesters for a batch
exports.getSemesters = async (req, res) => {
  try {
    const { batchId } = req.params;
    const semesters = await Semester.find({ batch: batchId }).sort({ name: 1 });
    return res.status(200).json({ success: true, data: semesters });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a section under a semester
exports.createSection = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Section name is required' });
    }

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    const section = new Section({
      name,
      semester: semesterId,
    });

    await section.save();
    return res.status(201).json({ success: true, data: section });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Section already exists for this semester' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get sections for a semester
exports.getSections = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const sections = await Section.find({ semester: semesterId }).sort({ name: 1 });
    return res.status(200).json({ success: true, data: sections });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Save student allotments for a semester in bulk
exports.saveAllotments = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { allotments } = req.body; // Array of { studentId: ObjectId, sectionId: ObjectId | null }

    if (!allotments || !Array.isArray(allotments)) {
      return res.status(400).json({ success: false, message: 'Allotments array is required' });
    }

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    // Process each allotment sequentially or via bulkWrite
    const bulkOps = allotments.map(a => {
      if (a.sectionId === null || a.sectionId === '') {
        return {
          deleteOne: {
            filter: { student: a.studentId, semester: semesterId }
          }
        };
      } else {
        return {
          updateOne: {
            filter: { student: a.studentId, semester: semesterId },
            update: { $set: { section: a.sectionId } },
            upsert: true
          }
        };
      }
    });

    if (bulkOps.length > 0) {
      await Allotment.bulkWrite(bulkOps);
    }

    return res.status(200).json({ success: true, message: 'Student allotments saved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get allotments for a semester
exports.getAllotments = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const allotments = await Allotment.find({ semester: semesterId });
    return res.status(200).json({ success: true, data: allotments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

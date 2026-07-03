const Subject = require('../models/Subject');
const SubjectAllocation = require('../models/SubjectAllocation');
const User = require('../models/User');
const Semester = require('../models/Semester');

// Create a new subject under a semester
exports.createSubject = async (req, res) => {
  try {
    const { subjectId, name, semesterId, subjectType } = req.body;

    if (!subjectId || !name || !semesterId) {
      return res.status(400).json({ success: false, message: 'Subject ID, Name, and Semester are required' });
    }

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    const cleanType = subjectType ? subjectType.toLowerCase().trim() : 'regular';
    if (!['regular', 'language'].includes(cleanType)) {
      return res.status(400).json({ success: false, message: 'Subject type must be either regular or language' });
    }

    const course = req.user.department;
    const college = req.user.college;

    const subject = new Subject({
      subjectId: subjectId.toUpperCase(),
      name,
      semester: semesterId,
      course,
      college,
      subjectType: cleanType,
    });

    await subject.save();
    return res.status(201).json({ success: true, data: subject });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Subject ID already exists in this semester' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all subjects for a semester
exports.getSubjects = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const subjects = await Subject.find({ semester: semesterId }).sort({ subjectId: 1 });
    return res.status(200).json({ success: true, data: subjects });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a subject
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Cascade delete allocations
    await SubjectAllocation.deleteMany({ subject: id });
    await Subject.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: 'Subject and associated allocations deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a subject allocation (Subject -> Faculty)
exports.createAllocation = async (req, res) => {
  try {
    const { subjectId, semesterId, sectionId, facultyId } = req.body;

    if (!subjectId || !semesterId || !facultyId) {
      return res.status(400).json({ success: false, message: 'Subject, Semester, and Faculty are required' });
    }

    // Validate subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Validate faculty exists and is indeed a Faculty
    const faculty = await User.findOne({ _id: facultyId, role: 'Faculty' });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    // Check college matches HOD college
    const college = req.user.college;
    const course = req.user.department;

    // Create unique composite record
    const allocation = new SubjectAllocation({
      subject: subjectId,
      semester: semesterId,
      section: sectionId || null, // default to null if no section
      faculty: facultyId,
      course,
      college,
    });

    await allocation.save();
    return res.status(201).json({ success: true, data: allocation });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This subject is already allocated to a faculty member for this section/semester' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get allocations for a semester
exports.getAllocations = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const allocations = await SubjectAllocation.find({ semester: semesterId })
      .populate('subject')
      .populate('section')
      .populate('faculty', 'fullName employeeId email');
    return res.status(200).json({ success: true, data: allocations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete an allocation
exports.deleteAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const allocation = await SubjectAllocation.findById(id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    await SubjectAllocation.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Allocation deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Faculty list for dropdown (filtered by HOD's college)
exports.getFacultyList = async (req, res) => {
  try {
    const college = req.user.college;
    // Find all active Faculty users in the same college
    const facultyList = await User.find({ role: 'Faculty', college, status: 'active' }).sort({ fullName: 1 });
    return res.status(200).json({ success: true, data: facultyList });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all language subjects registered for a batch (across all its semesters)
exports.getBatchLanguageSubjects = async (req, res) => {
  try {
    const { batchId } = req.params;
    // Find all semesters for this batch
    const semesters = await Semester.find({ batch: batchId });
    const semesterIds = semesters.map(s => s._id);

    // Find all subjects in these semesters of type 'language'
    const subjects = await Subject.find({
      semester: { $in: semesterIds },
      subjectType: 'language',
    }).sort({ subjectId: 1 });

    return res.status(200).json({ success: true, data: subjects });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

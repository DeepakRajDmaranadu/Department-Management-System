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
      faculty: req.user._id,
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

    // Only creator faculty can edit
    if (assignment.faculty.toString() !== req.user._id.toString()) {
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

    if (assignment.faculty.toString() !== req.user._id.toString()) {
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

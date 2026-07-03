const SubjectAllocation = require('../models/SubjectAllocation');
const Student = require('../models/Student');
const Allotment = require('../models/Allotment');
const Attendance = require('../models/Attendance');

// Get all allocations for the logged-in faculty member
exports.getMyAllocations = async (req, res) => {
  try {
    const allocations = await SubjectAllocation.find({ faculty: req.user._id })
      .populate('subject')
      .populate('semester')
      .populate('section');

    return res.status(200).json({ success: true, data: allocations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get students and their attendance status for an allocation and a date
exports.getStudentsForAttendance = async (req, res) => {
  try {
    const { allocationId, date } = req.query;

    if (!allocationId || !date) {
      return res.status(400).json({ success: false, message: 'allocationId and date are required' });
    }

    const allocation = await SubjectAllocation.findById(allocationId)
      .populate('subject')
      .populate('semester');

    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    const subject = allocation.subject;
    const semester = allocation.semester;
    const batchId = semester.batch;
    const semesterId = semester._id;

    // Define student query base
    let studentQuery = { batch: batchId };

    // Apply section filter if section is allocated and allotments exist in this semester
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

    // Parse date normalized to UTC midnight
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Look for existing attendance record
    const attendance = await Attendance.findOne({
      subject: subject._id,
      date: attendanceDate,
      section: allocation.section || null,
    });

    // Map students with attendance status
    const data = students.map(student => {
      const record = attendance
        ? attendance.records.find(r => r.student.toString() === student._id.toString())
        : null;

      return {
        _id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        language: student.language,
        status: record ? record.status : 'present', // default to present if unmarked
      };
    });

    let editable = true;
    let minsRemaining = null;
    if (attendance && req.user.role === 'Faculty') {
      const msPassed = Date.now() - new Date(attendance.createdAt).getTime();
      const minsPassed = msPassed / (1000 * 60);
      if (minsPassed > 30) {
        editable = false;
      } else {
        minsRemaining = Math.max(0, 30 - Math.floor(minsPassed));
      }
    }

    return res.status(200).json({
      success: true,
      data,
      isMarked: !!attendance,
      editable,
      minsRemaining,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create or update student attendance
exports.submitAttendance = async (req, res) => {
  try {
    const { allocationId, date, records } = req.body;

    if (!allocationId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'allocationId, date, and records are required' });
    }

    const allocation = await SubjectAllocation.findById(allocationId);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    // Normalize date to UTC midnight
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Find and update or insert new Attendance record
    const filter = {
      subject: allocation.subject,
      date: attendanceDate,
      section: allocation.section || null,
    };

    const update = {
      semester: allocation.semester,
      faculty: req.user._id,
      records: records.map(r => ({
        student: r.studentId,
        status: r.status,
      })),
    };

    const existing = await Attendance.findOne(filter);
    if (existing && req.user.role === 'Faculty') {
      const msPassed = Date.now() - new Date(existing.createdAt).getTime();
      const minutesPassed = msPassed / (1000 * 60);
      if (minutesPassed > 30) {
        return res.status(400).json({
          success: false,
          message: 'Attendance register editing is locked. It cannot be updated after 30 minutes of initial submission.'
        });
      }
    }

    const attendance = await Attendance.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true, upsert: true }
    );

    return res.status(200).json({ success: true, message: 'Attendance recorded successfully', data: attendance });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch consolidated stats for all students of a subject allocation
exports.getConsolidatedAttendance = async (req, res) => {
  try {
    const { allocationId } = req.query;

    if (!allocationId) {
      return res.status(400).json({ success: false, message: 'allocationId is required' });
    }

    const allocation = await SubjectAllocation.findById(allocationId)
      .populate('subject')
      .populate('semester');

    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    const subject = allocation.subject;
    const semester = allocation.semester;
    const batchId = semester.batch;
    const semesterId = semester._id;

    // Fetch students roster
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

    // Fetch all attendance logs for this allocation
    const attendanceRecords = await Attendance.find({
      subject: subject._id,
      semester: semesterId,
      section: allocation.section || null,
    });

    const totalClasses = attendanceRecords.length;

    const consolidated = students.map(student => {
      let presentCount = 0;
      attendanceRecords.forEach(att => {
        const record = att.records.find(r => r.student.toString() === student._id.toString());
        if (record && record.status === 'present') {
          presentCount++;
        }
      });

      const percentage = totalClasses > 0 ? parseFloat(((presentCount / totalClasses) * 100).toFixed(2)) : 100.0;

      return {
        _id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        language: student.language,
        totalClasses,
        presentCount,
        absentCount: totalClasses - presentCount,
        percentage,
      };
    });

    return res.status(200).json({
      success: true,
      totalClasses,
      data: consolidated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch list of marked daily registers sorted by date
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { allocationId } = req.query;

    if (!allocationId) {
      return res.status(400).json({ success: false, message: 'allocationId is required' });
    }

    const allocation = await SubjectAllocation.findById(allocationId);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    const attendanceRecords = await Attendance.find({
      subject: allocation.subject,
      semester: allocation.semester,
      section: allocation.section || null,
    })
      .sort({ date: -1 })
      .populate('records.student', 'studentId fullName');

    const history = attendanceRecords.map(rec => {
      const total = rec.records.length;
      const present = rec.records.filter(r => r.status === 'present').length;
      const absent = total - present;
      const msPassed = Date.now() - new Date(rec.createdAt).getTime();
      const isEditable = (msPassed / (1000 * 60)) <= 30;

      return {
        _id: rec._id,
        date: rec.date,
        createdAt: rec.createdAt,
        isEditable,
        total,
        present,
        absent,
        records: rec.records.map(r => ({
          studentId: r.student?.studentId || 'N/A',
          fullName: r.student?.fullName || 'Unknown',
          status: r.status,
        })),
      };
    });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


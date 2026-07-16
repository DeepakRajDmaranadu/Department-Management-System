const SubjectAllocation = require('../models/SubjectAllocation');
const Student = require('../models/Student');
const Allotment = require('../models/Allotment');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const Semester = require('../models/Semester');

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
        admissionNumber: student.admissionNumber || 'N/A',
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
        updatedByHOD: rec.updatedByHOD || false,
        total,
        present,
        absent,
        records: rec.records.map(r => ({
          studentId: r.student?.studentId || 'N/A',
          fullName: r.student?.fullName || 'Unknown',
          status: r.status,
          updatedByHOD: r.updatedByHOD || false,
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

// Fetch consolidated attendance report for HOD
exports.getConsolidatedAttendanceForHOD = async (req, res) => {
  try {
    const { semesterId, sectionId, subjectId, startDate, endDate } = req.query;

    if (!semesterId) {
      return res.status(400).json({ success: false, message: 'semesterId is required' });
    }

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

    // Fetch allocations in this semester
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

      // Fetch attendance records for this subject (semester-wide, optionally date-filtered)
      const attendanceQuery = { subject: subjectId, semester: semesterId };
      if (startDate || endDate) {
        attendanceQuery.date = {};
        if (startDate) {
          attendanceQuery.date.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          attendanceQuery.date.$lte = end;
        }
      }
      const attendanceRecords = await Attendance.find(attendanceQuery);
      const allAllotments = await Allotment.find({ semester: semesterId });

      const data = filteredStudents.map(student => {
        const studentAllotment = allAllotments.find(a => a.student.toString() === student._id.toString());
        const studentSectionId = studentAllotment ? studentAllotment.section?.toString() : null;

        // Filter attendance records to match student's specific section
        const studentAttRecords = attendanceRecords.filter(att => {
          const targetSectionId = (sectionId && sectionId !== 'all') ? sectionId : studentSectionId;
          if (targetSectionId) {
            return att.section?.toString() === targetSectionId;
          }
          return !att.section;
        });

        const studentTotalClasses = studentAttRecords.length;
        let presentCount = 0;
        studentAttRecords.forEach(att => {
          const record = att.records.find(r => r.student.toString() === student._id.toString());
          if (record && record.status === 'present') {
            presentCount++;
          }
        });
        const percentage = studentTotalClasses > 0 ? parseFloat(((presentCount / studentTotalClasses) * 100).toFixed(2)) : 'N/A';
        return {
          _id: student._id,
          studentId: student.studentId,
          admissionNumber: student.admissionNumber || 'N/A',
          fullName: student.fullName,
          email: student.email,
          language: student.language,
          totalClasses: studentTotalClasses,
          presentCount,
          absentCount: studentTotalClasses - presentCount,
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
    const consolidatedData = [];

    // Pre-fetch attendance records for all subjects to optimize querying database (optionally date-filtered)
    const attendanceQuery = { semester: semesterId };
    if (startDate || endDate) {
      attendanceQuery.date = {};
      if (startDate) {
        attendanceQuery.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        attendanceQuery.date.$lte = end;
      }
    }
    const allAttendanceRecords = await Attendance.find(attendanceQuery);
    const allAllotments = await Allotment.find({ semester: semesterId });

    students.forEach(student => {
      const studentAllotment = allAllotments.find(a => a.student.toString() === student._id.toString());
      const studentSectionId = studentAllotment ? studentAllotment.section?.toString() : null;

      const studentAttendance = {};
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
          studentAttendance[sub._id] = {
            percentage: 'N/A',
            presentCount: 0,
            totalClasses: 0,
            isEnrolled: false
          };
          return;
        }

        const subRecords = allAttendanceRecords.filter(att => {
          const isSameSub = att.subject.toString() === sub._id.toString();
          if (!isSameSub) return false;
          
          const targetSectionId = (sectionId && sectionId !== 'all') ? sectionId : studentSectionId;
          if (targetSectionId) {
            return att.section?.toString() === targetSectionId;
          }
          return !att.section;
        });

        const totalClasses = subRecords.length;
        let presentCount = 0;
        subRecords.forEach(att => {
          const record = att.records.find(r => r.student.toString() === student._id.toString());
          if (record && record.status === 'present') {
            presentCount++;
          }
        });

        const percentage = totalClasses > 0 ? parseFloat(((presentCount / totalClasses) * 100).toFixed(2)) : 'N/A';

        studentAttendance[sub._id] = {
          percentage,
          presentCount,
          totalClasses,
          isEnrolled: true
        };

        if (totalClasses > 0) {
          sumPercentages += percentage;
          count++;
        }
      });

      const overallPercentage = count > 0
        ? parseFloat((sumPercentages / count).toFixed(2))
        : 'N/A';

      consolidatedData.push({
        _id: student._id,
        studentId: student.studentId,
        admissionNumber: student.admissionNumber || 'N/A',
        fullName: student.fullName,
        email: student.email,
        language: student.language,
        attendance: studentAttendance,
        overallPercentage
      });
    });

    return res.status(200).json({
      success: true,
      mode: 'all',
      subjects,
      data: consolidatedData
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch daily attendance roster and status for HOD
exports.getHODDailyAttendance = async (req, res) => {
  try {
    const { subjectId, semesterId, sectionId, date } = req.query;

    if (!subjectId || !semesterId || !date) {
      return res.status(400).json({ success: false, message: 'subjectId, semesterId, and date are required' });
    }

    const Subject = require('../models/Subject');
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const Semester = require('../models/Semester');
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    const batchId = semester.batch;

    // Define student query base
    let studentQuery = { batch: batchId };

    // Apply section filter if section is specified
    if (sectionId && sectionId !== 'all' && sectionId !== 'null' && sectionId !== '') {
      const allotmentsCount = await Allotment.countDocuments({ semester: semesterId });
      if (allotmentsCount > 0) {
        const allotments = await Allotment.find({ semester: semesterId, section: sectionId });
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
    const targetSectionId = (sectionId && sectionId !== 'all' && sectionId !== 'null' && sectionId !== '') ? sectionId : null;
    const attendance = await Attendance.findOne({
      subject: subjectId,
      date: attendanceDate,
      section: targetSectionId,
    }).populate('faculty', 'fullName');

    // Map students with attendance status
    const data = students.map(student => {
      const record = attendance
        ? attendance.records.find(r => r.student.toString() === student._id.toString())
        : null;

      return {
        _id: student._id,
        studentId: student.studentId,
        admissionNumber: student.admissionNumber || 'N/A',
        fullName: student.fullName,
        email: student.email,
        language: student.language,
        status: record ? record.status : 'present', // default to present if unmarked
      };
    });

    return res.status(200).json({
      success: true,
      data,
      isMarked: !!attendance,
      facultyName: attendance ? (attendance.faculty?.fullName || 'Unknown Faculty') : 'Not Marked Yet',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create or update daily attendance by HOD (bypassing 30-minute lock)
exports.submitHODDailyAttendance = async (req, res) => {
  try {
    const { subjectId, semesterId, sectionId, date, records } = req.body;

    if (!subjectId || !semesterId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'subjectId, semesterId, date, and records are required' });
    }

    // Normalize date to UTC midnight
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const targetSectionId = (sectionId && sectionId !== 'all' && sectionId !== 'null' && sectionId !== '') ? sectionId : null;

    // Find if record already exists
    const filter = {
      subject: subjectId,
      date: attendanceDate,
      section: targetSectionId,
    };

    const existing = await Attendance.findOne(filter);

    // Find allocated faculty members to set in the document (so it reflects back to them)
    let facultyId = req.user._id;
    if (existing) {
      facultyId = existing.faculty;
    } else {
      const SubjectAllocation = require('../models/SubjectAllocation');
      const allocation = await SubjectAllocation.findOne({
        subject: subjectId,
        semester: semesterId,
        section: targetSectionId
      });
      if (allocation) {
        facultyId = allocation.faculty;
      }
    }

    const update = {
      semester: semesterId,
      faculty: facultyId,
      records: records.map(r => {
        let isRecordUpdatedByHOD = false;
        if (existing) {
          const orig = existing.records.find(ex => ex.student.toString() === r.studentId.toString());
          if (orig) {
            isRecordUpdatedByHOD = (orig.status !== r.status) || (orig.updatedByHOD === true);
          } else {
            isRecordUpdatedByHOD = true;
          }
        } else {
          isRecordUpdatedByHOD = true;
        }

        return {
          student: r.studentId,
          status: r.status,
          updatedByHOD: isRecordUpdatedByHOD,
        };
      }),
      updatedByHOD: true,
    };

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


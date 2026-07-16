const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const InternalAssessment = require('../models/InternalAssessment');
const InternalAssessmentMark = require('../models/InternalAssessmentMark');
const DynamicConsolidatedSheet = require('../models/DynamicConsolidatedSheet');
const Allotment = require('../models/Allotment');

// Fetch baseline data and saved configuration for HOD Dynamic IA sheet
exports.getDynamicSheetData = async (req, res) => {
  try {
    const { batchId, semesterId, subjectId } = req.query;

    if (!batchId || !semesterId || !subjectId) {
      return res.status(400).json({ success: false, message: 'batchId, semesterId, and subjectId are required' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    // 1. Fetch student roster in batch
    let studentQuery = { batch: batchId };
    let students = await Student.find(studentQuery).sort({ studentId: 1 });

    // Apply language subject roster filtering
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

    // 2. Fetch Attendance percentages for ALL subjects in the semester
    const allAttendanceRecords = await Attendance.find({
      semester: semesterId,
    });
    const allAllotments = await Allotment.find({ semester: semesterId });
    const allSubjectsInSem = await Subject.find({ semester: semesterId });

    const allSubjectAttendance = {};
    
    // Initialize map for all subjects
    allSubjectsInSem.forEach(sub => {
      allSubjectAttendance[sub._id.toString()] = {};
    });

    for (const sub of allSubjectsInSem) {
      const subIdStr = sub._id.toString();
      const subRecords = allAttendanceRecords.filter(att => att.subject.toString() === subIdStr);
      
      let subStudents = [...students];
      if (sub.subjectType === 'language') {
        const langCode = sub.subjectId.toUpperCase().trim();
        subStudents = subStudents.filter(student => {
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

      subStudents.forEach(student => {
        const studentAllotment = allAllotments.find(a => a.student.toString() === student._id.toString());
        const studentSectionId = studentAllotment ? studentAllotment.section?.toString() : null;

        const studentAttRecords = subRecords.filter(att => {
          if (studentSectionId) {
            return att.section?.toString() === studentSectionId;
          }
          return !att.section;
        });

        let presentCount = 0;
        studentAttRecords.forEach(att => {
          const record = att.records.find(r => r.student.toString() === student._id.toString());
          if (record && record.status === 'present') {
            presentCount++;
          }
        });

        allSubjectAttendance[subIdStr][student._id.toString()] = studentAttRecords.length > 0
          ? parseFloat(((presentCount / studentAttRecords.length) * 100).toFixed(2))
          : 100.0;
      });
    }

    const attendanceMap = allSubjectAttendance[subjectId.toString()] || {};

    // 3. Fetch Assignment completion percentages
    const allAssignments = await Assignment.find({
      subject: subjectId,
      semester: semesterId,
    });
    const assignmentMap = {};
    students.forEach(student => {
      let TA = 0;
      let SA = 0;
      allAssignments.forEach(assign => {
        const subRecord = assign.submissions.find(s => s.student.toString() === student._id.toString());
        if (subRecord) {
          TA++;
          if (subRecord.status === 'submitted') {
            SA++;
          }
        }
      });
      assignmentMap[student._id] = TA > 0 ? parseFloat(((SA / TA) * 100).toFixed(2)) : 0.0;
    });

    // 4. Fetch IA marks lists
    const assessments = await InternalAssessment.find({
      batch: batchId,
      semester: semesterId,
    });

    const iaMap = {};
    const iaMaxMap = {};

    for (const ia of assessments) {
      const marksheet = await InternalAssessmentMark.findOne({
        internalAssessment: ia._id,
        subject: subjectId,
      });
      iaMap[ia._id] = {};
      iaMaxMap[ia._id] = marksheet ? marksheet.maxMarks : 50;
      if (marksheet) {
        marksheet.marks.forEach(m => {
          iaMap[ia._id][m.student] = m.status === 'absent' ? 0 : m.marksObtained;
        });
      }
    }

    // 5. Fetch saved sheet config
    const savedSheet = await DynamicConsolidatedSheet.findOne({
      batch: batchId,
      semester: semesterId,
      subject: subjectId,
    });

    return res.status(200).json({
      success: true,
      data: {
        students: students.map(s => ({
          _id: s._id,
          studentId: s.studentId,
          admissionNumber: s.admissionNumber || 'N/A',
          fullName: s.fullName,
          language: s.language,
        })),
        attendance: attendanceMap,
        allSubjectAttendance,
        assignments: assignmentMap,
        iaMarks: iaMap,
        iaMaxMarks: iaMaxMap,
        iaAssessments: assessments.map(ia => ({ _id: ia._id, title: ia.title })),
        savedSheet,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Save HOD Dynamic IA sheet configuration (upsert logic)
exports.saveDynamicSheetConfig = async (req, res) => {
  try {
    const { batchId, semesterId, subjectId, columns, customData } = req.body;

    if (!batchId || !semesterId || !subjectId || !columns) {
      return res.status(400).json({ success: false, message: 'batchId, semesterId, subjectId, and columns are required' });
    }

    const filter = {
      batch: batchId,
      semester: semesterId,
      subject: subjectId,
    };

    const update = {
      columns,
      customData: customData || [],
    };

    const sheet = await DynamicConsolidatedSheet.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Dynamic consolidation sheet saved successfully!',
      data: sheet,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch dynamic sheet data for all subjects in the semester (for export)
exports.exportAllDynamicSheets = async (req, res) => {
  try {
    const { batchId, semesterId } = req.query;

    if (!batchId || !semesterId) {
      return res.status(400).json({ success: false, message: 'batchId and semesterId are required' });
    }

    // 1. Fetch student roster in batch
    let studentQuery = { batch: batchId };
    let students = await Student.find(studentQuery).sort({ studentId: 1 });

    // 2. Fetch all subjects in the semester
    const allSubjects = await Subject.find({ semester: semesterId }).sort({ subjectId: 1 });

    // 3. Fetch all attendance records for the semester
    const allAttendanceRecords = await Attendance.find({
      semester: semesterId,
    });
    const allAllotments = await Allotment.find({ semester: semesterId });

    // 4. Fetch all assignments for the semester
    const allAssignments = await Assignment.find({
      semester: semesterId,
    });

    // 5. Fetch all IA assessments for the semester
    const assessments = await InternalAssessment.find({
      batch: batchId,
      semester: semesterId,
    });

    // 6. Fetch all dynamic sheet configurations
    const savedSheets = await DynamicConsolidatedSheet.find({
      batch: batchId,
      semester: semesterId,
    });

    // 7. Loop over each subject and prepare its payload
    const subjectsData = {};

    for (const sub of allSubjects) {
      const subIdStr = sub._id.toString();
      const subCode = sub.subjectId.toUpperCase().trim();

      // Filter student roster if this is a language subject
      let subStudents = [...students];
      if (sub.subjectType === 'language') {
        subStudents = subStudents.filter(student => {
          if (!student.language) return false;
          const studentLang = student.language.toUpperCase().trim();
          return (
            studentLang === subCode ||
            subCode.startsWith(studentLang) ||
            studentLang.startsWith(subCode) ||
            (studentLang.length >= 3 && subCode.substring(0, 3) === studentLang.substring(0, 3))
          );
        });
      }

      // Compute Attendance map
      const subRecords = allAttendanceRecords.filter(att => att.subject.toString() === subIdStr);
      const attendanceMap = {};
      subStudents.forEach(student => {
        const studentAllotment = allAllotments.find(a => a.student.toString() === student._id.toString());
        const studentSectionId = studentAllotment ? studentAllotment.section?.toString() : null;

        const studentAttRecords = subRecords.filter(att => {
          if (studentSectionId) {
            return att.section?.toString() === studentSectionId;
          }
          return !att.section;
        });

        let presentCount = 0;
        studentAttRecords.forEach(att => {
          const record = att.records.find(r => r.student.toString() === student._id.toString());
          if (record && record.status === 'present') {
            presentCount++;
          }
        });

        attendanceMap[student._id.toString()] = studentAttRecords.length > 0
          ? parseFloat(((presentCount / studentAttRecords.length) * 100).toFixed(2))
          : 100.0;
      });

      // Compute Assignment map
      const subAssignments = allAssignments.filter(assign => assign.subject.toString() === subIdStr);
      const assignmentMap = {};
      subStudents.forEach(student => {
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
        assignmentMap[student._id.toString()] = TA > 0 ? parseFloat(((SA / TA) * 100).toFixed(2)) : 0.0;
      });

      // Compute IA map & IA max map
      const iaMap = {};
      const iaMaxMap = {};

      for (const ia of assessments) {
        const marksheet = await InternalAssessmentMark.findOne({
          internalAssessment: ia._id,
          subject: sub._id,
        });
        iaMap[ia._id] = {};
        iaMaxMap[ia._id] = marksheet ? marksheet.maxMarks : 50;
        if (marksheet) {
          marksheet.marks.forEach(m => {
            iaMap[ia._id][m.student] = m.status === 'absent' ? 0 : m.marksObtained;
          });
        }
      }

      // Find saved sheet configuration
      const savedSheet = savedSheets.find(s => s.subject.toString() === subIdStr);

      subjectsData[subIdStr] = {
        students: subStudents.map(s => ({
          _id: s._id,
          studentId: s.studentId,
          admissionNumber: s.admissionNumber || 'N/A',
          fullName: s.fullName,
          language: s.language,
        })),
        attendance: attendanceMap,
        assignments: assignmentMap,
        iaMarks: iaMap,
        iaMaxMarks: iaMaxMap,
        savedSheet,
      };
    }

    // 8. Fetch semester-wide attendance map (for overall average computations)
    const semesterSubjectAttendance = {};
    for (const sub of allSubjects) {
      const subIdStr = sub._id.toString();
      semesterSubjectAttendance[subIdStr] = subjectsData[subIdStr].attendance;
    }

    const allSubjectAttendance = {};
    students.forEach(student => {
      let sumPercentages = 0;
      let count = 0;

      allSubjects.forEach(sub => {
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

        if (!isEnrolled) return;

        const subIdStr = sub._id.toString();
        const subRecords = allAttendanceRecords.filter(att => att.subject.toString() === subIdStr);
        const studentAllotment = allAllotments.find(a => a.student.toString() === student._id.toString());
        const studentSectionId = studentAllotment ? studentAllotment.section?.toString() : null;

        const studentAttRecords = subRecords.filter(att => {
          if (studentSectionId) {
            return att.section?.toString() === studentSectionId;
          }
          return !att.section;
        });

        if (studentAttRecords.length > 0) {
          const percentage = semesterSubjectAttendance[subIdStr][student._id.toString()];
          sumPercentages += percentage;
          count++;
        }
      });

      allSubjectAttendance[student._id.toString()] = count > 0
        ? parseFloat((sumPercentages / count).toFixed(2))
        : 100.0;
    });

    // Inject allSubjectAttendance and semesterSubjectAttendance maps into each subject's data context
    for (const sub of allSubjects) {
      const subIdStr = sub._id.toString();
      subjectsData[subIdStr].allSubjectAttendance = semesterSubjectAttendance;
      subjectsData[subIdStr].overallAttendance = allSubjectAttendance;
    }

    return res.status(200).json({
      success: true,
      data: {
        subjects: allSubjects.map(sub => ({ _id: sub._id, subjectId: sub.subjectId, name: sub.name })),
        iaAssessments: assessments.map(ia => ({ _id: ia._id, title: ia.title })),
        subjectsData,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


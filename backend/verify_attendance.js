const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend
dotenv.config({ path: path.join(__dirname, '.env') });

const Batch = require('./models/Batch');
const Semester = require('./models/Semester');
const Section = require('./models/Section');
const Subject = require('./models/Subject');
const SubjectAllocation = require('./models/SubjectAllocation');
const Student = require('./models/Student');
const Allotment = require('./models/Allotment');
const Attendance = require('./models/Attendance');
const User = require('./models/User');

const runTest = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Cleanup existing test records
    console.log('Cleaning up existing test data...');
    await Batch.deleteMany({ batchId: 'AB2023' });
    await Subject.deleteMany({ subjectId: { $in: ['AKAN101', 'ACS101'] } });
    await Student.deleteMany({ studentId: { $in: ['ASTU001', 'ASTU002', 'ASTU003'] } });
    await SubjectAllocation.deleteMany({});
    await Allotment.deleteMany({});
    await Attendance.deleteMany({});
    await User.deleteMany({ email: 'fac_att@test.com' });

    console.log('--- Step 1: Create Test Batch, Semester, and Section ---');
    const batch = new Batch({
      batchId: 'AB2023',
      years: '2023-2026',
      course: 'Computer Science',
      college: 'CoE'
    });
    await batch.save();

    const semester = new Semester({
      name: 'Semester 1',
      batch: batch._id
    });
    await semester.save();

    const sectionA = new Section({ name: 'Section A', semester: semester._id });
    await sectionA.save();

    console.log('--- Step 2: Create Test Subjects (Regular & Language) ---');
    const regularSubject = new Subject({
      subjectId: 'ACS101',
      name: 'Computer Networks',
      semester: semester._id,
      course: batch.course,
      college: batch.college,
      subjectType: 'regular'
    });
    await regularSubject.save();

    const languageSubject = new Subject({
      subjectId: 'AKAN101',
      name: 'Kannada Language',
      semester: semester._id,
      course: batch.course,
      college: batch.college,
      subjectType: 'language'
    });
    await languageSubject.save();

    console.log('--- Step 3: Create Test Faculty ---');
    const faculty = new User({
      fullName: 'Faculty Attendance',
      email: 'fac_att@test.com',
      employeeId: 'FAC_ATT_001',
      password: 'Password123!',
      role: 'Faculty',
      college: 'CoE',
      department: 'Computer Science',
      status: 'active'
    });
    await faculty.save();

    console.log('--- Step 4: Map Subjects to Faculty ---');
    const regularAllocation = new SubjectAllocation({
      subject: regularSubject._id,
      semester: semester._id,
      section: sectionA._id,
      faculty: faculty._id,
      course: batch.course,
      college: batch.college
    });
    await regularAllocation.save();

    const languageAllocation = new SubjectAllocation({
      subject: languageSubject._id,
      semester: semester._id,
      section: sectionA._id,
      faculty: faculty._id,
      course: batch.course,
      college: batch.college
    });
    await languageAllocation.save();

    console.log('--- Step 5: Create Students with Language Specs ---');
    // Student 1: Kannada (AKAN101) language choice, assigned to Section A
    const student1 = new Student({
      studentId: 'ASTU001',
      fullName: 'John Kannada',
      email: 'john.kan@test.com',
      batch: batch._id,
      course: batch.course,
      college: batch.college,
      language: 'AKAN101'
    });
    await student1.save();

    const allot1 = new Allotment({
      student: student1._id,
      semester: semester._id,
      section: sectionA._id
    });
    await allot1.save();

    // Student 2: Hindi (AHIN101) language choice, assigned to Section A
    const student2 = new Student({
      studentId: 'ASTU002',
      fullName: 'Jane Hindi',
      email: 'jane.hin@test.com',
      batch: batch._id,
      course: batch.course,
      college: batch.college,
      language: 'AHIN101'
    });
    await student2.save();

    const allot2 = new Allotment({
      student: student2._id,
      semester: semester._id,
      section: sectionA._id
    });
    await allot2.save();

    console.log('Students registered & section assignments mapped.');

    console.log('--- Step 6: Test Student Fetching Logic for Regular Subject ---');
    // Regular subject ACS101 under Section A should fetch all students in Section A (both ASTU001 & ASTU002)
    const regularAllotments = await Allotment.find({ semester: semester._id, section: sectionA._id });
    const regIds = regularAllotments.map(a => a.student);
    const regStudentsList = await Student.find({ _id: { $in: regIds } });

    console.log(`Regular Subject fetched ${regStudentsList.length} students:`);
    regStudentsList.forEach(s => console.log(`- ${s.studentId} (${s.fullName}), Language: ${s.language}`));
    if (regStudentsList.length !== 2) {
      throw new Error('FAILED: Regular subject should return all students in section');
    }

    console.log('--- Step 7: Test Student Fetching Logic for Language Subject ---');
    // Language subject AKAN101 under Section A should only fetch students in Section A whose language is 'AKAN101'
    const langAllotments = await Allotment.find({ semester: semester._id, section: sectionA._id });
    const langIds = langAllotments.map(a => a.student);
    const langStudentsList = await Student.find({
      _id: { $in: langIds },
      language: languageSubject.subjectId.toUpperCase().trim()
    });

    console.log(`Language Subject ${languageSubject.subjectId} fetched ${langStudentsList.length} students:`);
    langStudentsList.forEach(s => console.log(`- ${s.studentId} (${s.fullName}), Language: ${s.language}`));
    if (langStudentsList.length !== 1 || langStudentsList[0].studentId !== 'ASTU001') {
      throw new Error('FAILED: Language subject should filter and return only matching language student');
    }
    console.log('Success: Language subject student filtering operates correctly!');

    console.log('--- Step 8: Test Attendance Recording ---');
    const attendanceDate = new Date();
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const attendance = new Attendance({
      subject: languageSubject._id,
      semester: semester._id,
      section: sectionA._id,
      faculty: faculty._id,
      date: attendanceDate,
      records: [
        { student: student1._id, status: 'present' }
      ]
    });
    await attendance.save();
    console.log('Attendance registered in database.');

    // Verify index duplication checks
    const duplicateAttendance = new Attendance({
      subject: languageSubject._id,
      semester: semester._id,
      section: sectionA._id,
      faculty: faculty._id,
      date: attendanceDate,
      records: [
        { student: student1._id, status: 'absent' }
      ]
    });

    try {
      await duplicateAttendance.save();
      throw new Error('FAILED: Double marking attendance on same day & section did not throw error');
    } catch (err) {
      if (err.code === 11000) {
        console.log('Success: Duplicate attendance check rejected correctly.');
      } else {
        throw err;
      }
    }

    console.log('--- Step 9: Simulate Consolidated Attendance Calculation ---');
    const attendanceRecords = await Attendance.find({
      subject: languageSubject._id,
      semester: semester._id,
      section: sectionA._id
    });
    
    if (attendanceRecords.length !== 1) {
      throw new Error(`FAILED: Expected 1 attendance log, found ${attendanceRecords.length}`);
    }
    
    const testConsolidated = langStudentsList.map(student => {
      let presentCount = 0;
      attendanceRecords.forEach(att => {
        const record = att.records.find(r => r.student.toString() === student._id.toString());
        if (record && record.status === 'present') {
          presentCount++;
        }
      });
      return {
        studentId: student.studentId,
        totalClasses: attendanceRecords.length,
        presentCount,
        percentage: (presentCount / attendanceRecords.length) * 100
      };
    });
    
    console.log('Consolidated Output:', testConsolidated);
    if (testConsolidated[0].percentage !== 100) {
      throw new Error('FAILED: Expected 100% attendance for student 1');
    }

    console.log('--- Step 10: Simulate Attendance History Retrieval ---');
    const historyLogs = await Attendance.find({
      subject: languageSubject._id,
      semester: semester._id,
      section: sectionA._id
    }).sort({ date: -1 }).populate('records.student', 'studentId fullName');

    console.log(`History returned ${historyLogs.length} logs.`);
    if (historyLogs.length !== 1) {
      throw new Error('FAILED: Expected exactly 1 history log');
    }

    // Clean up
    console.log('Cleaning up test data...');
    await Batch.deleteMany({ batchId: 'AB2023' });
    await Subject.deleteMany({ subjectId: { $in: ['AKAN101', 'ACS101'] } });
    await Student.deleteMany({ studentId: { $in: ['ASTU001', 'ASTU002', 'ASTU003'] } });
    await SubjectAllocation.deleteMany({});
    await Allotment.deleteMany({});
    await Attendance.deleteMany({});
    await User.deleteMany({ email: 'fac_att@test.com' });

    console.log('STUDENT ATTENDANCE MODULE TEST COMPLETED SUCCESSFULLY WITH ZERO ERRORS.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Test failed with error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runTest();

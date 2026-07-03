const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Batch = require('./models/Batch');
const Semester = require('./models/Semester');
const Section = require('./models/Section');
const Subject = require('./models/Subject');
const SubjectAllocation = require('./models/SubjectAllocation');
const Student = require('./models/Student');
const Allotment = require('./models/Allotment');
const Attendance = require('./models/Attendance');

const checkDb = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const userCount = await User.countDocuments();
    const batchCount = await Batch.countDocuments();
    const semCount = await Semester.countDocuments();
    const secCount = await Section.countDocuments();
    const subCount = await Subject.countDocuments();
    const allocCount = await SubjectAllocation.countDocuments();
    const studentCount = await Student.countDocuments();
    const allotCount = await Allotment.countDocuments();
    const attCount = await Attendance.countDocuments();

    console.log('\n--- Counts ---');
    console.log('Users:', userCount);
    console.log('Batches:', batchCount);
    console.log('Semesters:', semCount);
    console.log('Sections:', secCount);
    console.log('Subjects:', subCount);
    console.log('SubjectAllocations:', allocCount);
    console.log('Students:', studentCount);
    console.log('Allotments:', allotCount);
    console.log('Attendances:', attCount);

    console.log('\n--- Subject Allocations Detailed ---');
    const allocs = await SubjectAllocation.find().populate('subject').populate('semester').populate('section').populate('faculty');
    for (const a of allocs) {
      console.log(`Alloc ID: ${a._id}`);
      console.log(`- Faculty: ${a.faculty?.fullName} (${a.faculty?.role})`);
      console.log(`- Subject: ${a.subject?.subjectId} (${a.subject?.name}) Type: ${a.subject?.subjectType}`);
      console.log(`- Semester: ${a.semester?.name}`);
      console.log(`- Section: ${a.section ? a.section.name : 'Semester-wide'}`);
    }

    console.log('\n--- Students Detailed ---');
    const students = await Student.find();
    for (const s of students) {
      console.log(`Student: ${s.fullName} (${s.studentId}) Language: ${s.language}`);
    }

    console.log('\n--- Allotments Detailed ---');
    const allotments = await Allotment.find().populate('student').populate('semester').populate('section');
    for (const a of allotments) {
      console.log(`Allotment: Student ${a.student?.fullName} (${a.student?.studentId}) -> Sem ${a.semester?.name} -> Sec ${a.section ? a.section.name : 'None'}`);
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
};

checkDb();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend
dotenv.config({ path: path.join(__dirname, '.env') });

const Batch = require('./models/Batch');
const Student = require('./models/Student');
const Semester = require('./models/Semester');
const Section = require('./models/Section');
const Allotment = require('./models/Allotment');

const runTest = async () => {
  try {
    console.log('Connecting to Mongo database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected!');

    // Cleanup existing test records
    console.log('Cleaning up existing test batch records...');
    await Batch.deleteMany({ batchId: { $in: ['TB2023', 'TB2024'] } });
    await Student.deleteMany({ studentId: { $in: ['TST001', 'TST002', 'TST003'] } });
    
    // We can also delete all allotments and sections for safety
    await Allotment.deleteMany({});
    await Section.deleteMany({});
    await Semester.deleteMany({});

    console.log('--- Step 1: Create Batch ---');
    const batch = new Batch({
      batchId: 'TB2023',
      years: '2023-2026',
      course: 'Test Computer Science',
      college: 'Test College of Engineering'
    });
    await batch.save();
    console.log('Batch created successfully:', batch.batchId, `(${batch.years})`);

    console.log('--- Step 2: Add Student Manually ---');
    const student1 = new Student({
      studentId: 'TST001',
      fullName: 'Alice Test',
      email: 'alice@test.com',
      batch: batch._id,
      course: batch.course,
      college: batch.college,
      language: 'kan'
    });
    await student1.save();
    console.log('Student 1 (Manual) registered successfully:', student1.fullName);

    console.log('--- Step 3: Add Students in Bulk (CSV/Excel payload simulation) ---');
    const studentsToInsert = [
      {
        studentId: 'TST002',
        fullName: 'Bob Test',
        email: 'bob@test.com',
        batch: batch._id,
        course: batch.course,
        college: batch.college,
        language: 'kan'
      },
      {
        studentId: 'TST003',
        fullName: 'Charlie Test',
        email: 'charlie@test.com',
        batch: batch._id,
        course: batch.course,
        college: batch.college,
        language: 'hin'
      }
    ];
    const insertedStudents = await Student.insertMany(studentsToInsert);
    console.log(`Successfully registered ${insertedStudents.length} students in bulk.`);

    console.log('--- Step 4: Create Semester under Batch ---');
    const semester = new Semester({
      name: 'Semester 1',
      batch: batch._id
    });
    await semester.save();
    console.log('Semester created successfully under Batch:', semester.name);

    console.log('--- Step 5: Create Section under Semester (Optional) ---');
    const sectionA = new Section({
      name: 'Section A',
      semester: semester._id
    });
    await sectionA.save();
    console.log('Section created successfully under Semester:', sectionA.name);

    console.log('--- Step 6: Allot Students to Section ---');
    // Allot Alice and Bob to Section A
    const allotments = [
      { student: student1._id, semester: semester._id, section: sectionA._id },
      { student: insertedStudents[0]._id, semester: semester._id, section: sectionA._id }
    ];
    await Allotment.insertMany(allotments);
    console.log('Allotments saved successfully.');

    console.log('--- Step 7: Verify Allotments ---');
    const savedAllotments = await Allotment.find({ semester: semester._id }).populate('student').populate('section');
    console.log(`Verified ${savedAllotments.length} allotments:`);
    savedAllotments.forEach(allot => {
      console.log(`- Student: ${allot.student.fullName} (${allot.student.studentId}) is allotted to: ${allot.section.name}`);
    });

    if (savedAllotments.length !== 2) {
      throw new Error('FAILED: Expected 2 allotments to be registered.');
    }

    // Cleanup
    console.log('Cleaning up test records...');
    await Batch.deleteMany({ batchId: 'TB2023' });
    await Student.deleteMany({ studentId: { $in: ['TST001', 'TST002', 'TST003'] } });
    await Semester.deleteMany({ batch: batch._id });
    await Section.deleteMany({ semester: semester._id });
    await Allotment.deleteMany({ semester: semester._id });

    console.log('BATCH TEST SUITE COMPLETED SUCCESSFULLY WITH ZERO ERRORS.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Test failed with error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runTest();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Student = require('./models/Student');
const Batch = require('./models/Batch');
const Semester = require('./models/Semester');

const checkStudents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const students = await Student.find().lean();
    console.log('\n--- Students Lean Data ---');
    console.log(JSON.stringify(students, null, 2));

    const batches = await Batch.find().lean();
    console.log('\n--- Batches Lean Data ---');
    console.log(JSON.stringify(batches, null, 2));

    const semesters = await Semester.find().lean();
    console.log('\n--- Semesters Lean Data ---');
    console.log(JSON.stringify(semesters, null, 2));

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkStudents();

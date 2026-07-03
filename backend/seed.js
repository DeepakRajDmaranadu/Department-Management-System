const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const { hashPassword } = require('./utils/password');
const dns=require('dns')
dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
])
dotenv.config();

const seedAdmin = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Database.');

    // Check if any admin user exists
    const adminExists = await User.findOne({ role: 'Admin' });

    if (!adminExists) {
      console.log('No Admin user found. Seeding default Admin...');
      const hashedPassword = await hashPassword('Admin@12345');

      const adminUser = new User({
        fullName: 'System Administrator',
        employeeId: 'ADM001',
        email: 'admin@departmentdms.edu',
        password: hashedPassword,
        department: 'Administration',
        role: 'Admin',
        status: 'active',
      });

      await adminUser.save();
      console.log('==================================================');
      console.log('Default Admin user successfully seeded!');
      console.log('Employee ID: ADM001');
      console.log('Password:    Admin@12345');
      console.log('==================================================');
    } else {
      console.log(`Admin user already exists with Employee ID: ${adminExists.employeeId}`);
    }

    mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedAdmin();

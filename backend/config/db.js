const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop old indexes from the attendances collection to resolve composite unique constraint conflicts
    try {
      await conn.connection.db.collection('attendances').dropIndexes();
      console.log('Successfully dropped old indexes on attendances collection.');
    } catch (idxErr) {
      console.warn('Note: Could not drop attendances indexes:', idxErr.message);
    }
  } catch (error) {
    console.error(`Database Connection Error: ${error}`);
    process.exit(1);
  }
};

module.exports = connectDB;

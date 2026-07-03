const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema(
  {
    collegeId: {
      type: String,
      required: [true, 'College ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    collegeName: {
      type: String,
      required: [true, 'College Name is required'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('College', collegeSchema);

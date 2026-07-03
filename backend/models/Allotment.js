const mongoose = require('mongoose');

const allotmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester reference is required'],
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a student has at most one allotment record per semester
allotmentSchema.index({ student: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Allotment', allotmentSchema);

const mongoose = require('mongoose');

const subjectAllocationSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester reference is required'],
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null, // null means no section (default or semester-wide allocation)
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    course: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// A subject can only be assigned to one faculty per semester and section (session)
subjectAllocationSchema.index({ subject: 1, semester: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('SubjectAllocation', subjectAllocationSchema);

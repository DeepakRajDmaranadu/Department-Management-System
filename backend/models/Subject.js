const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subjectId: {
      type: String,
      required: [true, 'Subject ID (code) is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester reference is required'],
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
    subjectType: {
      type: String,
      enum: {
        values: ['regular', 'language'],
        message: 'Subject type must be either: regular or language',
      },
      default: 'regular',
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure subjectId is unique per semester
subjectSchema.index({ subjectId: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);

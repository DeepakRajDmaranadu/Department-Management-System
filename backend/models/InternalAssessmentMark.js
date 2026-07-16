const mongoose = require('mongoose');

const markEntrySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  marksObtained: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    default: 'present',
    required: true,
  },
});

const internalAssessmentMarkSchema = new mongoose.Schema(
  {
    internalAssessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternalAssessment',
      required: [true, 'Internal Assessment reference is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    maxMarks: {
      type: Number,
      default: 50,
      required: true,
    },
    marks: [markEntrySchema],
  },
  {
    timestamps: true,
  }
);

// A faculty can only submit one marksheet per subject/section for a given internal assessment
internalAssessmentMarkSchema.index(
  { internalAssessment: 1, subject: 1, section: 1 },
  { unique: true }
);

module.exports = mongoose.model('InternalAssessmentMark', internalAssessmentMarkSchema);

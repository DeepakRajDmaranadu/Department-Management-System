const mongoose = require('mongoose');

const internalAssessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Internal Assessment title is required'],
      trim: true,
    },
    maxMarks: {
      type: Number,
      required: false,
      default: 50,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch reference is required'],
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester reference is required'],
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

module.exports = mongoose.model('InternalAssessment', internalAssessmentSchema);

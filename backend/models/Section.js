const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure section name is unique per semester
sectionSchema.index({ name: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);

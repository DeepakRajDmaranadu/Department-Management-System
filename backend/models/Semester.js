const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Semester name is required'],
      trim: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure name is unique per batch
semesterSchema.index({ name: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model('Semester', semesterSchema);

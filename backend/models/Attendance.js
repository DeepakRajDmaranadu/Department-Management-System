const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true,
  },
});

const attendanceSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester is required'],
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
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
    },
    records: [attendanceRecordSchema],
  },
  {
    timestamps: true,
  }
);

// Unique index: a subject can only have one attendance log per date and section (or null section)
attendanceSchema.index({ subject: 1, date: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

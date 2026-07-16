const mongoose = require('mongoose');

const dynamicConsolidatedSheetSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    columns: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ['attendance', 'assignment', 'ia', 'formula', 'custom'],
          required: true,
        },
        formula: { type: String, default: '' },
        sourceId: { type: String, default: '' }, // IA assessment ID or assignment ID
      }
    ],
    customData: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
          required: true,
        },
        values: {
          type: Map,
          of: Number,
          default: {},
        }
      }
    ]
  },
  {
    timestamps: true,
  }
);

dynamicConsolidatedSheetSchema.index({ batch: 1, semester: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('DynamicConsolidatedSheet', dynamicConsolidatedSheetSchema);

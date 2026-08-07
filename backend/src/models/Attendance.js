const mongoose = require('mongoose');

const punchSchema = new mongoose.Schema(
  {
    time: { type: Date, default: null },
    selfie: { type: String, default: null }, // base64 encoded image
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: null },
    },
    withinGeofence: { type: Boolean, default: null },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    punchIn: punchSchema,
    punchOut: punchSchema,
    totalHours: {
      type: Number, // in decimal hours e.g. 8.5
      default: 0,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'incomplete', 'completed'],
      default: 'incomplete',
    },
    validationStatus: {
      type: String,
      enum: ['pending', 'valid', 'invalid'],
      default: 'pending',
    },
    remarks: {
      type: String,
      default: null,
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    validatedAt: {
      type: Date,
      default: null,
    },
    overtimeRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OvertimeRequest',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Calculate total hours and status before saving
attendanceSchema.pre('save', function (next) {
  if (this.punchIn?.time && this.punchOut?.time) {
    const diffMs = new Date(this.punchOut.time) - new Date(this.punchIn.time);
    this.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    this.status = this.totalHours >= 8 ? 'completed' : 'incomplete';
  } else if (this.punchIn?.time) {
    this.status = 'incomplete';
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);

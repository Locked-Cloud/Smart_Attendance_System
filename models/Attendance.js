// models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  prof: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  attendanceCode: {
    type: String,
    unique: true,
    required: true,
  },
  expiryTime: {
    type: Number,
    required: true,
  },
  radius: {
    type: Number,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  studentsPresent: [
    {
      studentId: Number,
      ipAddress: String,
      latitude: Number,
      longitude: Number,
      fingerprint: String, // New field to store the fingerprint
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Define a unique, sparse index to prevent duplicates
attendanceSchema.index(
  {
    'studentsPresent.studentId': 1,
    'studentsPresent.fingerprint': 1,
    'studentsPresent.ipAddress': 1,
  },
  { unique: true, sparse: true },
);

module.exports = mongoose.model('Attendance', attendanceSchema);

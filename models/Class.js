// models/Class.js
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
  },
  professor: {
    type: String,
    required: true,
  },
  students: [
    {
      studentId: {
        type: Number,
        required: true,
      },
      studentName: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model('Class', classSchema);

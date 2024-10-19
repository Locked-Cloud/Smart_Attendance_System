const Attendance = require('../models/Attendance');
const AppError = require('../utils/appError'); // Assuming you're using custom error handling like AppError
const express = require('express');
const router = express.Router();
const calculateDistance = require('../utils/calculateDistance');
const Class = require('../models/Class');
router.get('/attendance/form/:attendanceCode', async (req, res, next) => {
  const { attendanceCode } = req.params; // Retrieve the attendanceCode from the URL
  const attendance = await Attendance.findOne({ attendanceCode });
  if (!attendance) {
    return res.status(404).send('Attendance session not found.');
  }
  res.render('attendanceForm', { attendanceId: attendance._id });
});
router.post('/attendance/submit', async (req, res) => {
  const { attendanceId, studentId, latitude, longitude, fingerprint } =
    req.body;
  const ipAddress =
    req.clientIp || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!fingerprint) {
    return res.status(400).send('Fingerprint is required.');
  }

  if (!latitude || !longitude) {
    return res.status(400).send('Location data is missing.');
  }

  const attendance =
    await Attendance.findById(attendanceId).populate('classId');
  if (!attendance || attendance.expiryTime < Date.now()) {
    return res.send('Attendance session is no longer active.');
  }

  const classInfo = attendance.classId;
  const validStudent = classInfo.students.find(
    (student) => student.studentId == studentId,
  );
  if (!validStudent) {
    return res.status(403).send('Your student ID is invalid for this class.');
  }

  const existingEntry = await Attendance.findOne({
    _id: attendanceId,
    $or: [
      { 'studentsPresent.studentId': studentId },
      { 'studentsPresent.fingerprint': fingerprint },
      { 'studentsPresent.ipAddress': ipAddress },
    ],
  });

  if (existingEntry) {
    return res
      .status(403)
      .send(
        'Attendance already submitted with this student ID, device, or IP.',
      );
  }

  const distance = calculateDistance(
    parseFloat(attendance.latitude),
    parseFloat(attendance.longitude),
    parseFloat(latitude),
    parseFloat(longitude),
  );

  const DISTANCE_THRESHOLD = attendance.radius;
  if (distance > DISTANCE_THRESHOLD) {
    return res.send(
      `You are not within the required range to submit attendance. Distance: ${distance.toFixed(
        2,
      )} meters.`,
    );
  }

  attendance.studentsPresent.push({
    studentId,
    ipAddress,
    latitude,
    longitude,
    fingerprint,
    timestamp: new Date(),
  });

  await attendance.save();
  res.send('Attendance submitted successfully.');
});

module.exports = router;

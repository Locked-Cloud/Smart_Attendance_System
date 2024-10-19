const express = require('express');
const router = express.Router();
const professors = require('./professors');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const isAuthenticated = require('../utils/isAuthenticae');
const generateUniqueCode = require('../utils/generateuniqueqr');
const Attendance = require('../models/Attendance');
const QRCode = require('qrcode');
const Excel = require('exceljs');
const Class = require('../models/Class');
router.get('/login', (req, res, next) => {
  res.render('login', { error: null });
});
router.post('/login', (req, res, next) => {
  const { username, password } = req.body;

  const professor = professors.find(
    (prof) => prof.username === username && prof.password === password
  );

  if (professor) {
    req.session.professor = professor; // Store professor in session
    req.session.save((err) => {
      if (err) {
        return next(err); // Handle session save error
      }
      res.redirect('/api/professor/dashboard'); // Redirect to dashboard on successful login
    });
  } else {
    res.render('login', { error: 'Invalid username or password' }); // Show error if credentials are invalid
  }
});
// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('login');
  });
});
// Route to display the attendance creation form with class selection
router.get('/create-attendance', isAuthenticated, async (req, res) => {
  const classes = await Class.find({
    professor: req.session.professor.username,
  });
  res.render('createAttendance', { classes }); // Update view to include classes
});
// Route to handle attendance creation
router.post('/create-attendance', isAuthenticated, async (req, res) => {
  const { classId, latitude, longitude, radius } = req.body;
  const date = new Date();
  const attendanceCode = generateUniqueCode();
  const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes from now
  // Validate coordinates
  if (!latitude || !longitude) {
    return res.status(400).send('Missing location data.');
  }
  // Save to database
  const attendance = new Attendance({
    classId,
    date,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    attendanceCode,
    expiryTime,
    radius: parseFloat(radius),
    prof: req.session.professor.username,
  });
  await attendance.save();
  // Generate QR code
  const qrData = `${req.protocol}://${req.get('host')}/api/student/attendance/form/${attendanceCode}`;
  const qrCodeImage = await QRCode.toDataURL(qrData);

  res.render('displayQRCode', { qrCodeImage, expiryTime });
});
router.get('/previous-attendances', isAuthenticated, async (req, res) => {
  const attendances = await Attendance.find({
    prof: req.session.professor.username,
  });
  res.render('previousAttendances', { attendances });
});
router.get('/create-class', isAuthenticated, (req, res) => {
  res.render('createClass'); // You need to create this view
});
router.post('/create-class', isAuthenticated, async (req, res) => {
  const { className, students } = req.body;
  const studentArray = students.split('\n').map((line) => {
    const [studentId, studentName] = line.split(':').map((str) => str.trim());
    const studentIdNumber = parseInt(studentId);
    return { studentId: studentIdNumber, studentName };
  });
  const newClass = new Class({
    className,
    professor: req.session.professor.username,
    students: studentArray,
  });
  await newClass.save();
  res.redirect('/api/professor/dashboard');
});
router.get(
  '/export-attendance/:attendanceId',
  isAuthenticated,
  async (req, res) => {
    const { attendanceId } = req.params; // Extract attendance ID from the request
    const attendance =
      await Attendance.findById(attendanceId).populate('classId');
    if (!attendance) {
      return res.status(404).send('Attendance not found.');
    }
    const classItem = attendance.classId;
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');
    const columns = [
      { header: 'Student ID', key: 'studentId', width: 15 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Present', key: 'present', width: 10 },
    ];
    worksheet.columns = columns;
    for (const student of classItem.students) {
      const studentAttendance = attendance.studentsPresent.find(
        (s) => s.studentId === student.studentId,
      );
      worksheet.addRow({
        studentId: student.studentId,
        studentName: student.studentName,
        date: new Date(attendance.date).toLocaleString(),
        present: studentAttendance ? 'Yes' : 'No',
      });
    }
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance_${attendanceId}.xlsx`,
    );
    await workbook.xlsx.write(res);
    res.end();
  },
);

router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard');
});
module.exports = router;

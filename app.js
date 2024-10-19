const express = require('express');
const session = require('express-session');
const professorRouter = require('./routes/professor');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController.js');
const requestIp = require('request-ip');
const studentRouter = require('./routes/student.js');
const compression = require('compression');
const path = require('path');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: './.env' });

const app = express();
app.set('trust proxy', true); // Enable trust proxy

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Check if DATABASE is defined
if (!process.env.DATABASE) {
    console.error('DATABASE environment variable is not defined.');
    process.exit(1); // Exit the application if DATABASE is not defined
}

// Connect to MongoDB without a password
const DB = process.env.DATABASE; // Directly use the DATABASE variable

mongoose
    .connect(DB)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.log('MongoDB connection error:', err));

//Development logging
app.use(morgan('dev'));
app.set('trust proxy', 1); // '1' indicates the first proxy, change as per your setup

app.use(session({
  secret: 'your_secret_key', // Replace with your secret key
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.DATABASE }), // Use MongoDB for session storage
  cookie: { secure: false } // Set to true if using HTTPS
}));

//Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP,please try again in an hour!',
});

app.use('/api', limiter);
//Body,parser,reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
//request ip middleware
app.use(requestIp.mw());
//Data sanitization aganist NoSQL query injection
app.use(mongoSanitize());
//Data sanitization against XSS
app.use(xss());
app.use(compression());
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Register routes
// Redirect root URL to /api/professor/login
app.get('/', (req, res) => {
  res.redirect('/api/professor/login');
});

// Define your routes here
// Example route: /api/professor/login
app.get('/api/professor/login', (req, res) => {
  res.render('login', { error: null }); // Pass error as null initially
});

app.use('/api/professor', professorRouter);
app.use('/api/student', studentRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);
module.exports = app;

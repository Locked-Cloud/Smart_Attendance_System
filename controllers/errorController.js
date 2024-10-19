const AppError = require('./../utils/appError.js');
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} :${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateErrorDB = (err) => {
  if (err.errmsg) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate value: ${value}, please use another value`;
    return new AppError(message, 400);
  }
  return new AppError('Duplicate field value', 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const messsage = `Invalid Input data.${errors.join('. ')}`;
  return new AppError(messsage, 400);
};
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () =>
  new AppError('Your Token has expired!. Please log in again.');
const sendErrorDev = function (err, req, res) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    console.error('ERROR', err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
};
const sendErrorProd = function (err, req, res) {
  //Operationa,trusted error :send message to client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      //Programming or other unknown error : don't leak error details
    }
    //1) Log error
    console.error('ERROR ', err);
    //2) Send generic message
    return res
      .status(500)
      .json({ status: 'error', message: 'Something went very wrong' });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
    //Programming or other unknown error : don't leak error details
  }
  console.error('ERROR ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Pleasse try aagain later',
  });
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error!';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateErrorDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};

const errorHandler = (error, req, res, next) => {

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID or field value';
  }

  // to report duplicate-key error..i.e if order numebr already exists
  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || {})[0] || 'value';
    message = `A record with this ${field} already exists`;
  }

  // Keep unexpected server errors in the terminal
  if (statusCode >= 500) {
    console.error(error);

    if (process.env.NODE_ENV === 'production') {
      message = 'Internal server error';
    }
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

export default errorHandler;
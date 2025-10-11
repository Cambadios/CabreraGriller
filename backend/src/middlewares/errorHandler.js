// src/middlewares/errorHandler.js
export const errorHandler = (err, req, res, _next) => {
  console.error('ERROR:', err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

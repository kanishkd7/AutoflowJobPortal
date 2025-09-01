module.exports = (req, _res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
};

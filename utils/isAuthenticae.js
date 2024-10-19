module.exports = (req, res, next) => {
  if (req.session.professor) {
    return next(); // User is authenticated, proceed to the next middleware
  }
  res.redirect('/api/professor/login'); // Redirect to login if not authenticated
};

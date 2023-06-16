// Middleware function to check user role
const checkRole = (role) => (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    }
    res.status(401).send('Unauthorized');
  };
  
  module.exports = { checkRole };
  
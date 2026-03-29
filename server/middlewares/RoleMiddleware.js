// middleware/RoleMiddleware.js
const ensureAdmin = (req, res, next) => {
  // req.user is populated by your existing ensureAuthenticated middleware
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Only Admins can perform this action.",
      success: false,
    });
  }
  next();
};

module.exports = { ensureAdmin };

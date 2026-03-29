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

const ensureManagerOrAdmin = (req, res, next) => {
  const r = req.user?.role;
  if (r === "manager" || r === "admin") return next();
  return res.status(403).json({
    message: "Access denied. Manager or admin only.",
    success: false,
  });
};

module.exports = { ensureAdmin, ensureManagerOrAdmin };

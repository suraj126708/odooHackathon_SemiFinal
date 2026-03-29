const {
  signUp,
  login,
  getProfile,
  updateProfile,
  logout,
} = require("../controllers/AuthController.js");

const {
  signUpValidation,
  loginValidation,
  updateProfileValidation,
} = require("../middlewares/AuthMiddleware");

const upload = require("../models/fileUpload");
const ensureAuthenticated = require("../middlewares/Auth");

const router = require("express").Router();

// Public routes
router.post(
  "/signup",
  upload.single("profilePicture"),
  signUpValidation,
  signUp
);

router.post("/login", loginValidation, login);

// POST /api/auth/forgot-password is registered in server/index.js

// Protected routes (require authentication)
router.get("/profile", ensureAuthenticated, getProfile);

router.put(
  "/profile",
  ensureAuthenticated,
  upload.single("profilePicture"),
  updateProfileValidation,
  updateProfile
);

router.post("/logout", ensureAuthenticated, logout);

// Token verification route
router.get("/verify", ensureAuthenticated, (req, res) => {
  res.json({
    message: "Token is valid",
    success: true,
    user: req.user,
  });
});

module.exports = router;

const router = require("express").Router();
const ensureAuthenticated = require("../middlewares/Auth");
const { ensureAdmin } = require("../middlewares/RoleMiddleware");
const {
  createCompany,
  listCompanyUsers,
  sendPasswordInvite,
} = require("../controllers/AdminController");

router.post("/companies", ensureAuthenticated, ensureAdmin, createCompany);
router.get("/users", ensureAuthenticated, ensureAdmin, listCompanyUsers);
router.post(
  "/users/send-password",
  ensureAuthenticated,
  ensureAdmin,
  sendPasswordInvite,
);

module.exports = router;

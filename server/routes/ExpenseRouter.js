// routes/ExpenseRouter.js
const express = require("express");
const router = express.Router();
const { listMyExpenses, submitExpense } = require("../controllers/ExpenseController");
const ensureAuthenticated = require("../middlewares/Auth");
const upload = require("../models/fileUpload"); // Path to your fileUpload.js

router.get("/mine", ensureAuthenticated, listMyExpenses);

// Route: POST /api/expenses
// Requires Authentication AND Multer upload handling for 'receipt' field
router.post("/", ensureAuthenticated, upload.single("receipt"), submitExpense);

module.exports = router;

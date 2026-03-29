// controllers/ExpenseController.js
const { Expense, Company, User, ExpenseApproval } = require("../models");
const { convertCurrency } = require("../utils/currencyUtils");
const { sequelize } = require("../models/db");

const submitExpense = async (req, res) => {
  // Start a transaction to ensure both Expense and Approval records are created safely
  const transaction = await sequelize.transaction();

  try {
    const { amount, currency_code, category, description, expense_date } =
      req.body;
    const userId = req.user._id; // Assuming your JWT middleware sets this
    const companyId = req.user.company_id;

    // 1. Basic Validation
    if (!amount || !currency_code || !category || !expense_date) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Amount, currency, category, and date are required.",
      });
    }

    if (!req.file) {
      await transaction.rollback();
      return res.status(400).json({ message: "Receipt image is required." });
    }

    // 2. Fetch Company to get base currency
    const company = await Company.findByPk(companyId);
    if (!company) {
      await transaction.rollback();
      return res.status(404).json({ message: "Company not found." });
    }

    // Get the correct property, fallback to USD if somehow both are missing
    const targetCurrency = company.currency_code || "USD";

    // 3. Convert Currency
    const convertedAmount = await convertCurrency(
      parseFloat(amount),
      currency_code,
      targetCurrency,
    );

    // 4. Construct receipt URL (adjust base URL if needed based on your environment)
    const receipt_url = `/uploads/${req.file.filename}`;

    // 5. Create the Expense Record
    const newExpense = await Expense.create(
      {
        company_id: companyId,
        submitted_by: userId,
        amount: parseFloat(amount),
        currency_code: currency_code.toUpperCase(),
        amount_in_company_currency: convertedAmount,
        category,
        description: description || "",
        expense_date,
        receipt_url,
        status: "pending",
        current_step: 1, // Moving to step 1 of approval
      },
      { transaction },
    );

    // 6. Initialize the First Approval Step (Direct Manager)
    // According to the problem statement, if "IS MANAGER APPROVER" is conceptually active,
    // the direct manager should be the first approver.
    const employee = await User.findByPk(userId);

    if (employee && employee.manager_id) {
      await ExpenseApproval.create(
        {
          expense_id: newExpense.id,
          approver_id: employee.manager_id,
          step: 1,
          status: "pending",
        },
        { transaction },
      );
    } else {
      // If the user has no manager (e.g., they are the Admin or top-level),
      // you might auto-approve or route to a default company approver.
      // For now, we'll mark it as approved if there's no workflow needed.
      await newExpense.update({ status: "approved" }, { transaction });
    }

    // Commit the transaction
    await transaction.commit();

    res.status(201).json({
      message: "Expense submitted successfully",
      success: true,
      expense: newExpense,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Submit Expense Error:", error);
    res.status(500).json({
      message: "Internal server error while submitting expense.",
      error: error.message,
    });
  }
};

module.exports = {
  submitExpense,
};

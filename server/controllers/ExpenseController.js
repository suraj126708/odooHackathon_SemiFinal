const { Expense, Company, User, ExpenseApproval } = require("../models");
const { convertCurrency } = require("../utils/currencyUtils");
const { extractReceiptFromBuffer } = require("../OCR/extractReceipt");
const { sequelize } = require("../models/db");
const {
  findApplicableRule,
  createInitialApprovals,
  fallbackManagerOnly,
} = require("../services/approvalEngine");
const {
  sendExpenseSubmittedToEmployee,
  sendExpensePendingForApprover,
} = require("../utils/mailer");

/** POST multipart receipt → Gemini OCR (public). Pass companyCurrency (ISO 4217) in form for FX conversion. */
const parseReceiptOcr = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "Receipt file (image or PDF) is required.",
      });
    }

    let companyCurrency = "INR";
    const raw = (
      req.body?.companyCurrency ||
      req.body?.company_currency ||
      req.query?.companyCurrency ||
      ""
    )
      .toString()
      .trim()
      .toUpperCase();
    if (raw.length === 3) companyCurrency = raw;

    const data = await extractReceiptFromBuffer(
      req.file.buffer,
      req.file.mimetype,
      companyCurrency,
    );

    return res.status(200).json({
      success: true,
      message: "OK",
      data,
    });
  } catch (error) {
    console.error("parseReceiptOcr:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not read receipt.",
    });
  }
};

const listMyExpenses = async (req, res) => {
  try {
    const rows = await Expense.findAll({
      where: { submitted_by: req.user._id },
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json({
      success: true,
      message: "OK",
      data: { expenses: rows },
    });
  } catch (error) {
    console.error("listMyExpenses:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load expenses.",
    });
  }
};

const submitExpense = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { amount, currency_code, category, description, expense_date } =
      req.body;
    const userId = req.user._id;
    const companyId = req.user.company_id;

    if (!amount || !currency_code || !category || !expense_date) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Amount, currency, category, and date are required.",
      });
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Company not found." });
    }

    const targetCurrency = company.currency_code || "USD";

    const convertedAmount = await convertCurrency(
      parseFloat(amount),
      currency_code,
      targetCurrency,
    );

    const receipt_url = req.file ? `/uploads/${req.file.filename}` : null;

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
        current_step: 1,
      },
      { transaction },
    );

    const employee = await User.findByPk(userId, { transaction });
    const rule = await findApplicableRule(companyId, userId, category);

    if (rule) {
      await createInitialApprovals(transaction, newExpense, rule, employee);
    } else {
      await fallbackManagerOnly(transaction, newExpense, employee);
    }

    await transaction.commit();

    const freshExpense = await Expense.findByPk(newExpense.id);
    const pendingApprovals = await ExpenseApproval.findAll({
      where: { expense_id: newExpense.id },
    });

    try {
      await sendExpenseSubmittedToEmployee({
        to: employee.email,
        employeeName: employee.name,
        expenseId: newExpense.id,
        category,
        amount: String(amount),
        currency: currency_code.toUpperCase(),
      });
      const approverIds = [...new Set(pendingApprovals.map((p) => p.approver_id))];
      const approvers = await User.findAll({ where: { id: approverIds } });
      for (const a of approvers) {
        await sendExpensePendingForApprover({
          to: a.email,
          approverName: a.name,
          submitterName: employee.name,
          expenseId: newExpense.id,
          category,
          amount: String(amount),
          currency: currency_code.toUpperCase(),
        });
      }
    } catch (mailErr) {
      console.error("Expense notification emails:", mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Expense submitted successfully",
      data: { expense: freshExpense },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Submit Expense Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while submitting expense.",
      error: error.message,
    });
  }
};

module.exports = {
  parseReceiptOcr,
  listMyExpenses,
  submitExpense,
};

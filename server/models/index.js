const Company = require("./Company");
const User = require("./User");
const Expense = require("./Expenses");
const ExpenseApproval = require("./expenseApproval");
const ApprovalRule = require("./approvalRules");

// Company → Users
Company.hasMany(User, { foreignKey: "company_id" });
User.belongsTo(Company, { foreignKey: "company_id" });

// User → Manager (Self relation)
User.hasMany(User, { as: "Subordinates", foreignKey: "manager_id" });
User.belongsTo(User, { as: "Manager", foreignKey: "manager_id" });

// Company → Expenses
Company.hasMany(Expense, { foreignKey: "company_id" });

// Expense → User
Expense.belongsTo(User, { foreignKey: "submitted_by" });

// Expense → Approvals
Expense.hasMany(ExpenseApproval, { foreignKey: "expense_id" });

// Approval → User
ExpenseApproval.belongsTo(User, { foreignKey: "approver_id" });

// Approval Rules
Company.hasMany(ApprovalRule, { foreignKey: "company_id" });

module.exports = {
  Company,
  User,
  Expense,
  ExpenseApproval,
  ApprovalRule,
};

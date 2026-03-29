const { sequelize } = require("./db");
const { DataTypes } = require("sequelize");

const Expense = sequelize.define("Expense", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  company_id: DataTypes.INTEGER,
  submitted_by: DataTypes.INTEGER,
  amount: DataTypes.DECIMAL(15, 2),
  currency_code: DataTypes.STRING,
  amount_in_company_currency: DataTypes.DECIMAL(15, 2),
  category: DataTypes.STRING,
  description: DataTypes.TEXT,
  expense_date: DataTypes.DATE,
  receipt_url: DataTypes.STRING,
  status: DataTypes.ENUM("draft", "pending", "approved", "rejected"),
  current_step: { type: DataTypes.INTEGER, defaultValue: 0 },
  rule_id: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: DataTypes.DATE,
});

module.exports = Expense;

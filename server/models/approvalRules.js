const { sequelize } = require("./db");
const { DataTypes } = require("sequelize");

const ApprovalRule = sequelize.define(
  "ApprovalRule",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    company_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    category: DataTypes.STRING,
    rule_type: DataTypes.ENUM(
      "sequential",
      "percentage",
      "specific",
      "hybrid",
      "all",
    ),
    is_manager_approver: { type: DataTypes.BOOLEAN, defaultValue: false },
    subject_user_id: { type: DataTypes.INTEGER, allowNull: true },
    rule_manager_id: { type: DataTypes.INTEGER, allowNull: true },

    approver_sequence: { type: DataTypes.JSON, allowNull: true },

    min_approval_pct: DataTypes.INTEGER,
    specific_approver_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "ApprovalRules",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
  },
);

module.exports = ApprovalRule;

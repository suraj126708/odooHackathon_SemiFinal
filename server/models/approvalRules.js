const ApprovalRule = sequelize.define("ApprovalRule", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  company_id: DataTypes.INTEGER,
  name: DataTypes.STRING,
  category: DataTypes.STRING,
  rule_type: DataTypes.ENUM("sequential", "percentage", "specific", "hybrid"),
  is_manager_approver: { type: DataTypes.BOOLEAN, defaultValue: false },
  min_approval_pct: DataTypes.INTEGER,
  specific_approver_id: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});
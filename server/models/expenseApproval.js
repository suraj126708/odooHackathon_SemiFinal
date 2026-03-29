const ExpenseApproval = sequelize.define("ExpenseApproval", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  expense_id: DataTypes.INTEGER,
  approver_id: DataTypes.INTEGER,
  step: DataTypes.INTEGER,
  status: { 
    type: DataTypes.ENUM("pending", "approved", "rejected"), 
    defaultValue: "pending" 
  },
  comment: DataTypes.TEXT,
  acted_at: DataTypes.DATE
});
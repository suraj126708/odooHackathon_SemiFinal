// const { DataTypes } = require("sequelize");
// const { sequelize } = require("./db");

// const Company = sequelize.define(
//   "Company",
//   {
//     id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     name: {
//       type: DataTypes.STRING(100),
//       allowNull: false
//     },
//     country: {
//       type: DataTypes.STRING(100),
//       allowNull: false
//     },
//     baseCurrency: {
//       type: DataTypes.STRING(10), // e.g., 'USD', 'INR', 'EUR'
//       allowNull: false
//     }
//   },
//   {
//     tableName: "companies",
//     timestamps: true,
//   }
// );

// module.exports = Company;

const { DataTypes } = require("sequelize");
const { sequelize } = require("./db");

const Company = sequelize.define("Company", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  country: DataTypes.STRING,
  currency_code: DataTypes.STRING,
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = Company;

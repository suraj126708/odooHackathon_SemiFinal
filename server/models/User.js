/*const { DataTypes } = require("sequelize");
const { sequelize } = require("./db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    profilePicture: { type: DataTypes.STRING(500), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
      allowNull: false,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    indexes: [{ fields: ["email"] }, { fields: ["username"] }],
  },
);

module.exports = User;*/



// const { DataTypes } = require("sequelize");
// const { sequelize } = require("./db");

// const User = sequelize.define(
//   "User",
//   {
//     id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     name: { type: DataTypes.STRING(100), allowNull: false },
//     email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
//     password: { type: DataTypes.STRING(255), allowNull: false },
//     // Removed username/bio/profilePic for simplicity, but you can keep them if needed for UI
//     role: {
//       type: DataTypes.ENUM("Admin", "Manager", "Employee"), // Updated roles
//       defaultValue: "Employee",
//       allowNull: false,
//     },
//     // Foreign key for the Company
//     companyId: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: false, 
//     },
//     // Self-referencing foreign key for Manager
//     managerId: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true, // Null for Admins or top-level Managers
//     }
//   },
//   {
//     tableName: "users",
//     timestamps: true,
//     defaultScope: {
//       attributes: { exclude: ["password"] },
//     },
//     indexes: [{ fields: ["email"] }],
//   }
// );

// module.exports = User;



const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  password_hash: DataTypes.STRING,
  role: DataTypes.ENUM("admin", "manager", "employee"),
  manager_id: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});
const { DataTypes } = require("sequelize");
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

module.exports = User;

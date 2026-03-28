const { Sequelize } = require("sequelize");

const stripQuotes = (v) => {
  if (v == null || typeof v !== "string") return v ?? "";
  const t = v.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
};

const mysqlUser = stripQuotes(process.env.MYSQL_USER) || "root";
const mysqlPassword = stripQuotes(process.env.MYSQL_PASSWORD);
const mysqlDatabase = stripQuotes(process.env.MYSQL_DATABASE) || "odoo_prefinal";
const mysqlHost = stripQuotes(process.env.MYSQL_HOST) || "localhost";

const sequelize = new Sequelize(mysqlDatabase, mysqlUser, mysqlPassword, {
  host: mysqlHost,
  port: Number(process.env.MYSQL_PORT) || 3306,
  dialect: "mysql",
  logging: false,
});

const connectDB = async () => {
  try {
    const port = Number(process.env.MYSQL_PORT) || 3306;
    console.log("🔗 Connecting to MySQL:", `${mysqlHost}:${port}/${mysqlDatabase}`);

    await sequelize.authenticate();
    console.log("✅ MySQL connected");

    await sequelize.sync({ alter: process.env.MYSQL_SYNC_ALTER === "true" });
  } catch (error) {
    console.error(`❌ MySQL Connection Error: ${error.message}`);
    console.error("💡 Check MYSQL_USER / MYSQL_PASSWORD match your MySQL server.");
    console.error(
      "💡 If the password is correct, try MYSQL_HOST=127.0.0.1 (Windows uses a different client than 'localhost')."
    );
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

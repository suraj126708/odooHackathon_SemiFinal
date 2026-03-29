/**
 * Adds columns expected by Sequelize models if the DB was created before those fields existed.
 * Safe to run multiple times (ignores duplicate-column errors).
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sequelize } = require("../models/db");

const patches = [
  "ALTER TABLE ApprovalRules ADD COLUMN description TEXT NULL",
  "ALTER TABLE ApprovalRules ADD COLUMN subject_user_id INT NULL",
  "ALTER TABLE ApprovalRules ADD COLUMN rule_manager_id INT NULL",
  "ALTER TABLE ApprovalRules ADD COLUMN approver_sequence JSON NULL",
  "ALTER TABLE ApprovalRules ADD COLUMN min_approval_pct INT NULL",
  "ALTER TABLE ApprovalRules ADD COLUMN specific_approver_id INT NULL",
  "ALTER TABLE Expenses ADD COLUMN rule_id INT NULL",
];

/** Legacy Sequelize tables often have NOT NULL createdAt/updatedAt without defaults. */
const optionalFixes = [
  "ALTER TABLE ApprovalRules MODIFY COLUMN createdAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP",
  "ALTER TABLE ApprovalRules MODIFY COLUMN updatedAt DATETIME NULL DEFAULT NULL",
];

const enumPatches = [
  "ALTER TABLE ApprovalRules MODIFY COLUMN rule_type ENUM('sequential','percentage','specific','hybrid','all') NOT NULL",
];

async function main() {
  await sequelize.authenticate();
  for (const sql of patches) {
    try {
      await sequelize.query(sql);
      console.log("Applied:", sql);
    } catch (err) {
      const code = err.original?.errno ?? err.parent?.errno;
      if (code === 1060) {
        console.log("Skip (column exists):", sql.slice(0, 60) + "…");
      } else {
        throw err;
      }
    }
  }
  for (const sql of optionalFixes) {
    try {
      await sequelize.query(sql);
      console.log("Applied:", sql);
    } catch (err) {
      const code = err.original?.errno ?? err.parent?.errno;
      if (code === 1054) {
        console.log("Skip (no column):", sql.slice(0, 55) + "…");
      } else {
        throw err;
      }
    }
  }
  for (const sql of enumPatches) {
    try {
      await sequelize.query(sql);
      console.log("Applied:", sql);
    } catch (err) {
      const code = err.original?.errno ?? err.parent?.errno;
      const msg = String(err.message || "");
      if (code === 1265 || msg.includes("Duplicate") || code === 1060) {
        console.log("Skip enum patch or already applied:", sql.slice(0, 70) + "…");
      } else {
        throw err;
      }
    }
  }
  await sequelize.close();
  console.log("Schema check done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

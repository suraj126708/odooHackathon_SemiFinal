require("dotenv").config();
const bcrypt = require("bcrypt");
const { sequelize, connectDB } = require("./models/db");
require("./models/User");
const { User } = require("./models");

const upsertUser = async ({ name, email, username, password, role }) => {
  const existing = await User.findOne({ where: { email } });

  if (existing) {
    console.log(`⚡ ${email} already exists, skipping...`);
    return existing;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    username,
    password: hashedPassword,
    role,
  });

  console.log(`👤 ${role} user created: ${email}`);
  return user;
};

const seedData = async () => {
  await upsertUser({
    name: "Demo User",
    email: "demo@gmail.com",
    username: "demouser",
    password: "demo123",
    role: "user",
  });

  await upsertUser({
    name: "Admin User",
    email: "admin@gmail.com",
    username: "adminuser",
    password: "admin123",
    role: "admin",
  });

  console.log("🌱 Seeding completed");
};

module.exports = seedData;

if (require.main === module) {
  connectDB()
    .then(() => seedData())
    .then(() => sequelize.close())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

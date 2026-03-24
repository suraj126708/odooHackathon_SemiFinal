const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { User } = require("./models");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/odoo_prefinal";

const upsertUser = async ({ name, email, username, password, role }) => {
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`⚡ ${email} already exists, skipping...`);
    return existing;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = new User({
    name,
    email,
    username,
    password: hashedPassword,
    role,
  });

  await user.save();
  console.log(`👤 ${role} user created: ${email}`);

  return user;
};

// 👇 MAIN SEED FUNCTION (export this)
const seedData = async () => {
  // ⚠️ Only connect if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }

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

// 👇 export for server usage
module.exports = seedData;

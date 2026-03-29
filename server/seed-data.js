require("dotenv").config();
const bcrypt = require("bcrypt");
const { sequelize, connectDB } = require("./models/db");
const { User, Company } = require("./models");

const ensureSeedCompany = async () => {
  const [company] = await Company.findOrCreate({
    where: { name: "Seed Organization" },
    defaults: {
      country: "United States",
      currency_code: "USD",
    },
  });
  return company;
};

const upsertAdmin = async ({ name, email, password, companyId }) => {
  const password_hash = await bcrypt.hash(password, 12);
  const existing = await User.unscoped().findOne({ where: { email } });

  if (!existing) {
    const user = await User.create({
      name,
      email,
      password_hash,
      role: "admin",
      company_id: companyId,
      manager_id: null,
    });
    console.log(`👤 admin user created: ${email}`);
    return user;
  }

  await existing.update({
    name,
    password_hash,
    role: "admin",
    company_id: companyId,
    manager_id: null,
  });
  console.log(
    `👤 admin user updated (password_hash synced — use seed password to log in): ${email}`,
  );
  return existing;
};

const seedData = async () => {
  const company = await ensureSeedCompany();
  await upsertAdmin({
    name: "Admin User",
    email: "admin@gmail.com",
    password: "admin123",
    companyId: company.id,
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

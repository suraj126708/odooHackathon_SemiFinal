const { Op, UniqueConstraintError } = require("sequelize");
const { User, Company } = require("../models"); // Ensure Company is exported from models/index.js
const { sequelize } = require("../models/db"); // Needed for transactions
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendLoginCredentialsEmail } = require("../utils/mailer");
const {
  convertToImageUrl,
  convertToImageUrlStatic,
} = require("../utils/imageUtils");

// --- Helper to fetch currency ---
const getCurrencyByCountry = async (countryName) => {
  try {
    const response = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,currencies",
    );
    const countries = await response.json();

    const countryData = countries.find(
      (c) => c.name.common.toLowerCase() === countryName.toLowerCase(),
    );

    if (countryData && countryData.currencies) {
      return Object.keys(countryData.currencies)[0];
    }
    return "USD";
  } catch (error) {
    console.error("Error fetching currency:", error);
    return "USD";
  }
};

const processUserForResponse = (user, req) => {
  const raw = user.get ? user.get({ plain: true }) : { ...user };
  const { id, ...rest } = raw;
  delete rest.password;
  const userObj = { _id: id, ...rest };
  return {
    ...userObj,
    profilePicture: userObj.profilePicture
      ? req
        ? convertToImageUrl(userObj.profilePicture, req)
        : convertToImageUrlStatic(userObj.profilePicture)
      : null,
  };
};

const toPublicUser = (userResponse) => ({
  _id: userResponse._id,
  name: userResponse.name,
  email: userResponse.email,
  username: userResponse.username,
  profilePicture: userResponse.profilePicture,
  bio: userResponse.bio,
  role: userResponse.role,
  companyId: userResponse.companyId, // Added companyId
});

const signUp = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Removed username, bio, profile picture from here since they aren't in the DB anymore
    const { companyName, country, name, email, password } = req.body;

    // 1. Check ONLY email now (username is gone)
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({
        message: "User already exists with this email",
        success: false,
        field: "email",
      });
    }

    // 2. Fetch Currency
    const baseCurrency = await getCurrencyByCountry(country);

    // 3. Create Company
    const newCompany = await Company.create(
      {
        name: companyName,
        country: country,
        currency_code: baseCurrency,
      },
      { transaction },
    );

    // 4. Create Admin User (MATCHING YOUR NEW SCHEMA EXACTLY)
    const newUser = await User.create(
      {
        name: name,
        email: email,
        password_hash: await bcrypt.hash(password, 12), // Changed to password_hash
        role: "admin", // Must be lowercase 'admin' to match your ENUM
        company_id: newCompany.id, // Changed to company_id
        manager_id: null, // Changed to manager_id
      },
      { transaction },
    );

    await transaction.commit();

    try {
      await sendLoginCredentialsEmail({
        to: newUser.email,
        recipientName: newUser.name,
        loginEmail: newUser.email,
        password,
        subject: "Welcome — your company admin account",
      });
    } catch (mailErr) {
      console.error("signUp welcome email:", mailErr.message);
    }

    const jwtToken = jwt.sign(
      {
        email: newUser.email,
        _id: newUser.id,
        role: newUser.role,
        company_id: newUser.company_id,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    // Since we simplified the model, let's simplify the response
    res.status(201).json({
      message: "Company and Admin registered successfully",
      success: true,
      token: jwtToken,
      user: {
        _id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        company_id: newUser.company_id,
      },
      company: newCompany,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("SignUp Error:", err);
    res.status(500).json({
      message: "Internal server error during registration",
      success: false,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Request Body:", req.body);
    const emailNorm = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!emailNorm || password == null || password === "") {
      return res
        .status(401)
        .json({ message: "Invalid email or password", success: false });
    }

    const user = await User.unscoped().findOne({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("email")),
        emailNorm,
      ),
    });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid email or password", success: false });
    }

    // Compare with password_hash now
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Invalid email or password", success: false });
    }

    const jwtToken = jwt.sign(
      {
        email: user.email,
        _id: user.id,
        role: user.role,
        company_id: user.company_id,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Login successful",
      success: true,
      token: jwtToken,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res
      .status(500)
      .json({ message: "Internal server error during login", success: false });
  }
};
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const userResponse = processUserForResponse(user, req);
    res.status(200).json({
      message: "Profile retrieved successfully",
      success: true,
      user: toPublicUser(userResponse),
    });
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const userId = req.user._id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (req.file)
      updates.profilePicture = convertToImageUrl(req.file.path, req);

    await user.update(updates);

    const userResponse = processUserForResponse(user, req);
    res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user: toPublicUser(userResponse),
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const logout = async (req, res) => {
  try {
    res.status(200).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

module.exports = {
  signUp,
  login,
  getProfile,
  updateProfile,
  logout,
};

const { Op, UniqueConstraintError } = require("sequelize");
const { User, Company } = require("../models"); // Ensure Company is exported from models/index.js
const { sequelize } = require("../models/db"); // Needed for transactions
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  convertToImageUrl,
  convertToImageUrlStatic,
} = require("../utils/imageUtils");

// --- Helper to fetch currency ---
const getCurrencyByCountry = async (countryName) => {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies");
    const countries = await response.json();
    
    const countryData = countries.find(
      (c) => c.name.common.toLowerCase() === countryName.toLowerCase()
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
    const { companyName, country, name, email, password, username, bio } = req.body;

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });

    if (existingUser) {
      await transaction.rollback();
      const conflictField = existingUser.email === email ? "email" : "username";
      return res.status(409).json({
        message: `User already exists with this ${conflictField}`,
        success: false,
        field: conflictField,
      });
    }

    const profilePicture = req.file
      ? convertToImageUrl(req.file.path, req)
      : null;

    // 1. Fetch Currency
    const baseCurrency = await getCurrencyByCountry(country);

    // 2. Create Company
    const newCompany = await Company.create({
      name: companyName,
      country: country,
      baseCurrency: baseCurrency
    }, { transaction });

    // 3. Create Admin User
    const newUser = await User.create({
      name,
      email,
      username,
      password: await bcrypt.hash(password, 12),
      profilePicture,
      bio: bio || "",
      role: "Admin", // Automatically assign Admin role
      companyId: newCompany.id,
      managerId: null 
    }, { transaction });

    await transaction.commit();

    const jwtToken = jwt.sign(
      {
        email: newUser.email,
        _id: newUser.id,
        role: newUser.role,
        companyId: newUser.companyId
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    const userResponse = processUserForResponse(newUser, req);
    res.status(201).json({
      message: "Company and Admin registered successfully",
      success: true,
      token: jwtToken,
      user: toPublicUser(userResponse),
      company: newCompany
    });
  } catch (err) {
    await transaction.rollback();
    console.error("SignUp Error:", err);

    if (err instanceof UniqueConstraintError) {
      const field = err.errors?.[0]?.path || "field";
      return res.status(409).json({
        message: `This ${field} is already taken`,
        success: false,
        field,
      });
    }

    res.status(500).json({
      message: "Internal server error during registration",
      success: false,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.unscoped().findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password", success: false });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password", success: false });
    }

    const jwtToken = jwt.sign(
      {
        email: user.email,
        _id: user.id,
        role: user.role,
        companyId: user.companyId // Added companyId
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    const userResponse = processUserForResponse(user, req);
    res.status(200).json({
      message: "Login successful",
      success: true,
      token: jwtToken,
      user: toPublicUser(userResponse),
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Internal server error during login", success: false });
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
    if (req.file) updates.profilePicture = convertToImageUrl(req.file.path, req);

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

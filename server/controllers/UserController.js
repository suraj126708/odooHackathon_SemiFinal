// controllers/UserController.js
const { User } = require("../models");
const bcrypt = require("bcrypt");

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, manager_id } = req.body;

    // The Admin's company_id is inside the JWT token (req.user)
    const company_id = req.user.company_id;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Name, email, password, and role are required." });
    }

    // Ensure the role is valid
    if (!["manager", "employee"].includes(role.toLowerCase())) {
      return res
        .status(400)
        .json({ message: "Role must be 'manager' or 'employee'." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "A user with this email already exists." });
    }

    // Optional: If a manager_id is provided, verify that the manager exists and belongs to the same company
    if (manager_id) {
      const manager = await User.findOne({
        where: { id: manager_id, company_id: company_id, role: "manager" },
      });
      if (!manager) {
        return res
          .status(404)
          .json({
            message:
              "Invalid manager ID or manager does not belong to your company.",
          });
      }
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      role: role.toLowerCase(),
      company_id: company_id,
      manager_id: manager_id || null,
    });

    res.status(201).json({
      message: `${role} created successfully!`,
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        manager_id: newUser.manager_id,
        company_id: newUser.company_id,
      },
    });
  } catch (error) {
    console.error("Create User Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while creating user." });
  }
};

module.exports = {
  createUser,
};

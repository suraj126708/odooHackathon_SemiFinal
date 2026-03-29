const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Op, fn, col, where } = require("sequelize");
const { User, Company } = require("../models");
const { sendLoginCredentialsEmail } = require("../utils/mailer");
const { normalizeRoles, primaryRole } = require("../utils/roleUtils");

const stdOk = (res, status, message, data = {}) =>
  res.status(status).json({ success: true, message, data });

const stdErr = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

const generateTempPassword = () =>
  crypto.randomBytes(12).toString("base64url").slice(0, 16);

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const lowerNameMatch = (name) =>
  where(fn("LOWER", col("name")), (name || "").trim().toLowerCase());

const createCompany = async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    const country = (req.body?.country || "").trim();
    const baseCurrency = (req.body?.baseCurrency || req.body?.currency_code || "")
      .trim()
      .toUpperCase();

    if (!name || name.length < 2) {
      return stdErr(res, 400, "Company name must be at least 2 characters.");
    }
    if (!country) {
      return stdErr(res, 400, "Country is required.");
    }
    if (!baseCurrency || baseCurrency.length < 3) {
      return stdErr(res, 400, "A valid currency code is required.");
    }

    const dup = await Company.findOne({ where: lowerNameMatch(name) });
    if (dup) {
      return stdErr(res, 409, "A company with this name already exists.");
    }

    const company = await Company.create({
      name,
      country,
      currency_code: baseCurrency,
    });

    return stdOk(res, 201, "Company created successfully.", {
      company: {
        id: company.id,
        name: company.name,
        country: company.country,
        currency_code: company.currency_code,
        created_at: company.created_at,
      },
    });
  } catch (err) {
    console.error("createCompany:", err);
    return stdErr(res, 500, "Could not create company.");
  }
};

const listCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      attributes: ["id", "name", "country", "currency_code", "created_at"],
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"],
      ],
    });
    return stdOk(res, 200, "OK", { companies });
  } catch (err) {
    console.error("listCompanies:", err);
    return stdErr(res, 500, "Could not load companies.");
  }
};

const listCompanyUsers = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    if (!company_id) {
      return stdErr(res, 400, "Missing company context for this admin.");
    }

    const users = await User.findAll({
      where: { company_id },
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "roles",
        "manager_id",
        "company_id",
      ],
      include: [
        {
          model: User,
          as: "Manager",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      order: [["name", "ASC"]],
    });

    const payload = users.map((u) => {
      const plain = u.get({ plain: true });
      const rList = normalizeRoles(
        plain.roles?.length ? plain.roles : [plain.role],
      );
      return {
        id: plain.id,
        name: plain.name,
        email: plain.email,
        role: primaryRole(rList),
        roles: rList.length ? rList : [plain.role],
        manager_id: plain.manager_id,
        company_id: plain.company_id,
        managerName: plain.Manager?.name ?? null,
        managerEmail: plain.Manager?.email ?? null,
      };
    });

    return stdOk(res, 200, "OK", { users: payload });
  } catch (err) {
    console.error("listCompanyUsers:", err);
    return stdErr(res, 500, "Could not load users.");
  }
};

async function findManagerByName(company_id, managerName) {
  const n = (managerName || "").trim();
  if (!n) return null;
  return User.findOne({
    where: {
      [Op.and]: [
        { company_id },
        { role: "manager" },
        lowerNameMatch(n),
      ],
    },
  });
}

function summarizeMailResults(results) {
  const mail = (results || []).map((r) => ({
    to: r.to,
    sent: Boolean(r.sent),
    skipped: Boolean(r.skipped),
    error: r.error || null,
  }));
  const anyFailed = (results || []).some(
    (r) => !r.sent && !r.skipped && r.error,
  );
  return {
    emailSent: (results || []).some((r) => r.sent),
    mailFailed: anyFailed,
    mail,
  };
}

const sendPasswordInvite = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    if (!company_id) {
      return stdErr(res, 400, "Missing company context for this admin.");
    }

    const {
      userName,
      userId,
      email,
      role,
      roles: rolesBody,
      managerName,
      managerId,
      managerEmail,
      createUserIfNew,
      createManagerIfNew,
    } = req.body;

    const name = (userName || "").trim();
    const emailNorm = (email || "").trim().toLowerCase();
    const normalizedRoles = normalizeRoles(
      Array.isArray(rolesBody) && rolesBody.length
        ? rolesBody
        : role
          ? [role]
          : [],
    );

    const isExistingReset = !createUserIfNew && userId;

    if (!name || name.length < 2) {
      return stdErr(res, 400, "User name is required.");
    }
    if (!emailNorm || !emailRx.test(emailNorm)) {
      return stdErr(res, 400, "A valid email is required.");
    }
    if (!isExistingReset && !normalizedRoles.length) {
      return stdErr(res, 400, "Select at least one role.");
    }

    const roleNorm = normalizedRoles.length
      ? primaryRole(normalizedRoles)
      : null;

    let resolvedManagerId =
      managerId != null && managerId !== "" ? Number(managerId) : null;
    if (resolvedManagerId !== null && Number.isNaN(resolvedManagerId)) {
      resolvedManagerId = null;
    }

    let managerTemporaryPassword;
    let managerInviteEmail = null;

    const needsManagerLine =
      !isExistingReset &&
      normalizedRoles.includes("employee") &&
      !normalizedRoles.includes("admin");

    if (needsManagerLine) {
      if (resolvedManagerId) {
        const mgr = await User.findOne({
          where: {
            id: resolvedManagerId,
            company_id,
            role: "manager",
          },
        });
        if (!mgr) {
          return stdErr(res, 400, "Invalid manager for this company.");
        }
      } else if (createManagerIfNew && (managerName || "").trim()) {
        const me = (managerEmail || "").trim().toLowerCase();
        if (!me || !emailRx.test(me)) {
          return stdErr(
            res,
            400,
            "Manager email is required to create a new manager.",
          );
        }
        const emailTaken = await User.unscoped().findOne({
          where: { email: me },
        });
        if (emailTaken) {
          return stdErr(res, 409, "Manager email is already registered.");
        }
        managerInviteEmail = me;
        managerTemporaryPassword = generateTempPassword();
        const newMgr = await User.create({
          name: (managerName || "").trim(),
          email: me,
          password_hash: await bcrypt.hash(managerTemporaryPassword, 12),
          role: "manager",
          roles: ["manager"],
          company_id,
          manager_id: null,
        });
        resolvedManagerId = newMgr.id;
      } else if ((managerName || "").trim()) {
        const found = await findManagerByName(company_id, managerName);
        resolvedManagerId = found ? found.id : null;
        if (!resolvedManagerId) {
          return stdErr(
            res,
            400,
            "Unknown manager. Pick someone from the list, or provide manager email to create a new manager.",
          );
        }
      }
    } else {
      resolvedManagerId = null;
    }

    const tempPassword = generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 12);

    if (!createUserIfNew && userId) {
      const existing = await User.unscoped().findOne({
        where: { id: userId, company_id },
      });
      if (!existing) {
        return stdErr(res, 404, "User not found in your company.");
      }
      const updatePayload = { password_hash };
      if (normalizedRoles.length) {
        updatePayload.roles = normalizedRoles;
        updatePayload.role = primaryRole(normalizedRoles);
      }
      await existing.update(updatePayload);
      const mailRes = await sendLoginCredentialsEmail({
        to: existing.email,
        recipientName: existing.name,
        loginEmail: existing.email,
        password: tempPassword,
        subject: "Your new temporary password",
      });
      const { emailSent, mailFailed, mail } = summarizeMailResults([
        mailRes,
      ]);
      return stdOk(
        res,
        200,
        emailSent
          ? "Temporary password set and sent by email."
          : mailFailed
            ? "Temporary password set; email delivery failed."
            : "Temporary password set.",
        {
          temporaryPassword: tempPassword,
          managerTemporaryPassword: managerTemporaryPassword || undefined,
          user: {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            role: existing.role,
            roles: normalizeRoles(
              existing.roles?.length ? existing.roles : [existing.role],
            ),
          },
          emailSent,
          mailFailed,
          mail,
        },
      );
    }

    if (createUserIfNew) {
      const taken = await User.unscoped().findOne({
        where: { email: emailNorm },
      });
      if (taken) {
        return stdErr(res, 409, "A user with this email already exists.");
      }

      const newUser = await User.create({
        name,
        email: emailNorm,
        password_hash,
        role: roleNorm,
        roles: normalizedRoles,
        company_id,
        manager_id: normalizedRoles.includes("admin")
          ? null
          : resolvedManagerId,
      });

      const mailPieces = [];
      if (managerTemporaryPassword && managerInviteEmail) {
        const m = await sendLoginCredentialsEmail({
          to: managerInviteEmail,
          recipientName: (managerName || "").trim(),
          loginEmail: managerInviteEmail,
          password: managerTemporaryPassword,
          subject: "Your manager account — login details",
        });
        mailPieces.push(m);
      }
      const uMail = await sendLoginCredentialsEmail({
        to: emailNorm,
        recipientName: name,
        loginEmail: emailNorm,
        password: tempPassword,
        subject: "Your account — login details",
      });
      mailPieces.push(uMail);
      const { emailSent, mailFailed, mail } =
        summarizeMailResults(mailPieces);

      return stdOk(
        res,
        201,
        emailSent
          ? "User created and credentials sent by email."
          : mailFailed
            ? "User created; email delivery failed for one or more messages."
            : "User created with a temporary password.",
        {
          temporaryPassword: tempPassword,
          managerTemporaryPassword: managerTemporaryPassword || undefined,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            roles: normalizedRoles,
            manager_id: newUser.manager_id,
          },
          emailSent,
          mailFailed,
          mail,
        },
      );
    }

    return stdErr(res, 400, "Invalid invite request.");
  } catch (err) {
    console.error("sendPasswordInvite:", err);
    return stdErr(res, 500, "Could not process user invite.");
  }
};

module.exports = {
  createCompany,
  listCompanies,
  listCompanyUsers,
  sendPasswordInvite,
};

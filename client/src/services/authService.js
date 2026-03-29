// Mock authentication service for local frontend-only behavior
const runFakeNetwork = (response, delay = 700) =>
  new Promise((resolve) => setTimeout(() => resolve(response), delay));

const getRoleFromEmail = (email) => {
  const lower = email.trim().toLowerCase();
  if (lower.includes("admin")) return "admin";
  if (lower.includes("manager") || lower.includes("middle")) return "manager";
  return "employee";
};

let users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    country: "USA",
  },
  {
    id: 2,
    name: "Manager User",
    email: "manager@example.com",
    password: "manager123",
    role: "manager",
    country: "USA",
  },
  {
    id: 3,
    name: "Employee User",
    email: "employee@example.com",
    password: "employee123",
    role: "employee",
    country: "USA",
  },
];

const buildToken = () => `${Math.random().toString(36).substr(2)}.${Date.now()}`;

export const login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find((u) => u.email === normalizedEmail && u.password === password);

  if (!user) {
    return runFakeNetwork({ success: false, message: "Invalid email or password" }, 600).then((res) => {
      const err = new Error(res.message);
      err.status = 401;
      throw err;
    });
  }

  const token = buildToken();
  return runFakeNetwork({ success: true, token, user: { ...user, password: undefined } }, 600);
};

export const register = async ({ name, email, password, country, role }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = users.find((u) => u.email === normalizedEmail);
  if (existing) {
    return runFakeNetwork({ success: false, message: "Email already in use" }, 600).then((res) => {
      const err = new Error(res.message);
      err.status = 409;
      throw err;
    });
  }

  const resolvedRole = role || getRoleFromEmail(normalizedEmail);

  const newUser = {
    id: users.length + 1,
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: resolvedRole,
    country,
  };

  users = [...users, newUser];

  return runFakeNetwork({ success: true, user: { ...newUser, password: undefined } }, 800);
};

import axiosInstance from "../Authorisation/axiosConfig";

function getErrorMessage(error) {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message && typeof error.message === "string") return error.message;
  return "Something went wrong. Please try again.";
}

/**
 * Login against the real API so seeded users and DB-backed accounts work.
 */
export const login = async ({ email, password }) => {
  try {
    const { data } = await axiosInstance.post("/api/auth/login", {
      email,
      password,
    });
    if (!data?.success || !data.token || !data.user) {
      const err = new Error(data?.message || "Login failed");
      throw err;
    }
    return { token: data.token, user: data.user };
  } catch (error) {
    const err = new Error(getErrorMessage(error));
    throw err;
  }
};

export async function forgotPassword(email) {
  try {
    const { data } = await axiosInstance.post("/api/auth/forgot-password", {
      email: email.trim().toLowerCase(),
    });
    if (!data?.success) {
      throw new Error(data?.message || "Request failed");
    }
    return data.message || "";
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/* Registration still uses the local mock until signup UI and /api/auth/signup payloads are aligned. */
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

export const register = async ({ name, email, password, country, role }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = users.find((u) => u.email === normalizedEmail);
  if (existing) {
    return runFakeNetwork(
      { success: false, message: "Email already in use" },
      600,
    ).then((res) => {
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

  return runFakeNetwork(
    { success: true, user: { ...newUser, password: undefined } },
    800,
  );
};

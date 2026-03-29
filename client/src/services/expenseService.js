const STORAGE_KEY = "rms_employee_expenses_v1";

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRaw(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function convertToBase(amount, fromCurrency, toCurrency) {
  if (!amount || fromCurrency === toCurrency) return amount;
  try {
    const u = new URL("https://api.frankfurter.app/latest");
    u.searchParams.set("from", fromCurrency);
    u.searchParams.set("to", toCurrency);
    const res = await fetch(u.toString());
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.[toCurrency];
    if (typeof rate !== "number") return null;
    return Math.round(amount * rate * 100) / 100;
  } catch {
    return null;
  }
}

export const DEFAULT_BASE_CURRENCY = "INR";

export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Lodging",
  "Supplies",
  "Software",
  "Other",
];

export const CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "SGD",
  "JPY",
  "AUD",
];

export const PAID_BY_OPTIONS = ["Self", "Company card", "Other"];

export async function fetchMyExpenses() {
  return loadRaw().sort(
    (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  );
}

export async function createDraftExpense(partial = {}) {
  const now = new Date().toISOString();
  const row = {
    id: uid(),
    employeeName: partial.employeeName || "",
    description: partial.description || "",
    expenseDate: partial.expenseDate || now.slice(0, 10),
    category: partial.category || "Other",
    paidBy: partial.paidBy || "Self",
    remarks: partial.remarks || "",
    amount: partial.amount ?? 0,
    currencyCode: partial.currencyCode || DEFAULT_BASE_CURRENCY,
    amountInCompanyCurrency: partial.amountInCompanyCurrency ?? null,
    detailedDescription: partial.detailedDescription || "",
    receiptFileName: partial.receiptFileName || null,
    status: "draft",
    approvalLog: [],
    createdAt: now,
    updatedAt: now,
  };
  const list = loadRaw();
  list.push(row);
  saveRaw(list);
  return row;
}

export async function updateExpense(id, patch) {
  const list = loadRaw();
  const i = list.findIndex((e) => e.id === id);
  if (i === -1) throw new Error("Expense not found");
  const cur = list[i];
  if (cur.status !== "draft") {
    throw new Error("Only draft expenses can be edited");
  }
  const next = {
    ...cur,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  list[i] = next;
  saveRaw(list);
  return next;
}

export async function submitExpense(id, baseCurrency = DEFAULT_BASE_CURRENCY) {
  const list = loadRaw();
  const i = list.findIndex((e) => e.id === id);
  if (i === -1) throw new Error("Expense not found");
  const cur = list[i];
  if (cur.status !== "draft") throw new Error("Already submitted");

  const amount = Number(cur.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid amount");
  }

  const from = cur.currencyCode || DEFAULT_BASE_CURRENCY;
  const converted =
    from === baseCurrency
      ? amount
      : await convertToBase(amount, from, baseCurrency);

  const submittedAt = new Date().toISOString();
  const next = {
    ...cur,
    status: "pending",
    amountInCompanyCurrency: converted ?? amount,
    approvalLog: [
      {
        approver: "—",
        status: "Submitted",
        time: submittedAt,
      },
    ],
    updatedAt: submittedAt,
  };
  list[i] = next;
  saveRaw(list);
  return next;
}

export async function parseReceiptStub(file) {
  await new Promise((r) => setTimeout(r, 500));
  const base = file?.name?.replace(/\.[^.]+$/, "") || "Receipt";
  return {
    description: `${base}`.slice(0, 120),
    amount: Math.round((40 + Math.random() * 200) * 100) / 100,
    currencyCode: DEFAULT_BASE_CURRENCY,
    expenseDate: new Date().toISOString().slice(0, 10),
  };
}

export function summarizeByStatus(expenses) {
  const sums = { draft: 0, pending: 0, approved: 0 };
  for (const e of expenses) {
    const n = Number(e.amount) || 0;
    if (e.status === "draft") sums.draft += n;
    else if (e.status === "pending") sums.pending += n;
    else if (e.status === "approved") sums.approved += n;
  }
  return sums;
}

export function statusLabel(status) {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending":
      return "Submitted";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

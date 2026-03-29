const STORAGE_KEY = "rms_approval_rules_v1";

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

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

export const RULE_TYPE_OPTIONS = [
  {
    value: "sequential",
    label: "Sequential",
    hint: "Claim moves stage by stage; each approver must pass before the next.",
    accent: "border-teal-500/40 bg-teal-500/[0.07] text-teal-200/90",
    ring: "data-[active=true]:border-teal-400/60 data-[active=true]:ring-2 data-[active=true]:ring-teal-500/30",
  },
  {
    value: "percentage",
    label: "Percentage",
    hint: "A threshold % of the group must approve (e.g. 2 of 3).",
    accent: "border-violet-500/40 bg-violet-500/[0.07] text-violet-200/90",
    ring: "data-[active=true]:border-violet-400/60 data-[active=true]:ring-2 data-[active=true]:ring-violet-500/30",
  },
  {
    value: "specific",
    label: "Specific approver",
    hint: "One designated person must approve; others optional.",
    accent: "border-amber-500/40 bg-amber-500/[0.07] text-amber-200/90",
    ring: "data-[active=true]:border-amber-400/60 data-[active=true]:ring-2 data-[active=true]:ring-amber-500/30",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    hint: "Either the minimum % is met OR the special approver approves.",
    accent: "border-rose-500/40 bg-rose-500/[0.07] text-rose-200/90",
    ring: "data-[active=true]:border-rose-400/60 data-[active=true]:ring-2 data-[active=true]:ring-rose-500/30",
  },
];

export function emptyRuleForm() {
  return {
    name: "",
    description: "",
    subjectUserId: "",
    managerId: "",
    ruleType: "sequential",
    isManagerApprover: false,
    approversSequence: true,
    minApprovalPct: 50,
    specificApproverId: "",
    approvers: [{ rowId: uid(), userId: "", required: true }],
  };
}

export async function listApprovalRules() {
  return loadRaw().sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
  );
}

export async function getApprovalRule(id) {
  return loadRaw().find((r) => r.id === id) || null;
}

export async function upsertApprovalRule(payload) {
  const list = loadRaw();
  const now = new Date().toISOString();
  const id = payload.id || uid();
  const idx = list.findIndex((r) => r.id === id);
  const row = {
    ...payload,
    id,
    updatedAt: now,
    createdAt: idx >= 0 ? list[idx].createdAt : now,
  };
  if (idx >= 0) list[idx] = row;
  else list.push(row);
  saveRaw(list);
  return row;
}

export async function deleteApprovalRule(id) {
  const list = loadRaw().filter((r) => r.id !== id);
  saveRaw(list);
}

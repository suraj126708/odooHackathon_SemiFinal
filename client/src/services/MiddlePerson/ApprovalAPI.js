import axiosInstance from "../../Authorisation/axiosConfig";

/**
 * Normalized shape for the approvals table.
 * @typedef {Object} ApprovalRow
 * @property {string} id
 * @property {string} reviewerLabel
 * @property {string} reviewerSubtext
 * @property {string} requestOwner
 * @property {string} category
 * @property {string} status
 * @property {string} amountOriginal
 * @property {string} conversionNote
 * @property {number} amountInCompanyCurrency
 */

export const FALLBACK_DUMMY_APPROVALS = [
  {
    id: "exp-demo-001",
    reviewerLabel: "Rohit Khond",
    reviewerSubtext: "none",
    requestOwner: "Sarah",
    category: "Food",
    status: "Approved",
    amountOriginal: "567 $",
    conversionNote: "(in INR)",
    amountInCompanyCurrency: 49896,
  },
];

function normalizeApproval(raw) {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    reviewerLabel: raw.reviewerLabel ?? raw.managerName ?? raw.badgeLabel ?? "",
    reviewerSubtext: raw.reviewerSubtext ?? raw.badgeSubtext ?? "none",
    requestOwner: raw.requestOwner ?? raw.ownerName ?? raw.employeeName ?? "",
    category: raw.category ?? raw.categoryName ?? "",
    status: raw.status ?? raw.requestStatus ?? "",
    amountOriginal: raw.amountOriginal ?? raw.originalAmountLabel ?? "",
    conversionNote: raw.conversionNote ?? "",
    amountInCompanyCurrency: Number(
      raw.amountInCompanyCurrency ?? raw.convertedAmount ?? 0,
    ),
  };
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.approvals)) return payload.approvals;
  return [];
}

/**
 * GET pending approvals for the current manager.
 * Expects `{ success, data }` where `data` is an array or `{ items: [] }`.
 * @returns {Promise<ApprovalRow[]>}
 */
export async function fetchPendingApprovals() {
  const res = await axiosInstance.get("/api/manager/approvals");
  const body = res.data;
  const payload = body?.data !== undefined ? body.data : body;
  return extractList(payload).map(normalizeApproval);
}

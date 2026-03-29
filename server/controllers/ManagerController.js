const { Expense, ExpenseApproval, User, ApprovalRule, Company } = require("../models");
const { sequelize } = require("../models/db");
const {
  advanceAfterApproval,
  rejectAllPending,
  clearPendingApprovals,
} = require("../services/approvalEngine");
const {
  sendExpensePendingForApprover,
  sendExpenseDecisionToEmployee,
} = require("../utils/mailer");

const ok = (res, status, message, data) =>
  res.status(status).json({ success: true, message, data });
const err = (res, status, message) =>
  res.status(status).json({ success: false, message });

function formatApprovalRow(approval, approverUser, company) {
  const exp = approval.Expense;
  const sub = exp.Submitter;
  const cur = company?.currency_code || "USD";
  return {
    id: String(approval.id),
    approvalId: approval.id,
    expenseId: exp.id,
    reviewerLabel: approverUser?.name || "Approver",
    reviewerSubtext: "Pending your action",
    requestOwner: sub?.name || "—",
    requestOwnerEmail: sub?.email || "",
    category: exp.category || "—",
    status: exp.status,
    amountOriginal: `${exp.amount} ${exp.currency_code}`,
    conversionNote: `(converted to ${cur})`,
    amountInCompanyCurrency: Number(exp.amount_in_company_currency || 0),
    receiptUrl: exp.receipt_url || null,
  };
}

async function notifyAfterApproveCommit({
  expenseId,
  actingApproverId,
  comment,
  newPendingApproverIds,
}) {
  const exp = await Expense.findByPk(expenseId);
  if (!exp) return;
  const submitter = await User.findByPk(exp.submitted_by);
  const acting = await User.findByPk(actingApproverId);
  if (!submitter?.email) return;

  if (exp.status === "approved") {
    try {
      await sendExpenseDecisionToEmployee({
        to: submitter.email,
        employeeName: submitter.name,
        expenseId: exp.id,
        decision: "approved",
        reason: comment,
        category: exp.category,
        amount: String(exp.amount),
        currency: exp.currency_code,
        approverName: acting?.name,
      });
    } catch (e) {
      console.error("notifyAfterApproveCommit (employee):", e.message);
    }
    return;
  }

  const ids = newPendingApproverIds || [];
  for (const aid of ids) {
    try {
      const a = await User.findByPk(aid);
      if (!a?.email) continue;
      await sendExpensePendingForApprover({
        to: a.email,
        approverName: a.name,
        submitterName: submitter.name,
        expenseId: exp.id,
        category: exp.category,
        amount: String(exp.amount),
        currency: exp.currency_code,
      });
    } catch (e) {
      console.error("notifyAfterApproveCommit (next approver):", e.message);
    }
  }
}

async function notifyAfterRejectCommit({ expenseId, actingApproverId, comment }) {
  const exp = await Expense.findByPk(expenseId);
  if (!exp) return;
  const submitter = await User.findByPk(exp.submitted_by);
  const acting = await User.findByPk(actingApproverId);
  if (!submitter?.email) return;
  try {
    await sendExpenseDecisionToEmployee({
      to: submitter.email,
      employeeName: submitter.name,
      expenseId: exp.id,
      decision: "rejected",
      reason: comment,
      category: exp.category,
      amount: String(exp.amount),
      currency: exp.currency_code,
      approverName: acting?.name,
    });
  } catch (e) {
    console.error("notifyAfterRejectCommit:", e.message);
  }
}

const listPendingApprovals = async (req, res) => {
  try {
    const approverId = req.user._id;
    const me = await User.findByPk(approverId);
    const company = await Company.findByPk(req.user.company_id);

    const approvals = await ExpenseApproval.findAll({
      where: { approver_id: approverId, status: "pending" },
      include: [
        {
          model: Expense,
          required: true,
          where: { status: "pending" },
          include: [
            {
              model: User,
              as: "Submitter",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    const items = approvals.map((a) => formatApprovalRow(a, me, company));
    return ok(res, 200, "OK", { items });
  } catch (e) {
    console.error("listPendingApprovals:", e);
    return err(res, 500, "Could not load approvals.");
  }
};

const approveExpense = async (req, res) => {
  const transaction = await sequelize.transaction();
  let newPendingApproverIds = [];
  try {
    const expenseId = Number(req.params.expenseId);
    const approverId = req.user._id;
    const { comment } = req.body || {};

    const approval = await ExpenseApproval.findOne({
      where: {
        expense_id: expenseId,
        approver_id: approverId,
        status: "pending",
      },
      include: [{ model: Expense }],
      transaction,
    });

    if (!approval || !approval.Expense) {
      await transaction.rollback();
      return err(res, 404, "No pending approval found for you on this expense.");
    }

    const expense = approval.Expense;
    if (expense.company_id !== req.user.company_id) {
      await transaction.rollback();
      return err(res, 403, "Access denied.");
    }

    await approval.update(
      {
        status: "approved",
        acted_at: new Date(),
        comment: comment || null,
      },
      { transaction },
    );

    const rule = expense.rule_id
      ? await ApprovalRule.findByPk(expense.rule_id, { transaction })
      : null;

    if (!rule) {
      await expense.update({ status: "approved" }, { transaction });
      await transaction.commit();
      await notifyAfterApproveCommit({
        expenseId,
        actingApproverId: approverId,
        comment,
        newPendingApproverIds: [],
      });
      return ok(res, 200, "Expense approved.", { expenseId });
    }

    const adv = await advanceAfterApproval(transaction, expense, rule, approval);
    newPendingApproverIds = adv?.newPendingApproverIds || [];

    await expense.reload({ transaction });
    if (expense.status === "approved") {
      await clearPendingApprovals(transaction, expense.id);
    }

    await transaction.commit();
    await notifyAfterApproveCommit({
      expenseId,
      actingApproverId: approverId,
      comment,
      newPendingApproverIds,
    });
    return ok(res, 200, "Expense approved.", { expenseId });
  } catch (e) {
    await transaction.rollback();
    console.error("approveExpense:", e);
    return err(res, 500, "Could not approve expense.");
  }
};

const rejectExpense = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const expenseId = Number(req.params.expenseId);
    const approverId = req.user._id;
    const { comment } = req.body || {};
    const reason = comment != null ? String(comment).trim() : "";
    if (!reason) {
      await transaction.rollback();
      return err(res, 400, "Rejection reason is required (sent to the employee).");
    }

    const approval = await ExpenseApproval.findOne({
      where: {
        expense_id: expenseId,
        approver_id: approverId,
        status: "pending",
      },
      include: [{ model: Expense }],
      transaction,
    });

    if (!approval || !approval.Expense) {
      await transaction.rollback();
      return err(res, 404, "No pending approval found for you on this expense.");
    }

    const expense = approval.Expense;
    if (expense.company_id !== req.user.company_id) {
      await transaction.rollback();
      return err(res, 403, "Access denied.");
    }

    await approval.update(
      {
        status: "rejected",
        acted_at: new Date(),
        comment: reason,
      },
      { transaction },
    );

    await expense.update({ status: "rejected" }, { transaction });
    await rejectAllPending(transaction, expense.id);

    await transaction.commit();
    await notifyAfterRejectCommit({
      expenseId,
      actingApproverId: approverId,
      comment: reason,
    });
    return ok(res, 200, "Expense rejected.", { expenseId });
  } catch (e) {
    await transaction.rollback();
    console.error("rejectExpense:", e);
    return err(res, 500, "Could not reject expense.");
  }
};

module.exports = {
  listPendingApprovals,
  approveExpense,
  rejectExpense,
};

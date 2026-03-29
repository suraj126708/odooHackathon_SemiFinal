const { ApprovalRule, User, ExpenseApproval } = require("../models");

function normalizeSeq(seq) {
  if (!Array.isArray(seq)) return [];
  return seq.map(Number).filter((n) => Number.isFinite(n) && n > 0);
}

function uniqueChain(ids) {
  const seen = new Set();
  const out = [];
  for (const x of ids) {
    if (!x || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

function buildSequentialChain(rule, employee) {
  const seq = normalizeSeq(rule.approver_sequence);
  const mgr = rule.is_manager_approver
    ? rule.rule_manager_id || employee.manager_id
    : null;
  const chain = [];
  if (mgr) chain.push(mgr);
  chain.push(...seq);
  return uniqueChain(chain);
}

function parallelPool(rule, employee) {
  const seq = normalizeSeq(rule.approver_sequence);
  const mgr = rule.is_manager_approver
    ? rule.rule_manager_id || employee.manager_id
    : null;
  const p = [];
  if (mgr) p.push(mgr);
  p.push(...seq);
  return uniqueChain(p);
}

function normCategoryToken(s) {
  return String(s || "").trim().toLowerCase();
}

async function findApplicableRule(companyId, employeeId, category) {
  const rules = await ApprovalRule.findAll({
    where: { company_id: companyId },
    order: [["id", "ASC"]],
  });
  const expCat = normCategoryToken(category);
  const scored = [];
  for (const rule of rules) {
    if (rule.subject_user_id && rule.subject_user_id !== employeeId) continue;
    const rcRaw = String(rule.category || "All").trim();
    const ruleIsAll =
      !rcRaw || normCategoryToken(rcRaw) === normCategoryToken("All");
    if (!ruleIsAll && normCategoryToken(rcRaw) !== expCat) continue;
    let score = 0;
    if (rule.subject_user_id === employeeId) score += 100;
    if (!ruleIsAll && normCategoryToken(rcRaw) === expCat) score += 50;
    else if (ruleIsAll) score += 10;
    scored.push({ rule, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.rule || null;
}

async function createInitialApprovals(transaction, expense, rule, employee) {
  const { rule_type } = rule;
  const chain = buildSequentialChain(rule, employee);

  switch (rule_type) {
    case "sequential": {
      if (chain.length === 0) {
        await expense.update(
          { status: "approved", rule_id: rule.id },
          { transaction },
        );
        return;
      }
      await ExpenseApproval.create(
        {
          expense_id: expense.id,
          approver_id: chain[0],
          step: 1,
          status: "pending",
        },
        { transaction },
      );
      await expense.update(
        { current_step: 1, status: "pending", rule_id: rule.id },
        { transaction },
      );
      return;
    }
    case "specific": {
      const aid = rule.specific_approver_id;
      if (!aid) {
        await expense.update(
          { status: "approved", rule_id: rule.id },
          { transaction },
        );
        return;
      }
      await ExpenseApproval.create(
        {
          expense_id: expense.id,
          approver_id: aid,
          step: 1,
          status: "pending",
        },
        { transaction },
      );
      await expense.update(
        { current_step: 1, status: "pending", rule_id: rule.id },
        { transaction },
      );
      return;
    }
    case "percentage": {
      const ids = parallelPool(rule, employee);
      if (ids.length === 0) {
        await expense.update(
          { status: "approved", rule_id: rule.id },
          { transaction },
        );
        return;
      }
      for (const aid of ids) {
        await ExpenseApproval.create(
          {
            expense_id: expense.id,
            approver_id: aid,
            step: 1,
            status: "pending",
            comment: "percentage:pool",
          },
          { transaction },
        );
      }
      await expense.update(
        { current_step: 1, status: "pending", rule_id: rule.id },
        { transaction },
      );
      return;
    }
    case "all": {
      const ids = parallelPool(rule, employee);
      if (ids.length === 0) {
        await expense.update(
          { status: "approved", rule_id: rule.id },
          { transaction },
        );
        return;
      }
      for (const aid of ids) {
        await ExpenseApproval.create(
          {
            expense_id: expense.id,
            approver_id: aid,
            step: 1,
            status: "pending",
            comment: "all:pool",
          },
          { transaction },
        );
      }
      await expense.update(
        { current_step: 1, status: "pending", rule_id: rule.id },
        { transaction },
      );
      return;
    }
    case "hybrid": {
      const ids = parallelPool(rule, employee);
      const spec = rule.specific_approver_id;
      if (!spec && ids.length === 0) {
        await expense.update(
          { status: "approved", rule_id: rule.id },
          { transaction },
        );
        return;
      }
      if (spec) {
        await ExpenseApproval.create(
          {
            expense_id: expense.id,
            approver_id: spec,
            step: 1,
            status: "pending",
            comment: "hybrid:specific",
          },
          { transaction },
        );
      }
      for (const aid of ids) {
        if (spec && aid === spec) continue;
        await ExpenseApproval.create(
          {
            expense_id: expense.id,
            approver_id: aid,
            step: 1,
            status: "pending",
            comment: "hybrid:pool",
          },
          { transaction },
        );
      }
      await expense.update(
        { current_step: 1, status: "pending", rule_id: rule.id },
        { transaction },
      );
      return;
    }
    default:
      await expense.update(
        { status: "approved", rule_id: rule.id },
        { transaction },
      );
  }
}

async function advanceAfterApproval(transaction, expense, rule, actingApproval) {
  const { rule_type } = rule;
  const out = { newPendingApproverIds: [] };

  if (rule_type === "sequential") {
    const employee = await User.findByPk(expense.submitted_by, { transaction });
    const chain = buildSequentialChain(rule, employee);
    const completed = await ExpenseApproval.count({
      where: { expense_id: expense.id, status: "approved" },
      transaction,
    });
    if (completed >= chain.length) {
      await expense.update({ status: "approved" }, { transaction });
      return out;
    }
    const nextApprover = chain[completed];
    await ExpenseApproval.create(
      {
        expense_id: expense.id,
        approver_id: nextApprover,
        step: completed + 1,
        status: "pending",
      },
      { transaction },
    );
    out.newPendingApproverIds.push(nextApprover);
    await expense.update({ current_step: completed + 1 }, { transaction });
    return out;
  }

  if (rule_type === "percentage") {
    const minPct = rule.min_approval_pct || 50;
    const stepRows = await ExpenseApproval.findAll({
      where: { expense_id: expense.id, step: 1 },
      transaction,
    });
    const total = stepRows.length;
    const approved = stepRows.filter((r) => r.status === "approved").length;
    if (total > 0 && (approved / total) * 100 >= minPct) {
      await expense.update({ status: "approved" }, { transaction });
    }
    return out;
  }

  if (rule_type === "all") {
    await expense.update({ status: "approved" }, { transaction });
    return out;
  }

  if (rule_type === "specific") {
    await expense.update({ status: "approved" }, { transaction });
    return out;
  }

  if (rule_type === "hybrid") {
    const minPct = rule.min_approval_pct || 50;
    const specificId = rule.specific_approver_id;
    if (specificId && actingApproval.approver_id === specificId) {
      await expense.update({ status: "approved" }, { transaction });
      return out;
    }
    const poolRows = await ExpenseApproval.findAll({
      where: {
        expense_id: expense.id,
        step: 1,
        comment: "hybrid:pool",
      },
      transaction,
    });
    if (poolRows.length === 0) {
      return out;
    }
    const total = poolRows.length;
    const approved = poolRows.filter((r) => r.status === "approved").length;
    if (total > 0 && (approved / total) * 100 >= minPct) {
      await expense.update({ status: "approved" }, { transaction });
    }
    return out;
  }

  return out;
}

async function fallbackManagerOnly(transaction, expense, employee) {
  if (employee.manager_id) {
    await ExpenseApproval.create(
      {
        expense_id: expense.id,
        approver_id: employee.manager_id,
        step: 1,
        status: "pending",
      },
      { transaction },
    );
    await expense.update(
      { current_step: 1, status: "pending", rule_id: null },
      { transaction },
    );
  } else {
    await expense.update({ status: "approved" }, { transaction });
  }
}

async function rejectAllPending(transaction, expenseId) {
  await ExpenseApproval.update(
    { status: "rejected", acted_at: new Date() },
    {
      where: { expense_id: expenseId, status: "pending" },
      transaction,
    },
  );
}

async function clearPendingApprovals(transaction, expenseId) {
  await ExpenseApproval.destroy({
    where: { expense_id: expenseId, status: "pending" },
    transaction,
  });
}

module.exports = {
  findApplicableRule,
  createInitialApprovals,
  advanceAfterApproval,
  fallbackManagerOnly,
  buildSequentialChain,
  parallelPool,
  rejectAllPending,
  clearPendingApprovals,
};

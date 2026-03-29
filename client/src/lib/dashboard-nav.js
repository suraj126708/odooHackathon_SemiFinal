import {
  LayoutDashboard,
  Users,
  Building2,
  CheckSquare,
  Receipt,
  GitBranch,
} from "lucide-react";

export const adminSidebarItems = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/company/new", label: "Company", icon: Building2 },
  { to: "/admin/approval-rules", label: "Approval rules", icon: GitBranch },
];

export const managerSidebarItems = [
  { to: "/manager/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/manager/approvals", label: "Approvals", icon: CheckSquare },
];

export const employeeSidebarItems = [
  { to: "/user/expenses", label: "Expenses", icon: Receipt },
];

export function getHomePathForRole(role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "manager") return "/manager/dashboard";
  if (role === "employee") return "/user/expenses";
  return "/";
}

export function getSidebarItemsForRole(role) {
  if (role === "admin") return adminSidebarItems;
  if (role === "manager") return managerSidebarItems;
  return employeeSidebarItems;
}

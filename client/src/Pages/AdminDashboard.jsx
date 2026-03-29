import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  return (
    <div className="page-shell">
      <Card className="surface-glow border-cyan-500/15">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Admin dashboard
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.name || "Admin"}.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Manage users, companies, and approval rules from here.
          </p>
          <ul className="flex flex-wrap gap-3 text-sm">
            <li>
              <Link
                className="font-medium text-primary hover:underline"
                to="/admin/users"
              >
                User management
              </Link>
            </li>
            <li>
              <Link
                className="font-medium text-primary hover:underline"
                to="/admin/company/new"
              >
                Create company
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

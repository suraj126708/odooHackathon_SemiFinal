import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function ManagerDashboard() {
  const { user } = useContext(AuthContext);
  return (
    <div className="page-shell">
      <Card className="surface-glow border-cyan-500/15">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Manager dashboard
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Hello, {user?.name || "Manager"}.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Review pending approvals and team expenses.
          </p>
          <Link
            className="inline-block text-sm font-medium text-primary hover:underline"
            to="/manager/approvals"
          >
            Open approvals queue →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

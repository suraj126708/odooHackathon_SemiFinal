import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  return (
    <div className="page-shell">
      <Card className="surface-glow border-cyan-500/15">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Your dashboard
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Welcome, {user?.name || "User"}.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Submit expenses and track reimbursement status here. (Flows can be
            wired to backend routes next.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

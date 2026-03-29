import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const navBtn = "text-muted-foreground hover:text-foreground";

export default function AppNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const handleLogout = () => {
    logout();
    localStorage.removeItem("rms_role");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/75 shadow-glow-inset backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span className="text-gradient-accent text-lg">RMS</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Reimbursement
          </span>
        </Link>

        <nav
          className={cn(
            "flex max-w-[70vw] flex-wrap items-center justify-end gap-1 sm:gap-2",
            "md:max-w-none"
          )}
        >
          <Button variant="ghost" size="sm" className={navBtn} asChild>
            <Link to="/">Home</Link>
          </Button>

          {!isAuthenticated && (
            <>
              <Button variant="ghost" size="sm" className={navBtn} asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button
                size="sm"
                className="shadow-glow-sm"
                asChild
              >
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}

          {isAuthenticated && (
            <>
              <Button variant="ghost" size="sm" className={navBtn} asChild>
                <Link to="/profile">Profile</Link>
              </Button>
              {role === "admin" && (
                <>
                  <Button variant="ghost" size="sm" className={navBtn} asChild>
                    <Link to="/admin/dashboard">Admin</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className={navBtn} asChild>
                    <Link to="/admin/users">Users</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className={navBtn} asChild>
                    <Link to="/admin/company/new">Company</Link>
                  </Button>
                </>
              )}
              {role === "manager" && (
                <>
                  <Button variant="ghost" size="sm" className={navBtn} asChild>
                    <Link to="/manager/dashboard">Manager</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className={navBtn} asChild>
                    <Link to="/manager/approvals">Approvals</Link>
                  </Button>
                </>
              )}
              {role === "employee" && (
                <Button variant="ghost" size="sm" className={navBtn} asChild>
                  <Link to="/user/dashboard">Dashboard</Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-border/60"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

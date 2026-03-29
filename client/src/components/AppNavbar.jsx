import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getHomePathForRole,
  getSidebarItemsForRole,
} from "../lib/dashboard-nav";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const linkClass =
  "text-gray-400 transition-all duration-200 hover:text-white hover:shadow-[0_0_12px_rgba(34,211,238,0.35)]";

export default function AppNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const roleNavItems = user
    ? getSidebarItemsForRole(role, user?.roles)
    : [];

  const handleLogout = () => {
    logout();
    localStorage.removeItem("rms_role");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 shadow-glow-inset backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        <Link
          to={
            isAuthenticated
              ? getHomePathForRole(role, user?.roles)
              : "/"
          }
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-white transition-transform duration-200 hover:scale-[1.02]"
        >
          <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-sm text-cyan-400 shadow-glow-cyan-soft">
            RMS
          </span>
          <span className="hidden text-xs text-gray-500 sm:inline">
            reimburse
          </span>
        </Link>

        <nav
          className={cn(
            "flex max-w-[72vw] flex-wrap items-center justify-end gap-1 sm:gap-2",
            "md:max-w-none"
          )}
        >
          {!isAuthenticated && (
            <Button variant="ghost" size="sm" className={linkClass} asChild>
              <Link to="/">Home</Link>
            </Button>
          )}

          {!isAuthenticated && (
            <>
              <Button variant="ghost" size="sm" className={linkClass} asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button
                size="sm"
                className="border border-cyan-500/40 bg-cyan-500 text-black shadow-glow-cyan-soft transition-all duration-200 hover:scale-[1.02] hover:bg-cyan-400 hover:shadow-glow-cyan"
                asChild
              >
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}

          {isAuthenticated && (
            <>
              {roleNavItems.map(({ to, label }) => (
                <Button
                  key={to}
                  variant="ghost"
                  size="sm"
                  className={linkClass}
                  asChild
                >
                  <Link to={to}>{label}</Link>
                </Button>
              ))}
              <Button variant="ghost" size="sm" className={linkClass} asChild>
                <Link to="/profile">Profile</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-gray-300 transition-all duration-200 hover:border-cyan-500/40 hover:text-cyan-300"
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

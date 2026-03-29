import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function DashboardSidebar({ items }) {
  return (
    <nav
      aria-label="Dashboard"
      className="flex flex-col gap-1 rounded-xl border border-white/10 bg-neutral-950/80 p-2 shadow-glow-inset backdrop-blur-md"
    >
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
              "text-gray-400 hover:bg-white/5 hover:text-gray-200",
              isActive &&
                "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-glow-cyan-soft"
            )
          }
        >
          <Icon className="size-4 shrink-0 opacity-90" strokeWidth={1.75} />
          <span className="font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

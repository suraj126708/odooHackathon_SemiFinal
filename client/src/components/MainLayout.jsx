import { Outlet } from "react-router-dom";
import AppNavbar from "./AppNavbar";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <AppNavbar />
      <Outlet />
    </div>
  );
}

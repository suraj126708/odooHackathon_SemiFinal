import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardSidebar from "../components/layout/DashboardSidebar";
import { StatCard } from "../components/dashboard/StatCard";
import MiniBarChart from "../components/dashboard/MiniBarChart";
import { managerSidebarItems } from "../lib/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function ManagerDashboard() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  return (
    <DashboardLayout sidebar={<DashboardSidebar items={managerSidebarItems} />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Manager overview
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Hello, {user?.name || "Manager"} — approvals and team spend in one
            place.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <StatCard
              title="Awaiting review"
              value="12"
              hint="Oldest: 2d"
              loading={loading}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <StatCard
              title="Approved (30d)"
              value="94"
              hint="Team rollup"
              loading={loading}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <StatCard
              title="Rejected"
              value="3"
              hint="Needs follow-up"
              loading={loading}
            />
          </div>

          <Card className="col-span-12 border-white/10 bg-neutral-950/70 backdrop-blur-sm lg:col-span-8">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">
                Team throughput
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MiniBarChart series={[30, 45, 38, 52, 48, 61, 55]} />
            </CardContent>
          </Card>

          <Card className="col-span-12 border-white/10 bg-neutral-950/70 lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-white/10" asChild>
                <Link to="/manager/approvals">Open approvals →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

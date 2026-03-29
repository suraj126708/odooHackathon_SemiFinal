import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardSidebar from "../components/layout/DashboardSidebar";
import { StatCard } from "../components/dashboard/StatCard";
import MiniBarChart from "../components/dashboard/MiniBarChart";
import { adminSidebarItems } from "../lib/dashboard-nav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <DashboardLayout sidebar={<DashboardSidebar items={adminSidebarItems} />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Admin overview
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Welcome back, {user?.name || "Admin"} — manage users, companies, and
            rules.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <StatCard
              title="Active users"
              value="128"
              hint="+4 this week"
              loading={loading}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <StatCard
              title="Pending expenses"
              value="23"
              hint="Across all teams"
              loading={loading}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <StatCard
              title="Companies"
              value="6"
              hint="Linked orgs"
              loading={loading}
            />
          </div>

          <Card className="col-span-12 border-white/10 bg-neutral-950/70 backdrop-blur-sm transition-all duration-200 hover:border-cyan-500/20 lg:col-span-7">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-white">
                Submission volume
              </CardTitle>
              <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                7d
              </Badge>
            </CardHeader>
            <CardContent>
              <MiniBarChart />
            </CardContent>
          </Card>

          <Card className="col-span-12 border-white/10 bg-neutral-950/70 backdrop-blur-sm lg:col-span-5">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">
                Quick links
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start border-white/10"
                asChild
              >
                <Link to="/admin/users">User management →</Link>
              </Button>
              {/* <Button variant="outline" className="justify-start border-white/10" asChild>
                <Link to="/admin/company/new">Create company →</Link>
              </Button> */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-300"
                  >
                    Keyboard shortcuts
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Shortcuts</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Placeholder for command palette / help.
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="nav" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 border border-white/10 bg-black/50 p-1">
                      <TabsTrigger
                        value="nav"
                        className="data-[state=active]:text-cyan-400"
                      >
                        Nav
                      </TabsTrigger>
                      <TabsTrigger
                        value="tips"
                        className="data-[state=active]:text-cyan-400"
                      >
                        Tips
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent
                      value="nav"
                      className="mt-3 text-sm text-gray-400"
                    >
                      Use the sidebar for fast jumps between overview, users,
                      and company setup.
                    </TabsContent>
                    <TabsContent
                      value="tips"
                      className="mt-3 text-sm text-gray-400"
                    >
                      Keep currency consistent when creating a company; users
                      inherit access from role assignments.
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

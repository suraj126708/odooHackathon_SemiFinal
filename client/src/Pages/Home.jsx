import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const features = [
  {
    title: "Submit & track",
    text: "Employees submit expenses with receipts; status stays visible end to end.",
  },
  {
    title: "Approvals",
    text: "Managers review queues and approve or reject with clear audit context.",
  },
  {
    title: "Company rules",
    text: "Admins configure companies, users, and approval rules per category.",
  },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  const dash =
    user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "manager"
        ? "/manager/dashboard"
        : "/user/dashboard";

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-violet-500/15 blur-[110px]"
        aria-hidden
      />

      <section className="page-shell relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/90">
            Reimbursement management
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            <span className="text-gradient-accent">Minimal ops.</span>{" "}
            <span className="text-foreground">Clear money.</span>
          </h1>
          <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
            One place for employees to claim expenses, managers to approve, and
            admins to govern users, companies, and rules—aligned with your
            company currency.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!isAuthenticated ? (
              <>
                <Button className="shadow-glow" size="lg" asChild>
                  <Link to="/register">Get started</Link>
                </Button>
                <Button variant="outline" size="lg" className="border-border/60" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
              </>
            ) : (
              <Button className="shadow-glow" size="lg" asChild>
                <Link to={dash}>Go to dashboard</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <Card
              key={f.title}
              className="surface-glow border-cyan-500/10 bg-card/40"
            >
              <CardContent className="space-y-2 p-5">
                <h2 className="font-medium text-foreground">{f.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  FALLBACK_DUMMY_APPROVALS,
  fetchPendingApprovals,
} from "../../services/MiddlePerson/ApprovalAPI";

function matchesSearch(row, q) {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return [
    row.reviewerLabel,
    row.reviewerSubtext,
    row.requestOwner,
    row.category,
    row.status,
    String(row.amountInCompanyCurrency),
    row.amountOriginal,
  ]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(s));
}

export default function ApprovalDashboard() {
  const [rows, setRows] = useState(FALLBACK_DUMMY_APPROVALS);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchPendingApprovals();
        if (!cancelled && data.length > 0) {
          setRows(data);
        }
      } catch (e) {
        console.error("fetchPendingApprovals:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => matchesSearch(r, search)),
    [rows, search]
  );

  const paddedRows = useMemo(() => {
    const minRows = 4;
    const out = [...filtered];
    while (out.length < minRows) {
      out.push({ _empty: true, id: `empty-${out.length}` });
    }
    return out;
  }, [filtered]);

  return (
    <div className="page-shell text-foreground">
      <Card className="surface-glow mx-auto max-w-7xl border-cyan-500/15">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Approvals to review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <Input
            type="search"
            placeholder="Search by owner, category, status, amount…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 max-w-2xl bg-background/80"
          />

          <div
            className="overflow-x-auto rounded-lg border border-border/60 bg-card/40"
            aria-busy={loading}
          >
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    scope="col"
                  >
                    &nbsp;
                  </th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    scope="col"
                  >
                    Request Owner
                  </th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    scope="col"
                  >
                    Category
                  </th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    scope="col"
                  >
                    Request Status
                  </th>
                  <th
                    className="px-4 py-3 font-medium text-muted-foreground"
                    scope="col"
                  >
                    Total amount (in company&apos;s currency)
                  </th>
                  <th
                    className="px-4 py-3 text-center font-medium text-muted-foreground"
                    scope="col"
                    colSpan={2}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paddedRows.map((row, idx) => {
                  if (row._empty) {
                    return (
                      <tr
                        key={`pad-${idx}`}
                        className="border-b border-border bg-muted/20"
                      >
                        <td className="px-4 py-8" colSpan={7} />
                      </tr>
                    );
                  }
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-4 align-top">
                        <div className="inline-flex flex-col gap-1">
                          <Badge
                            className={cn(
                              "max-w-[11rem] justify-center border-0 px-3 py-1.5 text-center text-xs font-medium text-white shadow-sm",
                              "bg-violet-600 hover:bg-violet-600 focus-visible:ring-violet-500/40"
                            )}
                          >
                            {row.reviewerLabel}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {row.reviewerSubtext}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">{row.requestOwner}</td>
                      <td className="px-4 py-4 align-top">{row.category}</td>
                      <td className="px-4 py-4 align-top">{row.status}</td>
                      <td className="px-4 py-4 align-top">
                        <span className="text-destructive">
                          {row.amountOriginal} {row.conversionNote}
                        </span>
                        <span className="text-foreground">
                          {" "}
                          = {row.amountInCompanyCurrency}
                        </span>
                      </td>
                      <td className="px-2 py-4 align-top">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
                          asChild
                        >
                          <Link
                            to={`/manager/approve/${row.id}?intent=approve`}
                          >
                            Approve
                          </Link>
                        </Button>
                      </td>
                      <td className="px-2 py-4 align-top">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                          asChild
                        >
                          <Link
                            to={`/manager/approve/${row.id}?intent=reject`}
                          >
                            Reject
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

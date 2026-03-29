import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createCompany } from "@/services/admin/companyApi";
import { fetchCountries } from "@/services/admin/countriesApi";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DashboardSidebar from "../../components/layout/DashboardSidebar";
import { adminSidebarItems } from "../../lib/dashboard-nav";

const selectClass = cn(
  "flex h-8 w-full min-w-0 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-sm text-white",
  "outline-none transition-all duration-200 focus-visible:border-cyan-500/50 focus-visible:ring-3 focus-visible:ring-cyan-400/35",
);

export default function CreateCompany() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCountries(true);
      try {
        const list = await fetchCountries();
        if (!cancelled) setCountries(list);
      } catch {
        if (!cancelled) toast.error("Could not load countries.");
      } finally {
        if (!cancelled) setLoadingCountries(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!country) return;
    const row = countries.find((c) => c.name === country);
    if (row?.currencyCode) {
      setCurrency(row.currencyCode);
    }
  }, [country, countries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Company name is required.");
      return;
    }
    if (!country) {
      toast.error("Select a country.");
      return;
    }
    if (!currency.trim()) {
      toast.error("Currency is required.");
      return;
    }
    setSubmitting(true);
    try {
      await createCompany({
        name: name.trim(),
        country,
        baseCurrency: currency.trim().toUpperCase(),
      });
      toast.success("Company created.");
      setName("");
      setCountry("");
      setCurrency("");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Could not create company.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout sidebar={<DashboardSidebar items={adminSidebarItems} />}>
      <Card className="mx-auto max-w-lg border-white/10 bg-neutral-950/70 shadow-glow-inset backdrop-blur-sm transition-all duration-200 hover:border-cyan-500/25">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-xl font-bold text-white">
            Create company
          </CardTitle>
          <p className="text-sm text-gray-400">
            Set the legal name, country, and reimbursement currency for the
            organization.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-gray-300">
                Company name
              </Label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-country" className="text-gray-300">
                Country
              </Label>
              <select
                id="company-country"
                className={selectClass}
                value={country}
                disabled={submitting || loadingCountries}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">
                  {loadingCountries ? "Loading countries…" : "Select country"}
                </option>
                {countries.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-currency" className="text-gray-300">
                Currency
              </Label>
              <Input
                id="company-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="INR"
                maxLength={8}
                disabled={submitting}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                ISO code (e.g. USD, INR). Prefilled from country when possible.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full shadow-glow-sm sm:w-auto"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create company"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

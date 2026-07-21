import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Transaction } from "@/types/database";

type MiniProfile = { id: string; full_name: string; company_name: string | null };

type TxnRow = Transaction & {
  project_title: string | null;
  business: MiniProfile | null;
  expert: MiniProfile | null;
};

const businessName = (t: TxnRow) =>
  t.business?.company_name || t.business?.full_name || "—";

const AdminTransactions = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async (): Promise<TxnRow[]> => {
      const { data: txns, error } = await supabase
        .from("transactions")
        .select("*, projects(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (txns ?? []) as (Transaction & { projects: { title: string } | null })[];

      const ids = Array.from(
        new Set(list.flatMap((t) => [t.business_id, t.expert_id]).filter(Boolean))
      ) as string[];
      let byId: Record<string, MiniProfile> = {};
      if (ids.length) {
        const { data: profs, error: pErr } = await supabase
          .from("profiles")
          .select("id, full_name, company_name")
          .in("id", ids);
        if (pErr) throw pErr;
        byId = Object.fromEntries((profs ?? []).map((p) => [p.id, p as MiniProfile]));
      }

      return list.map((t) => ({
        ...t,
        project_title: t.projects?.title ?? null,
        business: t.business_id ? byId[t.business_id] ?? null : null,
        expert: t.expert_id ? byId[t.expert_id] ?? null : null,
      }));
    },
  });

  const statusOptions = useMemo(() => {
    const set = new Set((rows ?? []).map((r) => r.status));
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    return (rows ?? []).filter((r) => {
      const day = r.created_at.slice(0, 10); // yyyy-mm-dd
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      if (status !== "all" && r.status !== status) return false;
      return true;
    });
  }, [rows, fromDate, toDate, status]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => ({
          total: acc.total + Number(r.total_amount),
          earnings: acc.earnings + Number(r.platform_earnings),
          payout: acc.payout + Number(r.expert_payout),
        }),
        { total: 0, earnings: 0, payout: 0 }
      ),
    [filtered]
  );

  const handleExport = () => {
    const headers = [
      "Date",
      "Project",
      "Business",
      "Expert",
      "Total amount",
      "Commission %",
      "Platform earnings",
      "Expert payout",
      "Status",
    ];
    const data = filtered.map((r) => [
      format(parseISO(r.created_at), "yyyy-MM-dd"),
      r.project_title ?? "",
      businessName(r),
      r.expert?.full_name ?? "",
      Number(r.total_amount),
      Number(r.commission_percent),
      Number(r.platform_earnings),
      Number(r.expert_payout),
      r.status,
    ]);
    downloadCsv(`exeleris-transactions-${format(new Date(), "yyyy-MM-dd")}`, headers, data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transactions</h2>
          <p className="text-muted-foreground">
            Every accepted bid, with the exact commission recorded at the time.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!filtered.length}
        >
          <Download className="w-4 h-4 mr-2" />
          Download (CSV)
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-date">From</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(fromDate || toDate || status !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setStatus("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Expert</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Platform earnings</TableHead>
                    <TableHead className="text-right">Expert payout</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                        {rows && rows.length > 0
                          ? "No transactions match your filters."
                          : "No transactions yet. They appear here when a business accepts a bid."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filtered.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {format(parseISO(r.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-medium text-foreground max-w-[220px] truncate">
                            {r.project_title ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{businessName(r)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.expert?.full_name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                            {formatCurrency(r.total_amount)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {Number(r.commission_percent)}%
                          </TableCell>
                          <TableCell className="text-right font-medium text-accent">
                            {formatCurrency(r.platform_earnings)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(r.expert_payout)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals */}
                      <TableRow className="bg-secondary/60 font-semibold hover:bg-secondary/60">
                        <TableCell colSpan={4} className="text-foreground">
                          Totals ({filtered.length})
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          {formatCurrency(totals.total)}
                        </TableCell>
                        <TableCell />
                        <TableCell className="text-right text-accent">
                          {formatCurrency(totals.earnings)}
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          {formatCurrency(totals.payout)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminTransactions;

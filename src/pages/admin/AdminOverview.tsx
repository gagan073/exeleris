import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { endOfWeek, format, parseISO, startOfWeek, subWeeks } from "date-fns";
import {
  Briefcase,
  Coins,
  Gavel,
  Loader2,
  type LucideIcon,
  PiggyBank,
  Timer,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface WeekBucket {
  label: string;
  projects: number;
  deals: number;
}

const within = (iso: string, start: Date, end: Date) => {
  const d = parseISO(iso);
  return d >= start && d <= end;
};

const buildWeeklyActivity = (
  projects: { created_at: string }[],
  txns: { created_at: string }[]
): WeekBucket[] => {
  // Reference "now" without Date.now() surprises — a plain new Date() is fine here.
  const now = new Date();
  const weeks: WeekBucket[] = [];
  for (let i = 7; i >= 0; i--) {
    const ref = subWeeks(now, i);
    const start = startOfWeek(ref, { weekStartsOn: 1 });
    const end = endOfWeek(ref, { weekStartsOn: 1 });
    weeks.push({
      label: format(start, "MMM d"),
      projects: projects.filter((p) => within(p.created_at, start, end)).length,
      deals: txns.filter((t) => within(t.created_at, start, end)).length,
    });
  }
  return weeks;
};

const StatCard = ({
  label,
  value,
  sub,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  highlight?: boolean;
}) => (
  <Card className={cn(highlight && "border-accent/50 bg-accent/5")}>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              "text-3xl font-bold mt-1",
              highlight ? "text-accent" : "text-foreground"
            )}
          >
            {value}
          </p>
          {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
        </div>
        <Icon className={cn("w-8 h-8 shrink-0", highlight ? "text-accent" : "text-muted-foreground")} />
      </div>
    </CardContent>
  </Card>
);

const AdminOverview = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [profilesRes, projectsRes, bidsRes, txnsRes] = await Promise.all([
        supabase.from("profiles").select("role"),
        supabase.from("projects").select("status, created_at"),
        supabase.from("bids").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("total_amount, platform_earnings, created_at"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (bidsRes.error) throw bidsRes.error;
      if (txnsRes.error) throw txnsRes.error;

      const profiles = (profilesRes.data ?? []) as { role: string }[];
      const projects = (projectsRes.data ?? []) as { status: string; created_at: string }[];
      const txns = (txnsRes.data ?? []) as {
        total_amount: number;
        platform_earnings: number;
        created_at: string;
      }[];

      return {
        businesses: profiles.filter((p) => p.role === "business").length,
        experts: profiles.filter((p) => p.role === "expert").length,
        totalUsers: profiles.length,
        totalProjects: projects.length,
        inProgress: projects.filter((p) => p.status === "in_progress").length,
        totalBids: bidsRes.count ?? 0,
        acceptedValue: txns.reduce((s, t) => s + Number(t.total_amount), 0),
        earnings: txns.reduce((s, t) => s + Number(t.platform_earnings), 0),
        deals: txns.length,
        weeks: buildWeeklyActivity(projects, txns),
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6 text-muted-foreground">
          Couldn't load the overview. Make sure <code>admin_upgrade.sql</code> has been
          run in Supabase, then refresh.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total users"
          value={data.totalUsers.toLocaleString()}
          sub={`${data.businesses.toLocaleString()} businesses · ${data.experts.toLocaleString()} experts`}
          icon={Users}
        />
        <StatCard
          label="Projects posted"
          value={data.totalProjects.toLocaleString()}
          sub="Includes the sample listings"
          icon={Briefcase}
        />
        <StatCard
          label="In progress"
          value={data.inProgress.toLocaleString()}
          sub="Projects with an accepted expert"
          icon={Timer}
        />
        <StatCard
          label="Total bids"
          value={data.totalBids.toLocaleString()}
          icon={Gavel}
        />
        <StatCard
          label="Value of accepted bids"
          value={formatCurrency(data.acceptedValue)}
          sub={`${data.deals.toLocaleString()} accepted ${data.deals === 1 ? "deal" : "deals"}`}
          icon={Coins}
        />
        <StatCard
          label="Platform commission earnings"
          value={formatCurrency(data.earnings)}
          sub="Your total earnings so far"
          icon={PiggyBank}
          highlight
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity — last 8 weeks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeks} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--secondary))" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "0.875rem" }} />
                <Bar name="Projects posted" dataKey="projects" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar name="Deals accepted" dataKey="deals" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { History, Loader2, Percent } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { CommissionChange } from "@/types/database";

type HistoryRow = CommissionChange & {
  profiles: { full_name: string; email: string } | null;
};

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [pctInput, setPctInput] = useState("");

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-commission"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("commission_percent, updated_at")
        .eq("id", true)
        .maybeSingle();
      if (error) throw error;
      return data as { commission_percent: number; updated_at: string } | null;
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["admin-commission-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_history")
        .select("*, profiles(full_name, email)")
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
  });

  useEffect(() => {
    if (settings) setPctInput(String(settings.commission_percent));
  }, [settings]);

  const current = settings?.commission_percent ?? null;

  const save = useMutation({
    mutationFn: async (percent: number) => {
      const { error } = await supabase.rpc("set_commission_percent", { p_percent: percent });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Commission updated. It applies to all future accepted bids.");
      queryClient.invalidateQueries({ queryKey: ["admin-commission"] });
      queryClient.invalidateQueries({ queryKey: ["admin-commission-history"] });
      // Keep the business-side accept dialog's live % in sync.
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update the commission."),
  });

  const handleSave = () => {
    const value = parseFloat(pctInput);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error("Enter a commission between 0 and 100.");
      return;
    }
    save.mutate(value);
  };

  const unchanged = current != null && parseFloat(pctInput) === current;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">
          Control the platform commission. The rate you set here is applied
          automatically to every future accepted bid across the whole site.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform commission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {settingsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 rounded-lg border bg-accent/5 border-accent/30 p-5">
                <Percent className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Current commission</p>
                  <p className="text-4xl font-bold text-accent">
                    {current != null ? `${current}%` : "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-w-xs">
                <Label htmlFor="commission">New commission (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={pctInput}
                  onChange={(e) => setPctInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a number between 0 and 100.
                </p>
              </div>

              <Button
                variant="accent"
                onClick={handleSave}
                disabled={save.isPending || unchanged || pctInput === ""}
              >
                {save.isPending ? "Saving..." : "Save commission"}
              </Button>
              {unchanged && (
                <p className="text-sm text-muted-foreground">
                  That's already the current rate.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            Change history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-muted-foreground">
              No changes yet. When you change the commission, each change is logged
              here with who made it and when.
            </p>
          ) : (
            <ul className="divide-y">
              {history.map((h) => (
                <li key={h.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">
                      {h.profiles?.full_name || "An administrator"}
                    </span>{" "}
                    <span className="text-muted-foreground">changed the commission</span>{" "}
                    <span className="font-medium text-foreground">
                      {Number(h.old_percent)}% → {Number(h.new_percent)}%
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(h.changed_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;

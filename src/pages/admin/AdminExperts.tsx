import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { BadgeCheck, CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { EXPERIENCE_LEVELS, ExpertProfile, Profile } from "@/types/database";

type PendingExpert = ExpertProfile & {
  profiles: Pick<Profile, "full_name" | "email" | "created_at"> | null;
};

const expLabel = (value: string | null) =>
  EXPERIENCE_LEVELS.find((l) => l.value === value)?.label ?? value ?? "—";

const AdminExperts = () => {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<PendingExpert | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: experts, isLoading } = useQuery({
    queryKey: ["admin-pending-experts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expert_profiles")
        .select("*, profiles(full_name, email, created_at)")
        .eq("approval_status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PendingExpert[];
    },
  });

  const review = useMutation({
    mutationFn: async (vars: { id: string; status: "approved" | "rejected"; reason?: string }) => {
      const { error } = await supabase.rpc("review_expert", {
        p_expert_id: vars.id,
        p_status: vars.status,
        p_reason: vars.reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.status === "approved" ? "Expert approved." : "Expert rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-experts"] });
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: (e: Error) => toast.error(e.message || "Could not update the expert."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Expert approvals</h2>
        <p className="text-muted-foreground">
          Experts waiting for review. Only approved experts can place bids.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !experts || experts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-1">
              No experts waiting for approval
            </h3>
            <p className="text-muted-foreground">
              New expert applications will show up here for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {experts.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">
                      {e.profiles?.full_name || "Unnamed applicant"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {e.profiles?.email}
                      {e.profiles?.created_at &&
                        ` · applied ${format(parseISO(e.profiles.created_at), "MMM d, yyyy")}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {e.headline && (
                  <p className="text-foreground font-medium">{e.headline}</p>
                )}

                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Profession</p>
                    <p className="text-foreground font-medium">{e.professional_type || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">License number</p>
                    <p className="text-foreground font-medium">{e.license_number || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Experience</p>
                    <p className="text-foreground font-medium">{expLabel(e.years_experience)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {e.categories.length ? (
                      e.categories.map((c) => (
                        <Badge key={c} variant="secondary">
                          {c}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None listed</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {e.skills.length ? (
                      e.skills.map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None listed</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {e.manifesto_agreed_at ? (
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <BadgeCheck className="w-4 h-4" />
                      Agreed to the Transparency Manifesto on{" "}
                      {format(parseISO(e.manifesto_agreed_at), "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Manifesto agreement not recorded (signed up before this step).
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 pt-2 border-t">
                  <Button
                    variant="accent"
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: e.id, status: "approved" })}
                  >
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    disabled={review.isPending}
                    onClick={() => {
                      setRejectReason("");
                      setRejectTarget(e);
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reject {rejectTarget?.profiles?.full_name || "this applicant"}?
            </DialogTitle>
            <DialogDescription>
              Add an optional reason. It's sent to the expert as a notification so
              they know why.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. We couldn't verify your license number. Please reapply with valid credentials."
              className="min-h-[100px]"
              value={rejectReason}
              onChange={(ev) => setRejectReason(ev.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={review.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={review.isPending}
              onClick={() =>
                rejectTarget &&
                review.mutate({
                  id: rejectTarget.id,
                  status: "rejected",
                  reason: rejectReason.trim() || undefined,
                })
              }
            >
              {review.isPending ? "Rejecting..." : "Reject application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminExperts;

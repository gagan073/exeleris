import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  Clock,
  DollarSign,
  Star,
  TrendingDown,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BidStatusBadge, ProjectStatusBadge } from "@/components/StatusBadge";
import { ReadMore } from "@/components/ReadMore";
import { AcceptBidDialog } from "@/components/AcceptBidDialog";
import { DeclineBidDialog } from "@/components/DeclineBidDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatCurrency, pricePerHour } from "@/lib/format";
import { Bid, Project } from "@/types/database";

type SortKey = "cheapest" | "fewest_hours" | "newest";

const BidComparison = () => {
  const { projectId } = useParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<SortKey>("cheapest");
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<Bid | null>(null);
  const [declineTarget, setDeclineTarget] = useState<Bid | null>(null);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project-detail", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();
      if (error) throw error;
      return (data as Project) ?? null;
    },
  });

  const { data: bids, isLoading: bidsLoading } = useQuery({
    queryKey: ["comparison-bids", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Bid[];
    },
  });

  const expertIds = useMemo(
    () => [...new Set((bids ?? []).map((b) => b.expert_id))],
    [bids]
  );

  const { data: expertMap } = useQuery({
    queryKey: ["bid-experts", projectId, expertIds.join(",")],
    enabled: expertIds.length > 0,
    queryFn: async () => {
      const [{ data: profs, error: e1 }, { data: eps, error: e2 }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", expertIds),
        supabase.from("expert_profiles").select("id, headline").in("id", expertIds),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const headlineById: Record<string, string | null> = {};
      (eps ?? []).forEach((r: { id: string; headline: string | null }) => {
        headlineById[r.id] = r.headline;
      });
      const map: Record<string, { name: string; headline: string | null }> = {};
      (profs ?? []).forEach((p: { id: string; full_name: string }) => {
        map[p.id] = { name: p.full_name || "Expert", headline: headlineById[p.id] ?? null };
      });
      return map;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["comparison-bids", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
    queryClient.invalidateQueries({ queryKey: ["business-bid-counts", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["business-projects", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["published-projects"] });
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  const shortlistMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const { error } = await supabase.rpc("set_bid_status", {
        p_bid_id: bidId,
        p_status: "shortlisted",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bid shortlisted.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || "Could not shortlist the bid."),
  });

  const isOwner = !!user && project?.business_id === user.id;
  const isAdmin = profile?.role === "super_admin";
  const isOpen = project?.status === "published";

  // Cheapest among still-live bids (only meaningful while choosing).
  const cheapestId = useMemo(() => {
    const active = (bids ?? []).filter(
      (b) => b.status === "pending" || b.status === "shortlisted"
    );
    if (active.length < 2) return null;
    return active.reduce((min, b) => (b.bid_amount < min.bid_amount ? b : min), active[0]).id;
  }, [bids]);

  const visibleBids = useMemo(() => {
    let list = (bids ?? []).filter((b) => b.status !== "withdrawn");
    if (shortlistedOnly) list = list.filter((b) => b.status === "shortlisted");
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === "cheapest") return a.bid_amount - b.bid_amount;
      if (sortBy === "fewest_hours") return a.estimated_hours - b.estimated_hours;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return sorted;
  }, [bids, shortlistedOnly, sortBy]);

  const loading = projectLoading || bidsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Projects
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !project || (!isOwner && !isAdmin) ? (
            <Card className="max-w-xl mx-auto">
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Bids not available
                </h2>
                <p className="text-muted-foreground mb-6">
                  This project doesn't exist, or you don't have access to its bids.
                </p>
                <Button asChild>
                  <Link to="/dashboard">Back to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Project header */}
              <div className="mb-8">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <ProjectStatusBadge status={project.status} />
                  <span className="text-sm text-muted-foreground">{project.category}</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
                <p className="text-muted-foreground mt-2">
                  Budget {formatCurrency(project.budget_min)} – {formatCurrency(project.budget_max)}
                  {" · "}
                  {visibleBids.length} {visibleBids.length === 1 ? "bid" : "bids"} to compare
                </p>
              </div>

              {(bids ?? []).length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-12 text-center">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      No bids yet
                    </h3>
                    <p className="text-muted-foreground">
                      As soon as experts bid on this project, you'll be able to
                      compare them side by side here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="sort" className="text-sm text-muted-foreground">
                        Sort by
                      </Label>
                      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                        <SelectTrigger id="sort" className="w-[190px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cheapest">Cheapest first</SelectItem>
                          <SelectItem value="fewest_hours">Fewest hours first</SelectItem>
                          <SelectItem value="newest">Newest first</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="shortlisted-only"
                        checked={shortlistedOnly}
                        onCheckedChange={setShortlistedOnly}
                      />
                      <Label htmlFor="shortlisted-only" className="text-sm">
                        Show shortlisted only
                      </Label>
                    </div>
                  </div>

                  {visibleBids.length === 0 ? (
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-10 text-center text-muted-foreground">
                        No shortlisted bids yet. Turn off the filter to see all bids.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                      {visibleBids.map((bid) => {
                        const expert = expertMap?.[bid.expert_id];
                        const isCheapest = bid.id === cheapestId;
                        const canAct =
                          isOwner &&
                          isOpen &&
                          (bid.status === "pending" || bid.status === "shortlisted");
                        return (
                          <Card
                            key={bid.id}
                            className={
                              isCheapest
                                ? "border-2 border-accent shadow-accent"
                                : "border"
                            }
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <BidStatusBadge status={bid.status} />
                                {isCheapest && (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                                    <TrendingDown className="w-3.5 h-3.5" />
                                    Lowest price
                                  </span>
                                )}
                              </div>
                              <p className="text-lg font-bold text-foreground leading-tight">
                                {expert?.name ?? "Expert"}
                              </p>
                              {expert?.headline && (
                                <p className="text-sm text-muted-foreground">
                                  {expert.headline}
                                </p>
                              )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Money + time */}
                              <div className="rounded-lg bg-muted/30 p-3 space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <DollarSign className="w-4 h-4" /> Price
                                  </span>
                                  <span className="text-lg font-bold text-foreground">
                                    {formatCurrency(bid.bid_amount)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="w-4 h-4" /> Hours
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {Number(bid.estimated_hours).toLocaleString()} hrs
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Price / hour</span>
                                  <span className="font-medium text-foreground">
                                    {pricePerHour(
                                      Number(bid.bid_amount),
                                      Number(bid.estimated_hours)
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <CalendarClock className="w-4 h-4" /> Completes
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {bid.estimated_completion_date
                                      ? format(
                                          parseISO(bid.estimated_completion_date),
                                          "MMM d, yyyy"
                                        )
                                      : "—"}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                                  Approach
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <ReadMore text={bid.approach} />
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                                  Experience
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <ReadMore text={bid.experience} />
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                                  Questions
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <ReadMore text={bid.questions} />
                                </p>
                              </div>

                              {canAct && (
                                <div className="flex flex-wrap gap-2 pt-3 border-t">
                                  <Button
                                    variant="accent"
                                    size="sm"
                                    onClick={() => setAcceptTarget(bid)}
                                  >
                                    Accept
                                  </Button>
                                  {bid.status !== "shortlisted" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={shortlistMutation.isPending}
                                      onClick={() => shortlistMutation.mutate(bid.id)}
                                    >
                                      <Star className="w-4 h-4 mr-1" />
                                      Shortlist
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeclineTarget(bid)}
                                  >
                                    Decline
                                  </Button>
                                </div>
                              )}

                              {bid.status === "declined" && bid.decline_reason && (
                                <p className="text-xs text-muted-foreground pt-2 border-t">
                                  <span className="font-medium text-foreground">Reason: </span>
                                  {bid.decline_reason}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <AcceptBidDialog
        open={!!acceptTarget}
        onOpenChange={(open) => !open && setAcceptTarget(null)}
        bidId={acceptTarget?.id ?? null}
        amount={Number(acceptTarget?.bid_amount ?? 0)}
        expertName={
          (acceptTarget && expertMap?.[acceptTarget.expert_id]?.name) || "this expert"
        }
        onAccepted={refresh}
      />
      <DeclineBidDialog
        open={!!declineTarget}
        onOpenChange={(open) => !open && setDeclineTarget(null)}
        bidId={declineTarget?.id ?? null}
        expertName={
          (declineTarget && expertMap?.[declineTarget.expert_id]?.name) || "this expert"
        }
        onDeclined={refresh}
      />
    </div>
  );
};

export default BidComparison;

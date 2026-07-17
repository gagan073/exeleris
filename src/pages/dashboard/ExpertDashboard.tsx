import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Briefcase, Building, Clock, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BidStatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatCurrency, pricePerHour } from "@/lib/format";
import { Bid, Project } from "@/types/database";

type BidWithProject = Bid & {
  projects: Pick<Project, "title" | "category" | "company_name" | "status"> | null;
};

const ExpertDashboard = () => {
  const { user, expertProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: bids, isLoading } = useQuery({
    queryKey: ["expert-bids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids")
        .select("*, projects(title, category, company_name, status)")
        .eq("expert_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BidWithProject[];
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const { error } = await supabase.rpc("withdraw_bid", { p_bid_id: bidId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bid withdrawn.");
      queryClient.invalidateQueries({ queryKey: ["expert-bids", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not withdraw the bid."),
  });

  const activeProjects = (bids ?? []).filter((b) => b.status === "accepted");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-foreground">My Bids</h1>
              <p className="text-xl text-muted-foreground mt-2">
                Track your proposals and find new work
              </p>
            </div>
            <Link to="/jobs">
              <Button variant="accent" size="lg">
                Browse Jobs
              </Button>
            </Link>
          </div>

          {expertProfile?.approval_status === "pending" && (
            <Card className="bg-accent/10 border-accent/20 mb-8">
              <CardContent className="flex gap-3 items-start pt-6">
                <Clock className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    Your expert application is being reviewed
                  </p>
                  <p className="text-muted-foreground">
                    You can browse available jobs now and start bidding as soon
                    as our team approves your profile — usually within 24-48
                    hours.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {expertProfile?.approval_status === "rejected" && (
            <Card className="bg-muted border-border mb-8">
              <CardContent className="flex gap-3 items-start pt-6">
                <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    Your expert application wasn't approved this time
                  </p>
                  <p className="text-muted-foreground">
                    Please contact support if you have questions or would like
                    to provide additional credentials for another review.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Projects — jobs this expert has won */}
          {activeProjects.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Rocket className="w-5 h-5 text-accent" />
                <h2 className="text-2xl font-bold text-foreground">Active Projects</h2>
              </div>
              <div className="grid gap-4">
                {activeProjects.map((bid) => (
                  <Card key={bid.id} className="border-accent/30 bg-accent/5">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="default" className="bg-accent text-accent-foreground">
                            Won
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {bid.projects?.company_name}
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {bid.projects?.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your fee: {formatCurrency(bid.bid_amount)} ·{" "}
                          {Number(bid.estimated_hours).toLocaleString()} hrs
                        </p>
                      </div>
                      <Button asChild variant="outline">
                        <Link to={`/job/${bid.project_id}`}>View project</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold text-foreground mb-4">All Bids</h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin border-4 border-primary border-t-transparent rounded-full w-8 h-8" />
            </div>
          ) : !bids || bids.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                You haven't submitted any bids yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Browse open projects and submit your first proposal to start
                winning work.
              </p>
              <Link to="/jobs">
                <Button variant="accent" size="lg">
                  Browse Jobs
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-6">
              {bids.map((bid) => (
                <Card key={bid.id} className="hover:shadow-card transition-all duration-300">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {bid.projects?.category && (
                        <Badge variant="default" className="bg-accent text-accent-foreground">
                          {bid.projects.category}
                        </Badge>
                      )}
                      <BidStatusBadge status={bid.status} />
                    </div>
                    <CardTitle className="text-xl">
                      <Link
                        to={`/job/${bid.project_id}`}
                        className="hover:text-accent transition-colors"
                      >
                        {bid.projects?.title ?? "Project"}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      {bid.projects?.company_name && (
                        <span className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {bid.projects.company_name}
                        </span>
                      )}
                      <span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(bid.bid_amount)}
                        </span>{" "}
                        · {Number(bid.estimated_hours).toLocaleString()} hrs ·{" "}
                        {pricePerHour(Number(bid.bid_amount), Number(bid.estimated_hours))}
                      </span>
                      <span>
                        Submitted{" "}
                        {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {bid.status === "declined" && bid.decline_reason && (
                      <p className="text-sm text-muted-foreground mt-3">
                        <span className="font-medium text-foreground">Reason: </span>
                        {bid.decline_reason}
                      </p>
                    )}

                    {bid.status === "pending" && (
                      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                        <Button asChild variant="accent" size="sm">
                          <Link to={`/job/${bid.project_id}/bid`}>Edit bid</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={withdrawMutation.isPending}
                          onClick={() => {
                            if (window.confirm("Withdraw this bid? This cannot be undone.")) {
                              withdrawMutation.mutate(bid.id);
                            }
                          }}
                        >
                          Withdraw
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard;

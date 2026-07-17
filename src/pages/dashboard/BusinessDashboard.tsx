import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Clock, DollarSign, FolderOpen, Users } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";
import { Project } from "@/types/database";

const BusinessDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["business-projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("business_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });

  // RLS scopes this to bids on the current business's own projects, so a plain
  // select returns exactly what we need to count.
  const { data: bidRows } = useQuery({
    queryKey: ["business-bid-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("bids").select("project_id, status");
      if (error) throw error;
      return (data ?? []) as { project_id: string; status: string }[];
    },
  });

  const bidCountByProject = useMemo(() => {
    const counts: Record<string, number> = {};
    (bidRows ?? []).forEach((b) => {
      if (b.status === "withdrawn") return; // don't count pulled bids
      counts[b.project_id] = (counts[b.project_id] ?? 0) + 1;
    });
    return counts;
  }, [bidRows]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["business-projects", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["published-projects"] });
  };

  const publishMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: "published" })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project published to the marketplace!");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || "Could not publish. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project deleted");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete. Please try again."),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-foreground">My Projects</h1>
              <p className="text-xl text-muted-foreground mt-2">
                Manage your projects and review the bids they receive
              </p>
            </div>
            <Link to="/submit-project">
              <Button variant="accent" size="lg">
                Post a Project
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin border-4 border-primary border-t-transparent rounded-full w-8 h-8" />
            </div>
          ) : !projects || projects.length === 0 ? (
            <Card className="p-12 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                You haven't posted any projects yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Post your first project and vetted experts will bid to finish
                what AI started.
              </p>
              <Link to="/submit-project">
                <Button variant="accent" size="lg">
                  Post Your First Project
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-6">
              {projects.map((project) => {
                const bidCount = bidCountByProject[project.id] ?? 0;
                const canDelete =
                  project.status === "draft" || project.status === "published";
                return (
                  <Card
                    key={project.id}
                    className="hover:shadow-card transition-all duration-300"
                  >
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="default" className="bg-accent text-accent-foreground">
                          {project.category}
                        </Badge>
                        <ProjectStatusBadge status={project.status} />
                        <Badge variant="outline">
                          {project.completion_percent}% Complete
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">
                        <Link
                          to={`/job/${project.id}`}
                          className="hover:text-accent transition-colors"
                        >
                          {project.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(project.budget_min)} – {formatCurrency(project.budget_max)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {project.deadline
                            ? format(parseISO(project.deadline), "MMM d, yyyy")
                            : "Flexible"}
                        </span>
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          <Users className="w-4 h-4 text-accent" />
                          {bidCount} {bidCount === 1 ? "bid" : "bids"} received
                        </span>
                        <span>
                          Posted{" "}
                          {formatDistanceToNow(new Date(project.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                        {project.status !== "draft" && (
                          <Button asChild variant="accent" size="sm">
                            <Link to={`/project/${project.id}/bids`}>
                              Compare bids{bidCount > 0 ? ` (${bidCount})` : ""}
                            </Link>
                          </Button>
                        )}
                        {project.status === "draft" && (
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => publishMutation.mutate(project.id)}
                            disabled={publishMutation.isPending}
                          >
                            Publish to Marketplace
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Delete this project? This cannot be undone."
                                )
                              ) {
                                deleteMutation.mutate(project.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;

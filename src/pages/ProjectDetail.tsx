import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { ProjectStatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, deadlineText } from "@/lib/format";
import { Bid, Project, ProjectFile } from "@/types/database";
import {
  ArrowLeft,
  Building,
  Clock,
  DollarSign,
  FileText,
  Lock,
  Briefcase,
  CheckCircle,
} from "lucide-react";

const ProjectDetail = () => {
  const { jobId } = useParams();
  const { user, profile, expertProfile } = useAuth();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project-detail", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();
      if (error) throw error;
      return (data as Project) ?? null;
    },
  });

  const { data: projectFiles } = useQuery({
    queryKey: ["project-detail-files", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", jobId);
      if (error) throw error;
      return (data as ProjectFile[]) ?? [];
    },
  });

  // Does this expert already have a bid on this project?
  const { data: existingBid } = useQuery({
    queryKey: ["my-bid", jobId, user?.id],
    enabled: !!jobId && !!user && profile?.role === "expert",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids")
        .select("*")
        .eq("project_id", jobId)
        .eq("expert_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as Bid) ?? null;
    },
  });

  const openFile = async (file: ProjectFile) => {
    const { data, error } = await supabase.storage
      .from("project-files")
      .createSignedUrl(file.storage_path, 3600);
    if (error || !data?.signedUrl) {
      toast.error("Could not open the file. Please try again.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const isOpen = project?.status === "published";
  const isOwner = !!user && project?.business_id === user.id;
  const role = profile?.role;

  const renderCta = () => {
    if (!project) return null;

    // Business viewing
    if (role === "business") {
      if (isOwner) {
        return (
          <div className="space-y-3">
            <p className="text-muted-foreground">This is your project.</p>
            <Button asChild variant="accent" size="lg" className="w-full">
              <Link to={`/project/${project.id}/bids`}>Compare bids</Link>
            </Button>
          </div>
        );
      }
      return (
        <p className="text-muted-foreground">
          Businesses can't bid on projects. Only vetted experts can submit bids.
        </p>
      );
    }

    // Super admin viewing
    if (role === "super_admin") {
      return (
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to={`/project/${project.id}/bids`}>View bids</Link>
        </Button>
      );
    }

    // Expert viewing
    if (role === "expert") {
      if (existingBid) {
        return (
          <div className="space-y-3">
            <p className="text-muted-foreground">
              You've already submitted a bid on this project.
            </p>
            <Button asChild variant="accent" size="lg" className="w-full">
              <Link to={`/job/${project.id}/bid`}>View your bid</Link>
            </Button>
          </div>
        );
      }
      if (!isOpen) {
        return (
          <p className="text-muted-foreground">
            This project is no longer open for bids.
          </p>
        );
      }
      if (expertProfile?.approval_status !== "approved") {
        return (
          <p className="text-muted-foreground">
            {expertProfile?.approval_status === "rejected"
              ? "Your expert application wasn't approved, so you can't submit bids."
              : "You'll be able to bid as soon as our team approves your expert profile."}
          </p>
        );
      }
      return (
        <Button asChild variant="accent" size="lg" className="w-full">
          <Link to={`/job/${project.id}/bid`}>Submit Bid</Link>
        </Button>
      );
    }

    // Logged out — send to sign-in, then back to the bid form.
    return (
      <Button asChild variant="accent" size="lg" className="w-full">
        <Link to="/auth" state={{ from: { pathname: `/job/${project.id}/bid` } }}>
          Sign in to bid
        </Link>
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Job Board
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !project ? (
            <Card className="max-w-xl mx-auto">
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  This project isn't available
                </h2>
                <p className="text-muted-foreground mb-6">
                  It may have been removed by the client or is no longer public.
                </p>
                <Button asChild>
                  <Link to="/jobs">Back to Job Board</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="default" className="bg-accent text-accent-foreground">
                        {project.category}
                      </Badge>
                      <Badge variant="outline" className="border-accent/30 text-accent">
                        {project.completion_percent}% Complete
                      </Badge>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <CardTitle className="text-2xl text-foreground">{project.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                      <span className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {project.company_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(project.budget_min)} – {formatCurrency(project.budget_max)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {deadlineText(project.deadline)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Project Description</h4>
                      <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {project.skills?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {project.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {project.ai_tools?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Allowed AI Tools</h4>
                        <div className="flex flex-wrap gap-1">
                          {project.ai_tools.map((tool, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Documents</h4>
                      {!projectFiles || projectFiles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No documents attached to this project.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {projectFiles.map((file) =>
                            file.is_confidential ? (
                              <div
                                key={file.id}
                                className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <span className="text-sm text-muted-foreground truncate">
                                    {file.file_name}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  Available after your bid is accepted
                                </span>
                              </div>
                            ) : (
                              <button
                                key={file.id}
                                type="button"
                                onClick={() => openFile(file)}
                                className="flex items-center gap-2 text-sm text-accent hover:underline"
                              >
                                <FileText className="w-4 h-4" />
                                {file.file_name}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar CTA */}
              <div className="space-y-6">
                <Card className="lg:sticky lg:top-24">
                  <CardHeader>
                    <CardTitle className="text-lg">Ready to work on this?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Client budget</p>
                      <p className="text-2xl font-bold text-accent">
                        {formatCurrency(project.budget_min)} – {formatCurrency(project.budget_max)}
                      </p>
                    </div>
                    {project.deadline && (
                      <p className="text-sm text-muted-foreground text-center">
                        Desired completion: {format(parseISO(project.deadline), "MMM d, yyyy")}
                      </p>
                    )}
                    {renderCta()}
                    <div className="pt-4 border-t space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        Transparent, milestone-based work
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        Vetted experts only
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;

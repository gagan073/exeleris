import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Project, ProjectFile } from "@/types/database";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle,
  Building,
  Briefcase,
  FileText,
} from "lucide-react";

const getDueText = (deadline: string | null) => {
  if (!deadline) return "Flexible deadline";
  const days = differenceInCalendarDays(parseISO(deadline), new Date());
  if (days <= 0) return "Due today";
  if (days === 1) return "Due in 1 day";
  return `Due in ${days} days`;
};

const SubmitBid = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, expertProfile } = useAuth();

  const [hourlyRate, setHourlyRate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [completionTime, setCompletionTime] = useState("");
  const [approach, setApproach] = useState("");
  const [experience, setExperience] = useState("");
  const [questions, setQuestions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", jobId)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return (data as Project) ?? null;
    },
    enabled: !!jobId,
  });

  const { data: projectFiles } = useQuery({
    queryKey: ["project-files", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", jobId);
      if (error) throw error;
      return (data as ProjectFile[]) ?? [];
    },
    enabled: !!jobId,
  });

  const totalCost =
    hourlyRate && estimatedHours
      ? (parseFloat(hourlyRate) * parseFloat(estimatedHours)).toFixed(2)
      : "0.00";

  const isApproved = expertProfile?.approval_status === "approved";
  const isRejected = expertProfile?.approval_status === "rejected";

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

  const handleSubmit = async () => {
    const rate = Number(hourlyRate);
    const hours = Number(estimatedHours);
    if (!rate || rate <= 0) {
      toast.error("Please enter a valid hourly rate.");
      return;
    }
    if (!hours || hours <= 0) {
      toast.error("Please enter valid estimated hours.");
      return;
    }
    if (!project || !user) return;

    setSubmitting(true);
    const { error } = await supabase.from("bids").insert({
      project_id: project.id,
      expert_id: user.id,
      hourly_rate: rate,
      estimated_hours: hours,
      completion_time: completionTime.trim() || null,
      approach: approach.trim() || null,
      experience: experience.trim() || null,
      questions: questions.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already submitted a bid on this project.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Bid submitted! The client will review it shortly.");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <Link to="/jobs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Job Board
            </Link>
          </div>

          {projectLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !project ? (
            <Card className="max-w-xl mx-auto">
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  This project is no longer available
                </h2>
                <p className="text-muted-foreground mb-6">
                  It may have been removed by the client or is no longer accepting bids.
                </p>
                <Button asChild>
                  <Link to="/jobs">Back to Job Board</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8">
              {/* Job Details */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{project.category}</Badge>
                      <Badge variant="outline">{project.completion_percent}% Complete</Badge>
                    </div>
                    <CardTitle className="text-xl text-foreground">
                      {project.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {project.company_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${Number(project.budget_min).toLocaleString()} - ${Number(project.budget_max).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getDueText(project.deadline)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Project Description</h4>
                      <p className="text-muted-foreground">{project.description}</p>
                    </div>

                    {project.ai_tools?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">AI Tools Used</h4>
                        <div className="flex flex-wrap gap-1">
                          {project.ai_tools.map((tool, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {project.skills?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {project.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {projectFiles && projectFiles.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Attached Documents</h4>
                        <div className="space-y-1">
                          {projectFiles.map((file) => (
                            <button
                              key={file.id}
                              type="button"
                              onClick={() => openFile(file)}
                              className="flex items-center gap-2 text-sm text-accent hover:underline"
                            >
                              <FileText className="w-4 h-4" />
                              {file.file_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Bid Form */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Submit Your Bid</CardTitle>
                    <p className="text-muted-foreground">
                      Provide your hourly rate and estimated time to complete this project
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!isApproved ? (
                      <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-foreground">
                              {isRejected
                                ? "Your expert application wasn't approved"
                                : "Your expert application is being reviewed"}
                            </p>
                            <p className="text-muted-foreground mt-1">
                              {isRejected
                                ? "Unfortunately your application was not approved. Please contact support if you believe this is a mistake."
                                : "You'll be able to submit bids as soon as our team approves your profile — usually within 24-48 hours."}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hourly-rate">Hourly Rate (USD)</Label>
                            <Input
                              id="hourly-rate"
                              type="number"
                              placeholder="150"
                              value={hourlyRate}
                              onChange={(e) => setHourlyRate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="estimated-hours">Estimated Hours</Label>
                            <Input
                              id="estimated-hours"
                              type="number"
                              step="0.5"
                              placeholder="8"
                              value={estimatedHours}
                              onChange={(e) => setEstimatedHours(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground">Total Project Cost:</span>
                            <span className="text-2xl font-bold text-accent">${totalCost}</span>
                          </div>
                          {hourlyRate && estimatedHours && (
                            <p className="text-sm text-muted-foreground mt-2">
                              ${hourlyRate}/hour × {estimatedHours} hours = ${totalCost}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="completion-time">Estimated Completion Time</Label>
                          <Input
                            id="completion-time"
                            placeholder="e.g., 2 days, 1 week"
                            value={completionTime}
                            onChange={(e) => setCompletionTime(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="approach">Your Approach</Label>
                          <Textarea
                            id="approach"
                            placeholder="Describe how you'll approach finishing this AI-enhanced deliverable..."
                            className="min-h-[120px]"
                            value={approach}
                            onChange={(e) => setApproach(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="experience">Relevant Experience</Label>
                          <Textarea
                            id="experience"
                            placeholder="Highlight your relevant experience with similar projects..."
                            className="min-h-[100px]"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="questions">Questions/Clarifications</Label>
                          <Textarea
                            id="questions"
                            placeholder="Any questions about the project or additional clarifications needed..."
                            className="min-h-[80px]"
                            value={questions}
                            onChange={(e) => setQuestions(e.target.value)}
                          />
                        </div>

                        <div className="bg-muted/50 border rounded-lg p-4">
                          <h4 className="font-semibold text-foreground mb-2">Exeleris Guarantee</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-accent" />
                              Transparent hourly billing with detailed time tracking
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-accent" />
                              Payment protection through escrow system
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-accent" />
                              Quality guarantee with revision opportunities
                            </li>
                          </ul>
                        </div>

                        <Button
                          size="lg"
                          className="w-full"
                          onClick={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting ? "Submitting..." : "Submit Bid"}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                          The client will review your bid and respond within 24 hours
                        </p>
                      </>
                    )}
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

export default SubmitBid;

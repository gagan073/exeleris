import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { BidStatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, pricePerHour, deadlineText } from "@/lib/format";
import { Bid, Project } from "@/types/database";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  Building,
  Briefcase,
} from "lucide-react";

const SubmitBid = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, expertProfile } = useAuth();

  const [bidAmount, setBidAmount] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [approach, setApproach] = useState("");
  const [experience, setExperience] = useState("");
  const [questions, setQuestions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const prefilled = useRef(false);

  const today = new Date().toISOString().split("T")[0];

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", jobId],
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

  const { data: existingBid, isLoading: bidLoading } = useQuery({
    queryKey: ["my-bid", jobId, user?.id],
    enabled: !!jobId && !!user,
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

  const isOpen = project?.status === "published";
  const isApproved = expertProfile?.approval_status === "approved";
  const isRejected = expertProfile?.approval_status === "rejected";
  // We show the editable form only for a brand-new bid, or when editing a
  // still-Pending bid on an open project.
  const isEditing = !!existingBid && existingBid.status === "pending" && isOpen;
  const showForm = isOpen && isApproved && (!existingBid || isEditing);

  // Prefill the form once when editing an existing pending bid.
  useEffect(() => {
    if (isEditing && existingBid && !prefilled.current) {
      prefilled.current = true;
      setBidAmount(String(existingBid.bid_amount ?? ""));
      setEstimatedHours(String(existingBid.estimated_hours ?? ""));
      setCompletionDate(existingBid.estimated_completion_date ?? "");
      setApproach(existingBid.approach ?? "");
      setExperience(existingBid.experience ?? "");
      setQuestions(existingBid.questions ?? "");
    }
  }, [isEditing, existingBid]);

  const amountNum = parseFloat(bidAmount);
  const hoursNum = parseFloat(estimatedHours);
  const perHour = pricePerHour(amountNum || 0, hoursNum || 0);

  const refreshBidQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["my-bid", jobId, user?.id] });
    queryClient.invalidateQueries({ queryKey: ["expert-bids", user?.id] });
  };

  const handleSubmit = async () => {
    if (!amountNum || amountNum <= 0) {
      toast.error("Please enter your price for the whole job.");
      return;
    }
    if (!hoursNum || hoursNum <= 0) {
      toast.error("Please enter your estimated hours.");
      return;
    }
    if (!project || !user) return;

    const payload = {
      bid_amount: amountNum,
      estimated_hours: hoursNum,
      estimated_completion_date: completionDate || null,
      approach: approach.trim() || null,
      experience: experience.trim() || null,
      questions: questions.trim() || null,
    };

    setSubmitting(true);
    let error;
    if (isEditing && existingBid) {
      ({ error } = await supabase.from("bids").update(payload).eq("id", existingBid.id));
    } else {
      ({ error } = await supabase
        .from("bids")
        .insert({ project_id: project.id, expert_id: user.id, ...payload }));
    }
    setSubmitting(false);

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        toast.error("You've already submitted a bid on this project.");
        refreshBidQueries();
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success(isEditing ? "Your bid was updated." : "Bid submitted! The client will review it shortly.");
    refreshBidQueries();
    navigate("/dashboard");
  };

  const loading = projectLoading || bidLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <Link
              to={jobId ? `/job/${jobId}` : "/jobs"}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to project
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !project && !existingBid ? (
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
              {/* Project recap */}
              <div className="space-y-6">
                {project && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{project.category}</Badge>
                        <Badge variant="outline">{project.completion_percent}% Complete</Badge>
                      </div>
                      <CardTitle className="text-xl text-foreground">{project.title}</CardTitle>
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
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-6 whitespace-pre-line">
                        {project.description}
                      </p>
                      <Link
                        to={`/job/${project.id}`}
                        className="text-sm text-accent hover:underline mt-3 inline-block"
                      >
                        View full project details
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Bid form / status */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{isEditing ? "Edit Your Bid" : "Submit Your Bid"}</CardTitle>
                    <p className="text-muted-foreground">
                      Give the client your price for finishing the whole job.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Already bid (not editable) */}
                    {existingBid && !isEditing ? (
                      <div className="space-y-4">
                        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-foreground">
                              You've already submitted a bid
                            </span>
                            <BidStatusBadge status={existingBid.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {existingBid.status === "accepted"
                              ? "Congratulations — your bid was accepted!"
                              : existingBid.status === "declined"
                                ? "This bid was declined by the client."
                                : existingBid.status === "withdrawn"
                                  ? "You withdrew this bid."
                                  : "The client is reviewing bids on this project."}
                          </p>
                        </div>
                        <div className="rounded-lg border p-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Your price</span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(existingBid.bid_amount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Estimated hours</span>
                            <span className="font-semibold text-foreground">
                              {Number(existingBid.estimated_hours).toLocaleString()} hrs
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Works out to</span>
                            <span className="font-semibold text-foreground">
                              {pricePerHour(
                                Number(existingBid.bid_amount),
                                Number(existingBid.estimated_hours)
                              )}
                            </span>
                          </div>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                          <Link to="/dashboard">Go to My Bids</Link>
                        </Button>
                      </div>
                    ) : !isOpen ? (
                      <div className="bg-muted/50 border rounded-lg p-6 text-center">
                        <p className="text-muted-foreground">
                          This project is no longer open for bids.
                        </p>
                      </div>
                    ) : !isApproved ? (
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
                            <Label htmlFor="bid-amount">Your Price (USD)</Label>
                            <Input
                              id="bid-amount"
                              type="number"
                              min={1}
                              placeholder="1200"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">For the whole job</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="estimated-hours">Estimated Hours</Label>
                            <Input
                              id="estimated-hours"
                              type="number"
                              step="0.5"
                              min={0.5}
                              placeholder="8"
                              value={estimatedHours}
                              onChange={(e) => setEstimatedHours(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">To complete it</p>
                          </div>
                        </div>

                        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground">Works out to:</span>
                            <span className="text-2xl font-bold text-accent">{perHour}</span>
                          </div>
                          {amountNum > 0 && hoursNum > 0 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {formatCurrency(amountNum)} ÷ {hoursNum} hours = {perHour}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="completion-date">Estimated Completion Date</Label>
                          <Input
                            id="completion-date"
                            type="date"
                            min={today}
                            value={completionDate}
                            onChange={(e) => setCompletionDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="approach">Your Approach</Label>
                          <Textarea
                            id="approach"
                            placeholder="Describe how you'll approach finishing this AI-made deliverable..."
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
                          <Label htmlFor="questions">Questions for the Business</Label>
                          <Textarea
                            id="questions"
                            placeholder="Any questions or clarifications you need before starting..."
                            className="min-h-[80px]"
                            value={questions}
                            onChange={(e) => setQuestions(e.target.value)}
                          />
                        </div>

                        <Button
                          size="lg"
                          className="w-full"
                          onClick={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting
                            ? "Saving..."
                            : isEditing
                              ? "Update Bid"
                              : "Submit Bid"}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                          You can edit or withdraw your bid while it's still pending.
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

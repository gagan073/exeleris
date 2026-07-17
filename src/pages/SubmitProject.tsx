import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/Header";
import { AiDeliverableUpload } from "@/components/AiDeliverableUpload";
import { ArrowLeft, Upload, FileText, X, Sparkles, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  SERVICE_CATEGORIES,
  ALLOWED_AI_TOOLS,
  SKILLS_BY_CATEGORY,
  ProjectStatus,
  DeliverableAnalysis,
} from "@/types/database";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Feature switch for the "AI drafts your listing" step. Off unless the site is
// built with VITE_ENABLE_AI_ANALYSIS=true (see AI_FEATURE_SETUP.md).
const AI_ENABLED = import.meta.env.VITE_ENABLE_AI_ANALYSIS === "true";

// Small "AI-suggested" tag shown next to fields the AI filled in. It disappears
// once the business edits that field.
const AiSuggestedTag = () => (
  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent bg-accent/10 rounded px-1.5 py-0.5 align-middle">
    <Sparkles className="w-3 h-3" />
    AI-suggested
  </span>
);

interface SelectedFile {
  file: File;
  isConfidential: boolean;
}

const SubmitProject = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [completionPercent, setCompletionPercent] = useState(80);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [submitting, setSubmitting] = useState<ProjectStatus | null>(null);

  // AI-drafted-listing state.
  const [aiAnalysis, setAiAnalysis] = useState<DeliverableAnalysis | null>(null);
  const [expertQuestions, setExpertQuestions] = useState<string[]>([]);
  // Which fields the AI filled in (used to show the "AI-suggested" tag until the
  // business edits that field).
  const [aiFields, setAiFields] = useState<Record<string, boolean>>({});

  const today = new Date().toISOString().split("T")[0];
  const suggestedSkills = category ? SKILLS_BY_CATEGORY[category] || [] : [];
  // Show the category's suggested skills plus any AI-suggested skills that
  // aren't already in that list, so custom AI skills stay visible and editable.
  const displayedSkills = Array.from(new Set([...suggestedSkills, ...selectedSkills]));

  const clearAiField = (name: string) =>
    setAiFields((prev) => (prev[name] ? { ...prev, [name]: false } : prev));

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSelectedSkills([]);
    clearAiField("category");
    clearAiField("skills");
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    clearAiField("skills");
  };

  // Turn the AI summary + remaining-work list into a ready-to-edit description.
  const composeDescription = (a: DeliverableAnalysis) => {
    let d = (a.summary || "").trim();
    if (a.remaining_work?.length) {
      d +=
        (d ? "\n\n" : "") +
        "Remaining work for the expert:\n" +
        a.remaining_work.map((w) => `• ${w}`).join("\n");
    }
    return d;
  };

  // Called by the AI upload step. Always attaches the uploaded document to the
  // project; if the analysis succeeded, it also fills the form.
  const applyAnalysis = (file: File, analysis: DeliverableAnalysis | null) => {
    // Attach the deliverable as the project's main file (first in the list).
    setFiles((prev) => [{ file, isConfidential: false }, ...prev]);

    if (!analysis) return; // graceful failure — the upload step shows the message

    if (analysis.title) setTitle(analysis.title);
    if (analysis.category) setCategory(analysis.category); // direct, so skills below aren't cleared
    if (analysis.skills?.length) setSelectedSkills(analysis.skills);
    if (typeof analysis.completeness_percent === "number") {
      setCompletionPercent(
        Math.min(100, Math.max(0, Math.round(analysis.completeness_percent)))
      );
    }
    if (analysis.budget_min) setBudgetMin(String(analysis.budget_min));
    if (analysis.budget_max) setBudgetMax(String(analysis.budget_max));
    setDescription(composeDescription(analysis));
    setExpertQuestions(analysis.expert_questions || []);
    setAiAnalysis(analysis);

    setAiFields({
      title: !!analysis.title,
      category: !!analysis.category,
      description: true,
      completion: true,
      skills: (analysis.skills?.length || 0) > 0,
      budget: !!analysis.budget_min || !!analysis.budget_max,
    });

    toast.success("Draft ready — review and edit any field before publishing.");
  };

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    const accepted: SelectedFile[] = [];
    picked.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is over the 50MB limit`);
      } else {
        accepted.push({ file, isConfidential: false });
      }
    });
    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted]);
    }
    // Allow re-selecting the same file later
    e.target.value = "";
  };

  const toggleConfidential = (index: number) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, isConfidential: !f.isConfidential } : f))
    );
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (status: ProjectStatus) => {
    if (!title.trim()) {
      toast.error("Please enter a project title");
      return;
    }
    if (!category) {
      toast.error("Please select a service category");
      return;
    }
    if (status === "published") {
      if (!description.trim()) {
        toast.error("Please describe your project");
        return;
      }
      const min = Number(budgetMin);
      const max = Number(budgetMax);
      if (!budgetMin || min <= 0) {
        toast.error("Please enter a minimum budget greater than $0");
        return;
      }
      if (!budgetMax || max <= 0) {
        toast.error("Please enter a maximum budget greater than $0");
        return;
      }
      if (min > max) {
        toast.error("Minimum budget cannot be greater than maximum budget");
        return;
      }
    }
    if (!user) {
      toast.error("You must be signed in to submit a project");
      return;
    }

    setSubmitting(status);
    try {
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          business_id: user.id,
          company_name: profile?.company_name || profile?.full_name || "",
          title: title.trim(),
          category,
          description: description.trim(),
          completion_percent: completionPercent,
          skills: selectedSkills,
          ai_tools: selectedTools,
          budget_min: Number(budgetMin) || 0,
          budget_max: Number(budgetMax) || 0,
          deadline: deadline || null,
          status,
          ai_analysis: aiAnalysis,
        })
        .select()
        .single();

      if (error || !project) {
        toast.error(error?.message || "Failed to save your project. Please try again.");
        return;
      }

      // Upload files concurrently. The index keeps paths unique even when
      // Date.now() returns the same millisecond for two files.
      const uploadResults = await Promise.allSettled(
        files.map(async (item, index) => {
          const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${project.id}/${Date.now()}-${index}-${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from("project-files")
            .upload(path, item.file);
          if (uploadError) throw uploadError;
          const { error: fileError } = await supabase.from("project_files").insert({
            project_id: project.id,
            file_name: item.file.name,
            storage_path: path,
            is_confidential: item.isConfidential,
          });
          if (fileError) throw fileError;
        })
      );
      const failedUploads = uploadResults
        .map((result, index) => (result.status === "rejected" ? files[index].file.name : null))
        .filter((name): name is string => name !== null);

      if (failedUploads.length > 0) {
        toast.warning(
          `Project saved, but these files failed to upload: ${failedUploads.join(", ")}`
        );
      } else {
        toast.success(
          status === "draft"
            ? "Draft saved — find it on your dashboard"
            : "Your project is live on the marketplace!"
        );
      }
      navigate("/dashboard");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Submit Your AI-Enhanced Project
              </h1>
              <p className="text-xl text-muted-foreground">
                Get expert finishing touches on your AI-generated deliverables
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {AI_ENABLED && (
                  <AiDeliverableUpload
                    onAnalyzed={applyAnalysis}
                    disabled={submitting !== null}
                  />
                )}

                <div className="space-y-2">
                  <Label htmlFor="project-title" className="flex items-center gap-2">
                    Project Title *
                    {aiFields.title && <AiSuggestedTag />}
                  </Label>
                  <Input
                    id="project-title"
                    placeholder="Brief, descriptive title of your project"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      clearAiField("title");
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-2">
                    Service Category *
                    {aiFields.category && <AiSuggestedTag />}
                  </Label>
                  <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select service category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    Project Description *
                    {aiFields.description && <AiSuggestedTag />}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project, what's been completed, and what needs expert finishing..."
                    className="min-h-[120px]"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      clearAiField("description");
                    }}
                  />
                </div>

                {expertQuestions.length > 0 && (
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-accent shrink-0" />
                      <p className="text-sm font-medium text-foreground">
                        Experts will probably ask these — consider answering them
                        in your description.
                      </p>
                    </div>
                    <ul className="space-y-1 pl-6">
                      {expertQuestions.map((q, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground list-disc"
                        >
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      How complete is your deliverable?
                      {aiFields.completion && <AiSuggestedTag />}
                    </Label>
                    <span className="text-accent font-semibold">{completionPercent}% Complete</span>
                  </div>
                  <Slider
                    value={[completionPercent]}
                    onValueChange={(value) => {
                      setCompletionPercent(value[0]);
                      clearAiField("completion");
                    }}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <p className="text-sm text-muted-foreground">
                    Estimate how much of the work is already done.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Required Skills
                    {aiFields.skills && <AiSuggestedTag />}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Select the skills the expert should have
                  </p>
                  {displayedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {displayedSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant={selectedSkills.includes(skill) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Choose a service category to see suggested skills
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Allowed AI Tools</Label>
                  <p className="text-sm text-muted-foreground">
                    Which AI tools is the expert allowed to use on this project?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALLOWED_AI_TOOLS.map((tool) => (
                      <Badge
                        key={tool}
                        variant={selectedTools.includes(tool) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTool(tool)}
                      >
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Budget Range (USD) *
                    {aiFields.budget && <AiSuggestedTag />}
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget-min" className="text-sm text-muted-foreground">
                        Minimum ($)
                      </Label>
                      <Input
                        id="budget-min"
                        type="number"
                        min={1}
                        placeholder="500"
                        value={budgetMin}
                        onChange={(e) => {
                          setBudgetMin(e.target.value);
                          clearAiField("budget");
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget-max" className="text-sm text-muted-foreground">
                        Maximum ($)
                      </Label>
                      <Input
                        id="budget-max"
                        type="number"
                        min={1}
                        placeholder="1,500"
                        value={budgetMax}
                        onChange={(e) => {
                          setBudgetMax(e.target.value);
                          clearAiField("budget");
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Desired Completion Date</Label>
                  <Input
                    id="deadline"
                    type="date"
                    min={today}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Project Documents</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilesSelected}
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Upload your AI-generated deliverable and any supporting documents
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supported: PDF, DOCX, XLSX, PPT, ZIP (Max 50MB)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </Button>
                  </div>
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((item, index) => (
                        <div
                          key={`${item.file.name}-${index}`}
                          className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-accent shrink-0" />
                            <span className="text-sm truncate">{item.file.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {Math.max(1, Math.round(item.file.size / 1024))} KB
                            </span>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`confidential-${index}`}
                                checked={item.isConfidential}
                                onCheckedChange={() => toggleConfidential(index)}
                              />
                              <Label htmlFor={`confidential-${index}`} className="text-sm">
                                Confidential
                              </Label>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={`Remove ${item.file.name}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      disabled={submitting !== null}
                      onClick={() => handleSubmit("draft")}
                    >
                      {submitting === "draft" ? "Saving..." : "Save as Draft"}
                    </Button>
                    <Button
                      variant="accent"
                      size="lg"
                      className="flex-1"
                      disabled={submitting !== null}
                      onClick={() => handleSubmit("published")}
                    >
                      {submitting === "published" ? "Publishing..." : "Publish to Marketplace"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    You'll receive expert bids within 24-48 hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitProject;

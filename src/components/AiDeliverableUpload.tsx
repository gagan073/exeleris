import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  analyzeDeliverable,
  isSupportedDeliverable,
  MAX_AI_FILE_SIZE,
} from "@/lib/analyzeDeliverable";
import { DeliverableAnalysis } from "@/types/database";

interface AiDeliverableUploadProps {
  // Called after an upload. `analysis` is null if the AI step couldn't analyze
  // the file — the business can still continue manually, and the file is still
  // attached to the project.
  onAnalyzed: (file: File, analysis: DeliverableAnalysis | null) => void;
  disabled?: boolean;
}

// The optional first step on "Post a Project": upload an AI-generated
// deliverable and let Claude draft the whole listing. Fully optional — the AI
// step never blocks posting.
export const AiDeliverableUpload = ({
  onAnalyzed,
  disabled,
}: AiDeliverableUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneFileName, setDoneFileName] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setDoneFileName(null);

    if (!isSupportedDeliverable(file)) {
      setError("Please upload a Word (.docx), PDF, or text (.txt/.md) file.");
      return;
    }
    if (file.size > MAX_AI_FILE_SIZE) {
      setError("That file is over the 10 MB limit for AI analysis.");
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = await analyzeDeliverable(file);
      setDoneFileName(file.name);
      onAnalyzed(file, analysis);
    } catch {
      // Graceful failure: keep the file, let them fill the form themselves.
      setError(
        "We couldn't analyze the document — you can still fill the form yourself.",
      );
      onAnalyzed(file, null);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-5">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFile}
      />

      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">
            Upload your AI-generated deliverable and we'll draft your listing for you
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Optional. Upload a Word, PDF, or text file (max 10 MB). Claude reads
            it and fills in the form below — every field stays fully editable.
          </p>

          {analyzing ? (
            <div className="mt-4 flex items-center gap-2 text-accent">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                Claude is reading your deliverable…
              </span>
            </div>
          ) : (
            <Button
              type="button"
              variant="accent"
              className="mt-4"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {doneFileName ? "Upload a different file" : "Upload & draft my listing"}
            </Button>
          )}

          {doneFileName && !analyzing && !error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
              <span className="truncate">
                Drafted from <span className="font-medium">{doneFileName}</span>.
                Review the fields below.
              </span>
            </div>
          )}

          {error && !analyzing && (
            <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

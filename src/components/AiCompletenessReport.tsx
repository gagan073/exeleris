import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ClipboardCheck } from "lucide-react";
import { DeliverableAnalysis } from "@/types/database";

interface AiCompletenessReportProps {
  analysis: DeliverableAnalysis;
}

// Expert-facing card shown on the project detail page. Surfaces how complete
// the AI-generated deliverable really is, a short summary, and exactly what
// work remains — so experts can bid accurately. This is the Exeleris
// differentiator (Fiverr / Upwork don't show this).
export const AiCompletenessReport = ({ analysis }: AiCompletenessReportProps) => {
  const pct = Math.min(100, Math.max(0, analysis.completeness_percent ?? 0));

  return (
    <Card className="border-accent/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <CardTitle className="text-lg text-foreground">
            AI Completeness Report
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          An AI estimate to help you bid accurately — always use your own
          professional judgement.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Completeness score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Estimated completeness
            </span>
            <span className="text-accent font-semibold">{pct}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Summary */}
        {analysis.summary && (
          <div>
            <h4 className="font-semibold text-foreground mb-1">Summary</h4>
            <p className="text-muted-foreground leading-relaxed">
              {analysis.summary}
            </p>
          </div>
        )}

        {/* Remaining work */}
        {analysis.remaining_work?.length > 0 && (
          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-accent" />
              Remaining work for the expert
            </h4>
            <ul className="space-y-2">
              {analysis.remaining_work.map((item, i) => (
                <li key={i} className="flex gap-2 text-muted-foreground">
                  <span className="text-accent mt-1 shrink-0">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================
// Exeleris — "analyze-deliverable" Edge Function
//
// This is the ONLY place that talks to Claude (Anthropic). It runs on
// Supabase's servers, so the secret ANTHROPIC_API_KEY never reaches the
// browser or the website code.
//
// It receives the text of an uploaded deliverable (or a PDF), asks Claude to
// analyze it, and returns a clean, structured "completeness report".
//
// SETUP (see AI_FEATURE_SETUP.md for click-by-click steps):
//   1. Deploy this function to your Supabase project.
//   2. Add a secret named  ANTHROPIC_API_KEY  with your Anthropic key.
//   3. (Optional) Add a secret  ANTHROPIC_MODEL  to change the model.
// ============================================================

// The model Claude uses. Sonnet 5 is fast, capable and cost-effective.
// To use the most powerful model instead, set an ANTHROPIC_MODEL secret to
// "claude-opus-4-8".
const DEFAULT_MODEL = "claude-sonnet-5";

// Safety cap so a huge document can't run up a large bill. ~200k characters is
// roughly 50k tokens — plenty for a thorough analysis.
const MAX_TEXT_CHARS = 200_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

// The instructions that shape Claude's analysis. Written to produce an HONEST
// completeness estimate — AI drafts often look finished but still need a
// professional to verify, correct and complete them.
const SYSTEM_PROMPT = `
You are the analysis engine for Exeleris, a marketplace where businesses upload
AI-generated deliverables (drafts made with tools like ChatGPT or Claude) and
vetted human experts finish, verify and polish them.

A business has uploaded one such deliverable. Analyze it and produce a listing
for the marketplace. Be honest and realistic — this is the whole point of
Exeleris. An AI draft that looks polished is usually NOT complete: facts may be
unverified, figures may be assumed, legal/financial/medical claims may need a
licensed professional to check them, and important specifics are often missing.
A confident-looking but unchecked draft is rarely more than 70-85% done.

Produce, by calling the save_analysis tool exactly once:
- title: a concise, professional listing title (max ~10 words).
- category: choose EXACTLY ONE from the provided list that best fits.
- summary: 2-4 plain-English sentences describing what the document is and its
  current state. Write it for a busy reader.
- completeness_percent: an honest integer 0-100 for how complete the work truly
  is. Base it on what still needs a professional's attention, not on how tidy
  the draft looks.
- remaining_work: 3-8 concrete, specific things the expert must ADD, FIX or
  VERIFY to finish this deliverable. Tie each item to this document, not
  generic advice. Start each with a verb (e.g. "Verify the...", "Add a...").
- skills: 3-6 professional skills the right expert should have.
- budget_min and budget_max: a realistic USD budget range for the REMAINING
  work only (what a professional would charge to finish it), NOT the value of
  the whole document. Whole integers, min < max.
- expert_questions: 3-6 questions a professional would likely ask the business
  before starting (scope, source data, intended audience, constraints, etc.).
`.trim();

// The exact shape Claude must return. "strict: true" makes the model fill this
// precisely, so the website always receives clean, predictable data.
function analysisTool(categories: string[]) {
  return {
    name: "save_analysis",
    description:
      "Save the structured analysis of the uploaded deliverable for the Exeleris marketplace.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string", description: "Concise professional listing title." },
        category: {
          type: "string",
          enum: categories,
          description: "Exactly one category from the list.",
        },
        summary: { type: "string", description: "2-4 sentence plain-English summary." },
        completeness_percent: {
          type: "integer",
          description: "Honest completeness of the work, 0-100.",
        },
        remaining_work: {
          type: "array",
          items: { type: "string" },
          description: "Concrete things the expert must add, fix or verify.",
        },
        skills: {
          type: "array",
          items: { type: "string" },
          description: "Professional skills the expert should have.",
        },
        budget_min: { type: "integer", description: "USD, remaining work only." },
        budget_max: { type: "integer", description: "USD, remaining work only." },
        expert_questions: {
          type: "array",
          items: { type: "string" },
          description: "Questions an expert would ask before starting.",
        },
      },
      required: [
        "title",
        "category",
        "summary",
        "completeness_percent",
        "remaining_work",
        "skills",
        "budget_min",
        "budget_max",
        "expert_questions",
      ],
    },
  };
}

// Turn Claude's raw tool call into a clean, safe object for the website.
function normalize(raw: Record<string, unknown>, categories: string[]) {
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.map((x) => String(x).trim()).filter((x) => x.length > 0)
      : [];
  const asInt = (v: unknown): number => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? n : 0;
  };

  const clampPct = Math.min(100, Math.max(0, asInt(raw.completeness_percent)));
  let min = Math.max(0, asInt(raw.budget_min));
  let max = Math.max(0, asInt(raw.budget_max));
  if (max < min) [min, max] = [max, min]; // keep min <= max whatever comes back

  const category =
    typeof raw.category === "string" && categories.includes(raw.category)
      ? raw.category
      : "";

  return {
    title: typeof raw.title === "string" ? raw.title.trim() : "",
    category,
    summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
    completeness_percent: clampPct,
    remaining_work: asStringArray(raw.remaining_work),
    skills: asStringArray(raw.skills),
    budget_min: min,
    budget_max: max,
    expert_questions: asStringArray(raw.expert_questions),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Use POST." }, 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    // Configuration problem — the website treats this as "analysis unavailable"
    // and lets the business fill the form manually.
    return json(
      { error: "The AI service isn't configured yet (missing ANTHROPIC_API_KEY)." },
      503,
    );
  }
  const model = Deno.env.get("ANTHROPIC_MODEL") || DEFAULT_MODEL;

  let body: {
    kind?: string;
    text?: string;
    data?: string; // base64 PDF
    fileName?: string;
    categories?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const categories =
    Array.isArray(body.categories) && body.categories.length > 0
      ? body.categories.map((c) => String(c))
      : [];
  if (categories.length === 0) {
    return json({ error: "No categories provided." }, 400);
  }

  // Build the user message: either the document's text, or a PDF Claude reads
  // natively.
  let userContent: unknown;
  if (body.kind === "pdf" && body.data) {
    userContent = [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: body.data },
      },
      {
        type: "text",
        text: "Analyze the attached deliverable and call save_analysis with the result.",
      },
    ];
  } else if (typeof body.text === "string" && body.text.trim().length > 0) {
    const text = body.text.slice(0, MAX_TEXT_CHARS);
    const truncatedNote =
      body.text.length > MAX_TEXT_CHARS
        ? "\n\n[Note: the document was long and has been truncated for analysis.]"
        : "";
    userContent = [
      {
        type: "text",
        text:
          `Here is the deliverable to analyze` +
          (body.fileName ? ` (file: ${body.fileName})` : "") +
          `. Call save_analysis with the result.\n\n--- DOCUMENT START ---\n${text}\n--- DOCUMENT END ---${truncatedNote}`,
      },
    ];
  } else {
    return json({ error: "No document content to analyze." }, 400);
  }

  let anthropicResp: Response;
  try {
    anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        thinking: { type: "disabled" }, // fast + required for forced tool use
        system: SYSTEM_PROMPT,
        tools: [analysisTool(categories)],
        tool_choice: { type: "tool", name: "save_analysis" },
        messages: [{ role: "user", content: userContent }],
      }),
    });
  } catch (e) {
    return json({ error: "Could not reach the AI service.", detail: String(e) }, 502);
  }

  if (!anthropicResp.ok) {
    const detail = await anthropicResp.text().catch(() => "");
    // Don't leak the key or internals to the browser — just enough to debug.
    return json(
      { error: "The AI service returned an error.", status: anthropicResp.status, detail: detail.slice(0, 500) },
      502,
    );
  }

  const data = await anthropicResp.json();

  if (data?.stop_reason === "refusal") {
    return json({ error: "The AI declined to analyze this document." }, 422);
  }

  const toolBlock = Array.isArray(data?.content)
    ? data.content.find(
        (b: { type?: string; name?: string }) =>
          b?.type === "tool_use" && b?.name === "save_analysis",
      )
    : undefined;

  if (!toolBlock?.input) {
    return json({ error: "The AI did not return a usable analysis." }, 502);
  }

  const analysis = normalize(
    toolBlock.input as Record<string, unknown>,
    categories,
  );
  return json({ analysis, model });
});

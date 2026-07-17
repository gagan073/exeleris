import { supabase } from "@/lib/supabase";
import { DeliverableAnalysis, SERVICE_CATEGORIES } from "@/types/database";

// The AI upload step accepts Word, PDF and plain-text files up to 10 MB.
export const MAX_AI_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function isSupportedDeliverable(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "application/pdf" ||
    name.endsWith(".pdf") ||
    file.type === DOCX_MIME ||
    name.endsWith(".docx") ||
    file.type === "text/plain" ||
    file.type === "text/markdown" ||
    name.endsWith(".txt") ||
    name.endsWith(".md")
  );
}

// Read a file's bytes as a base64 string (no "data:..." prefix). Used for PDFs,
// which Claude reads natively on the server.
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

// Pull plain text out of a Word (.docx) file, in the browser.
async function extractDocxText(file: File): Promise<string> {
  const mod: any = await import("mammoth");
  const mammoth = mod?.default ?? mod;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return String(result?.value || "").trim();
}

/**
 * Send an uploaded deliverable to the secure Edge Function for analysis.
 * Returns the analysis, or throws if it couldn't be produced (the caller shows
 * a gentle message and lets the business continue manually).
 */
export async function analyzeDeliverable(
  file: File,
): Promise<DeliverableAnalysis> {
  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const isDocx = file.type === DOCX_MIME || name.endsWith(".docx");

  let requestBody: Record<string, unknown>;

  if (isPdf) {
    // Let Claude read the PDF directly — best quality for tables/layout.
    const data = await fileToBase64(file);
    requestBody = {
      kind: "pdf",
      data,
      fileName: file.name,
      categories: [...SERVICE_CATEGORIES],
    };
  } else {
    // Word or plain text → extract text in the browser, send just the text.
    const text = isDocx ? await extractDocxText(file) : (await file.text()).trim();
    if (!text) {
      throw new Error("We couldn't find any readable text in that file.");
    }
    requestBody = {
      kind: "text",
      text,
      fileName: file.name,
      categories: [...SERVICE_CATEGORIES],
    };
  }

  const { data, error } = await supabase.functions.invoke("analyze-deliverable", {
    body: requestBody,
  });

  if (error) {
    throw new Error(error.message || "The analysis service is unavailable.");
  }
  if (!data?.analysis) {
    throw new Error((data && data.error) || "No analysis was returned.");
  }

  const analysis = data.analysis as DeliverableAnalysis;
  return {
    ...analysis,
    source_file_name: file.name,
    model: data.model,
    analyzed_at: new Date().toISOString(),
  };
}

export type AppRole = "business" | "expert" | "super_admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ProjectStatus =
  | "draft"
  | "published"
  | "in_progress"
  | "in_review"
  | "completed"
  | "cancelled";
export type BidStatus =
  | "pending"
  | "shortlisted"
  | "accepted"
  | "declined"
  | "withdrawn";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  company_name: string | null;
  created_at: string;
}

export interface ExpertProfile {
  id: string;
  headline: string | null;
  professional_type: string | null;
  license_number: string | null;
  years_experience: string | null;
  skills: string[];
  categories: string[];
  approval_status: ApprovalStatus;
  created_at: string;
}

// The AI's analysis of an uploaded deliverable. Saved with the project and
// shown to experts as the "AI Completeness Report". Produced by the
// analyze-deliverable Edge Function (see AI_FEATURE_SETUP.md).
export interface DeliverableAnalysis {
  title: string;
  category: string;
  summary: string;
  completeness_percent: number;
  remaining_work: string[];
  skills: string[];
  budget_min: number;
  budget_max: number;
  expert_questions: string[];
  // Added on the client after a successful analysis:
  source_file_name?: string;
  model?: string;
  analyzed_at?: string;
}

export interface Project {
  id: string;
  business_id: string | null;
  company_name: string;
  title: string;
  category: string;
  description: string;
  completion_percent: number;
  skills: string[];
  ai_tools: string[];
  budget_min: number;
  budget_max: number;
  deadline: string | null;
  status: ProjectStatus;
  created_at: string;
  ai_analysis?: DeliverableAnalysis | null;
}

export interface Bid {
  id: string;
  project_id: string;
  expert_id: string;
  bid_amount: number;
  estimated_hours: number;
  estimated_completion_date: string | null;
  approach: string | null;
  experience: string | null;
  questions: string | null;
  status: BidStatus;
  decline_reason: string | null;
  created_at: string;
  // Legacy columns kept for older test bids; no longer written by the app.
  hourly_rate: number | null;
  completion_time: string | null;
}

export interface Transaction {
  id: string;
  project_id: string;
  winning_bid_id: string | null;
  business_id: string | null;
  expert_id: string | null;
  total_amount: number;
  commission_percent: number;
  platform_earnings: number;
  expert_payout: number;
  status: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  project_id: string | null;
  bid_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PlatformSettings {
  id: boolean;
  commission_percent: number;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  storage_path: string;
  is_confidential: boolean;
  created_at: string;
}

export const SERVICE_CATEGORIES = [
  "Legal Services",
  "Financial Analysis",
  "Marketing Strategy",
  "Business Consulting",
  "Technical & Engineering",
  "Healthcare & Medical",
  "Design & Creative",
  "Academic & Research",
] as const;

export const PROFESSIONAL_TYPES = [
  "Attorney",
  "CPA / Accountant",
  "Fractional CFO",
  "Consultant",
  "Marketing Professional",
  "Engineer",
  "Medical Professional",
  "Designer",
  "Researcher",
  "Other",
] as const;

export const ALLOWED_AI_TOOLS = [
  "Claude",
  "ChatGPT",
  "Gemini",
  "Jasper",
  "Copilot",
  "Perplexity",
  "Other",
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "1-3", label: "1-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5-10", label: "5-10 years" },
  { value: "10-15", label: "10-15 years" },
  { value: "15+", label: "15+ years" },
] as const;

export const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  "Legal Services": ["Contract Law", "Corporate Legal", "Regulatory Compliance", "Litigation Support", "IP Law", "Employment Law"],
  "Financial Analysis": ["Financial Planning", "Risk Assessment", "Investment Analysis", "Tax Strategy", "Forensic Accounting", "Valuation"],
  "Marketing Strategy": ["Digital Marketing", "Brand Strategy", "Content Marketing", "Performance Marketing", "SEO/SEM", "Social Media"],
  "Business Consulting": ["Strategy Development", "Process Optimization", "Change Management", "Business Analysis", "Operations", "HR Consulting"],
  "Technical & Engineering": ["Software Architecture", "Technical Writing", "Code Review", "System Design", "Security Assessment", "DevOps"],
  "Healthcare & Medical": ["Medical Writing", "Healthcare Compliance", "Clinical Research", "Medical Device", "Regulatory Affairs", "Healthcare IT"],
  "Design & Creative": ["Graphic Design", "UX/UI Design", "Brand Development", "Video Production", "Web Design", "Print Design"],
  "Academic & Research": ["Academic Writing", "Research Methods", "Data Analysis", "Grant Writing", "Peer Review", "Statistical Analysis"],
};

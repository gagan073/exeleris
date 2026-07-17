// One source of truth for the human-friendly status labels and colors used
// everywhere on the site (Browse Jobs, dashboards, project detail, bid
// comparison). Keeps wording and styling consistent.

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Open for Bids",
  in_progress: "In Progress",
  in_review: "In Review",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PROJECT_STATUS_CLASSES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  published: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  in_review: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export const BID_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

export const BID_STATUS_CLASSES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  shortlisted: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  declined: "bg-red-100 text-red-700 border-red-200",
  withdrawn: "bg-slate-100 text-slate-500 border-slate-200",
};

export const projectStatusLabel = (status: string): string =>
  PROJECT_STATUS_LABELS[status] ?? status;

export const bidStatusLabel = (status: string): string =>
  BID_STATUS_LABELS[status] ?? status;

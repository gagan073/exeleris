// Shared money/number formatting so every dollar amount looks the same
// across the site, e.g. $1,250.00.
import { differenceInCalendarDays, parseISO } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number | string | null | undefined): string => {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (n == null || Number.isNaN(n)) return "$0.00";
  return currencyFormatter.format(n);
};

// Price-per-hour derived from a whole-job price and estimated hours.
export const pricePerHour = (amount: number, hours: number): string => {
  if (!hours || hours <= 0 || Number.isNaN(hours)) return "—";
  return `${formatCurrency(amount / hours)}/hr`;
};

// Plain-English deadline countdown used across the job board and detail pages.
export const deadlineText = (deadline: string | null): string => {
  if (!deadline) return "Flexible deadline";
  const days = differenceInCalendarDays(parseISO(deadline), new Date());
  if (days < 0) return "Deadline passed";
  if (days === 0) return "Due today";
  if (days === 1) return "Due in 1 day";
  return `Due in ${days} days`;
};

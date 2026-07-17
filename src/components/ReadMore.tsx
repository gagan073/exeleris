import { useState } from "react";

// Truncates long bid text (approach / experience / questions) with a toggle.
export const ReadMore = ({
  text,
  max = 180,
}: {
  text?: string | null;
  max?: number;
}) => {
  const [open, setOpen] = useState(false);

  if (!text || !text.trim()) {
    return <span className="text-muted-foreground italic">Not provided</span>;
  }

  if (text.length <= max) {
    return <span className="whitespace-pre-line">{text}</span>;
  }

  return (
    <span className="whitespace-pre-line">
      {open ? text : `${text.slice(0, max).trimEnd()}… `}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-accent hover:underline font-medium whitespace-nowrap"
      >
        {open ? "Show less" : "Read more"}
      </button>
    </span>
  );
};

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BID_STATUS_CLASSES,
  BID_STATUS_LABELS,
  PROJECT_STATUS_CLASSES,
  PROJECT_STATUS_LABELS,
} from "@/lib/status";

export const ProjectStatusBadge = ({
  status,
  className,
}: {
  status: string;
  className?: string;
}) => (
  <Badge variant="outline" className={cn(PROJECT_STATUS_CLASSES[status] ?? "", className)}>
    {PROJECT_STATUS_LABELS[status] ?? status}
  </Badge>
);

export const BidStatusBadge = ({
  status,
  className,
}: {
  status: string;
  className?: string;
}) => (
  <Badge variant="outline" className={cn(BID_STATUS_CLASSES[status] ?? "", className)}>
    {BID_STATUS_LABELS[status] ?? status}
  </Badge>
);

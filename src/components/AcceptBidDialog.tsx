import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";

interface AcceptBidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bidId: string | null;
  amount: number;
  expertName: string;
  onAccepted: () => void;
}

export const AcceptBidDialog = ({
  open,
  onOpenChange,
  bidId,
  amount,
  expertName,
  onAccepted,
}: AcceptBidDialogProps) => {
  // Read the live commission % so the breakdown matches what the database will
  // record. Defaults to 15 if the settings row is missing.
  const { data: settings } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("commission_percent")
        .eq("id", true)
        .maybeSingle();
      if (error) throw error;
      return data as { commission_percent: number } | null;
    },
  });

  const pct = settings?.commission_percent ?? 15;
  const platformEarnings = Math.round(amount * pct) / 100;
  const expertPayout = amount - platformEarnings;

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!bidId) throw new Error("No bid selected");
      const { error } = await supabase.rpc("accept_bid", { p_bid_id: bidId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bid accepted! The project is now in progress.");
      onAccepted();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Could not accept the bid."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accept {expertName}'s bid?</DialogTitle>
          <DialogDescription>
            Here's exactly how the money breaks down. When you accept, all other
            bids are declined and the project moves to In Progress.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border divide-y">
          <div className="flex justify-between px-4 py-3">
            <span className="text-muted-foreground">Bid amount</span>
            <span className="font-semibold text-foreground">{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-muted-foreground">
              Platform commission ({pct}%)
            </span>
            <span className="font-semibold text-foreground">
              −{formatCurrency(platformEarnings)}
            </span>
          </div>
          <div className="flex justify-between px-4 py-3 bg-accent/10">
            <span className="font-semibold text-foreground">Expert receives</span>
            <span className="text-xl font-bold text-accent">
              {formatCurrency(expertPayout)}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          No money moves yet — this records the transaction so everything is
          tracked. Payments will be connected in a later update.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={acceptMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? "Accepting..." : "Confirm & Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

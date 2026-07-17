import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

interface DeclineBidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bidId: string | null;
  expertName: string;
  onDeclined: () => void;
}

export const DeclineBidDialog = ({
  open,
  onOpenChange,
  bidId,
  expertName,
  onDeclined,
}: DeclineBidDialogProps) => {
  const [reason, setReason] = useState("");

  const declineMutation = useMutation({
    mutationFn: async () => {
      if (!bidId) throw new Error("No bid selected");
      const { error } = await supabase.rpc("set_bid_status", {
        p_bid_id: bidId,
        p_status: "declined",
        p_reason: reason.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bid declined.");
      setReason("");
      onDeclined();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Could not decline the bid."),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline {expertName}'s bid?</DialogTitle>
          <DialogDescription>
            You can optionally share a reason. The expert will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="decline-reason">Reason (optional)</Label>
          <Textarea
            id="decline-reason"
            placeholder="e.g., Price is above our budget for this project."
            className="min-h-[100px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={declineMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => declineMutation.mutate()}
            disabled={declineMutation.isPending}
          >
            {declineMutation.isPending ? "Declining..." : "Decline bid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

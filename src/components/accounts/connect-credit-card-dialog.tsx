"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConnectCreditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectCreditCardDialog({
  open,
  onOpenChange,
}: ConnectCreditCardDialogProps) {
  const handleConnect = () => {
    window.location.href = "/api/auth/truelayer/connect";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Credit Card</DialogTitle>
          <DialogDescription>
            You&apos;ll be securely redirected to TrueLayer to connect your
            credit cards via Open Banking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3 text-sm">
            <p className="font-medium">What happens:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>You&apos;ll be taken to TrueLayer&apos;s secure page</li>
              <li>Select your bank and sign in</li>
              <li>Authorise access to your credit card data (read-only)</li>
              <li>You&apos;ll be brought back here automatically</li>
            </ol>
            <p className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
              We only read your balance to calculate transfers. We never store
              your bank credentials.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleConnect} className="flex-1">
              Connect Credit Card
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

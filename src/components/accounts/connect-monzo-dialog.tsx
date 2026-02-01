"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConnectMonzoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectMonzoDialog({
  open,
  onOpenChange,
}: ConnectMonzoDialogProps) {
  const handleConnect = () => {
    window.location.href = "/api/auth/monzo/connect";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Monzo</DialogTitle>
          <DialogDescription>
            You&apos;ll be securely redirected to Monzo in this tab to sign in
            and approve the connection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3 text-sm">
            <p className="font-medium">What happens:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                You&apos;ll be taken to Monzo&apos;s login page in this tab
              </li>
              <li>Enter your email and click the magic link in your email</li>
              <li>
                <strong className="text-foreground">
                  Approve in your Monzo app
                </strong>{" "}
                – check your phone for a notification and approve with PIN or
                Face ID
              </li>
              <li>You&apos;ll be brought back here automatically</li>
            </ol>
            <p className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-amber-700 dark:text-amber-400">
              <strong>Important:</strong> You must approve the connection in
              your Monzo app before returning here. Keep your phone handy.
            </p>
            <p className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
              <strong>Tip:</strong> Open the magic link in this same tab.
              Right-click the link → &quot;Open in same window&quot; if a new
              tab opens.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleConnect} className="flex-1">
              Continue to Monzo
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

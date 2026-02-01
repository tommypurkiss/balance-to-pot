"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function MonzoCompleteContent() {
  const searchParams = useSearchParams();
  const success = searchParams?.get("monzo") === "connected";
  const error = searchParams?.get("error");

  useEffect(() => {
    const message = {
      type: "monzo-connected",
      success: success && !error,
      error: error ? decodeURIComponent(error) : null,
    };

    if (window.opener) {
      window.opener.postMessage(message, window.location.origin);
      window.close();
    } else {
      window.location.href = error
        ? `/dashboard/accounts?error=${encodeURIComponent(error)}`
        : "/dashboard/accounts?monzo=connected";
    }
  }, [success, error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">
        {success && !error
          ? "Connection complete. Closing..."
          : "Redirecting..."}
      </p>
    </div>
  );
}

export default function MonzoCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <MonzoCompleteContent />
    </Suspense>
  );
}

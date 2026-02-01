import { Suspense } from "react";
import { AccountsPage } from "@/views/dashboard/accounts";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <AccountsPage />
    </Suspense>
  );
}

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Welcome to PotSaver</h2>
            <p className="text-muted-foreground text-sm">
              Connect your Monzo account and credit cards to get started. The
              full dashboard with onboarding flow and metrics will be built in
              Phase 6.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/dashboard/accounts">View Accounts</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/automations">View Automations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AutomationsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Automations</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Create and manage your automatic transfers here. Full
              implementation in Phases 4-5.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/_app/scheduled")({
  component: () => (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <h1 className="font-display text-3xl font-bold">Scheduled Emails</h1>
      <p className="text-sm text-muted-foreground">Upcoming and past campaigns.</p>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <Construction className="mx-auto h-10 w-10 text-muted-foreground" />
      </div>
    </div>
  ),
});

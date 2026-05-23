import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

function Stub({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <Construction className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Coming next — see chat for what's shipped.</p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/lists")({
  component: () => <Stub title="Recipient Lists" desc="Upload Excel/CSV files and manage recipient groups." />,
});

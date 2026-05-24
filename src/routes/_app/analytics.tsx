import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCampaigns } from "@/lib/campaigns.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_app/analytics")({ component: Analytics });

function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 100) : 0; }

function Analytics() {
  const fn = useServerFn(listCampaigns);
  const { data: items = [] } = useQuery({ queryKey: ["campaigns"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <h1 className="font-display text-3xl font-bold">Analytics</h1>
      <p className="text-sm text-muted-foreground">Open and click performance per campaign.</p>

      <div className="mt-8 space-y-3">
        {items.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No campaigns yet.</CardContent></Card>}
        {items.map((c: any) => (
          <Card key={c.id} className="shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
            <CardContent className="py-5">
              <div className="flex items-center justify-between gap-3">
                <Link to="/analytics/$id" params={{ id: c.id }} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium hover:text-primary">{c.name}</h3>
                    <Badge variant="secondary">{c.status}</Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{c.subject}</p>
                </Link>
                <div className="text-right text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
                <Link to="/analytics/$id" params={{ id: c.id }}>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                {[
                  ["Sent", `${c.sent_count}/${c.total_recipients}`],
                  ["Opens", `${c.open_count} (${pct(c.open_count, c.sent_count)}%)`],
                  ["Clicks", `${c.click_count} (${pct(c.click_count, c.sent_count)}%)`],
                  ["Failed", String(c.failed_count)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-accent/40 p-3">
                    <div className="text-xs text-muted-foreground">{l}</div>
                    <div className="font-display text-lg font-semibold">{v}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { getCampaignAnalytics } from "@/lib/campaigns.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, Eye, MousePointerClick, Check, X } from "lucide-react";

export const Route = createFileRoute("/_app/analytics/$id")({ component: CampaignAnalytics });

function fmt(d: string | null) { return d ? new Date(d).toLocaleString() : "—"; }

function StatusBadge({ status }: { status: string }) {
  if (status === "sent" || status === "delivered") return <Badge className="bg-success/15 text-success">Delivered</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  if (status === "queued") return <Badge variant="secondary">Queued</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function CampaignAnalytics() {
  const { id } = Route.useParams();
  const fn = useServerFn(getCampaignAnalytics);
  const { data } = useQuery({ queryKey: ["campaign-analytics", id], queryFn: () => fn({ data: { id } }) });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const campaign = data?.campaign;
  const recipients = data?.recipients ?? [];
  const events = data?.events ?? [];
  const selected = recipients.find((r: any) => r.id === selectedId);
  const selectedEvents = useMemo(
    () => events.filter((e: any) => e.campaign_recipient_id === selectedId),
    [events, selectedId],
  );

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <Link to="/analytics" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> All campaigns
      </Link>

      <div className="mt-4">
        <h1 className="font-display text-3xl font-bold">{campaign?.name ?? "Campaign"}</h1>
        <p className="text-sm text-muted-foreground">{campaign?.subject}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Sent", `${campaign?.sent_count ?? 0}/${campaign?.total_recipients ?? 0}`],
          ["Opens", String(campaign?.open_count ?? 0)],
          ["Clicks", String(campaign?.click_count ?? 0)],
          ["Failed", String(campaign?.failed_count ?? 0)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="text-xs text-muted-foreground">{l}</div>
            <div className="mt-1 font-display text-2xl font-semibold">{v}</div>
          </div>
        ))}
      </div>

      <Card className="mt-6 shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="w-32">Delivered</TableHead>
                <TableHead className="w-24">Opened</TableHead>
                <TableHead className="w-24">Clicked</TableHead>
                <TableHead className="w-20">Opens</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No recipients yet.</TableCell></TableRow>
              )}
              {recipients.map((r: any) => {
                const last = events.find((e: any) => e.campaign_recipient_id === r.id);
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedId(r.id)}>
                    <TableCell>
                      <div className="font-medium">{r.email}</div>
                      {r.name && <div className="text-xs text-muted-foreground">{r.name}</div>}
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>{r.opens > 0 ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>{r.clicks > 0 ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>{r.opens}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmt(last?.created_at ?? r.sent_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedId} onOpenChange={(v) => !v && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle className="truncate">{selected?.email}</SheetTitle></SheetHeader>
          {selected && (
            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-accent/40 p-3">
                  <div className="text-xs text-muted-foreground">Delivery</div>
                  <div className="mt-1"><StatusBadge status={selected.status} /></div>
                </div>
                <div className="rounded-lg bg-accent/40 p-3">
                  <div className="text-xs text-muted-foreground">Sent at</div>
                  <div className="mt-1 text-sm">{fmt(selected.sent_at)}</div>
                </div>
              </div>
              {selected.error_message && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {selected.error_message}
                </div>
              )}
              <div>
                <h3 className="mb-2 text-sm font-semibold">Activity timeline</h3>
                {selectedEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No opens or clicks yet.</p>
                ) : (
                  <ol className="space-y-3 border-l border-border pl-4">
                    {selectedEvents.map((e: any, i: number) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[21px] top-1 grid h-4 w-4 place-items-center rounded-full bg-card ring-2 ring-primary">
                          {e.event_type === "click" ? <MousePointerClick className="h-2.5 w-2.5 text-primary" /> : <Eye className="h-2.5 w-2.5 text-primary" />}
                        </span>
                        <div className="text-sm font-medium capitalize">{e.event_type}</div>
                        <div className="text-xs text-muted-foreground">{fmt(e.created_at)}</div>
                        {e.url && <div className="mt-0.5 truncate text-xs text-primary">{e.url}</div>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

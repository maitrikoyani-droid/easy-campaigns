import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listCampaigns, cancelCampaign } from "@/lib/campaigns.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, X } from "lucide-react";

export const Route = createFileRoute("/_app/scheduled")({ component: Scheduled });

function Scheduled() {
  const qc = useQueryClient();
  const fn = useServerFn(listCampaigns);
  const fnCancel = useServerFn(cancelCampaign);
  const { data: all = [] } = useQuery({ queryKey: ["campaigns"], queryFn: () => fn() });
  const items = all.filter((c: any) => ["scheduled", "sending"].includes(c.status));

  const cancel = useMutation({
    mutationFn: (id: string) => fnCancel({ data: { id } }),
    onSuccess: () => { toast.success("Cancelled"); qc.invalidateQueries({ queryKey: ["campaigns"] }); },
  });

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <h1 className="font-display text-3xl font-bold">Scheduled</h1>
      <p className="text-sm text-muted-foreground">Campaigns queued and in-flight.</p>
      <div className="mt-8 space-y-3">
        {items.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">Nothing scheduled.</CardContent></Card>}
        {items.map((c: any) => (
          <Card key={c.id} className="shadow-[var(--shadow-card)]">
            <CardContent className="flex items-center justify-between gap-4 py-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-medium">{c.name}</h3>
                  <Badge variant={c.status === "sending" ? "default" : "secondary"}>{c.status}</Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">{c.subject}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {c.scheduled_at && <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {new Date(c.scheduled_at).toLocaleString()}</span>}
                  <span>{c.sent_count}/{c.total_recipients} sent</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => cancel.mutate(c.id)}>
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

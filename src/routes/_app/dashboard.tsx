import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Send, MousePointerClick, Eye, XCircle, Plus } from "lucide-react";
import { getDashboardStats } from "@/lib/campaigns.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Stat({ icon: Icon, label, value, tone = "default" }: { icon: any; label: string; value: number | string; tone?: "default" | "success" | "warning" | "destructive" }) {
  const toneCls = {
    default: "bg-accent text-accent-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    destructive: "bg-destructive/15 text-destructive",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${toneCls}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function Dashboard() {
  const fn = useServerFn(getDashboardStats);
  const { data } = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => fn() });
  const s = data ?? { sent: 0, delivered: 0, opens: 0, clicks: 0, failed: 0, campaigns: 0 };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your email activity</p>
        </div>
        <Link to="/campaigns/new"><Button><Plus className="mr-1 h-4 w-4" /> New campaign</Button></Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Stat icon={Send} label="Sent" value={s.sent} />
        <Stat icon={Mail} label="Delivered" value={s.delivered} tone="success" />
        <Stat icon={Eye} label="Opens" value={s.opens} />
        <Stat icon={MousePointerClick} label="Clicks" value={s.clicks} />
        <Stat icon={XCircle} label="Failed" value={s.failed} tone="destructive" />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <h2 className="font-display text-xl font-semibold">Ready to send your first campaign?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Connect your SMTP in Settings, upload a list, and start sending.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link to="/settings"><Button variant="outline">SMTP Settings</Button></Link>
          <Link to="/lists"><Button variant="outline">Upload list</Button></Link>
          <Link to="/campaigns/new"><Button>New campaign</Button></Link>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { listLists } from "@/lib/lists.functions";
import { listTemplates } from "@/lib/templates.functions";
import { createCampaign, checkSpamWords } from "@/lib/campaigns.functions";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Send, CalendarClock, Eye, Paperclip, Upload, X, FileText, FileSpreadsheet, FileArchive, Image as ImageIcon, File as FileIcon } from "lucide-react";

export const Route = createFileRoute("/_app/campaigns/new")({ component: NewCampaign });

function NewCampaign() {
  const router = useRouter();
  const fnLists = useServerFn(listLists);
  const fnTpl = useServerFn(listTemplates);
  const fnCreate = useServerFn(createCampaign);
  const fnSpam = useServerFn(checkSpamWords);

  const { data: lists = [] } = useQuery({ queryKey: ["lists"], queryFn: () => fnLists() });
  const { data: templates = [] } = useQuery({ queryKey: ["templates"], queryFn: () => fnTpl() });

  const [form, setForm] = useState({
    name: "", subject: "", html: "", from_name: "", reply_to: "",
    list_id: "", batch_size: 20, batch_delay_seconds: 60,
    scheduled_at: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [mode, setMode] = useState<"now" | "later">("now");
  const [spam, setSpam] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (!form.subject && !form.html) return;
      try {
        const res = await fnSpam({ data: { text: `${form.subject}\n${form.html}` } });
        setSpam(res.hits);
      } catch {}
    }, 500);
    return () => clearTimeout(id);
  }, [form.subject, form.html]);

  const useTemplate = (id: string) => {
    const t = templates.find((x: any) => x.id === id);
    if (t) setForm((f) => ({ ...f, subject: t.subject || f.subject, html: t.html || f.html, name: f.name || t.name }));
  };

  const create = useMutation({
    mutationFn: () => fnCreate({
      data: {
        ...form,
        scheduled_at: mode === "later" && form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        send_now: mode === "now",
      },
    }),
    onSuccess: (r) => {
      toast.success(mode === "now" ? "Sending started!" : "Campaign scheduled");
      router.navigate({ to: r.status === "scheduled" ? "/scheduled" : "/dashboard" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const previewHtml = form.html
    .replace(/\{\{\s*name\s*\}\}/g, "Alex")
    .replace(/\{\{\s*company\s*\}\}/g, "Acme Inc")
    .replace(/\{\{\s*email\s*\}\}/g, "alex@acme.com");

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <h1 className="font-display text-3xl font-bold">New Campaign</h1>
      <p className="text-sm text-muted-foreground">Compose, personalize, and send to a list.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Compose</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Campaign name (internal)</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Q4 launch" />
              </div>
              <div>
                <Label>From name</Label>
                <Input value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} placeholder="Defaults to SMTP from name" />
              </div>
              <div>
                <Label>Reply-to (optional)</Label>
                <Input type="email" value={form.reply_to} onChange={(e) => setForm({ ...form, reply_to: e.target.value })} />
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Hi {{name}}, a quick idea for {{company}}" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>HTML body</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(!preview)}>
                    <Eye className="mr-1 h-4 w-4" /> {preview ? "Edit" : "Preview"}
                  </Button>
                </div>
                {preview ? (
                  <div className="min-h-[280px] rounded-md border border-border bg-card p-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <Textarea rows={14} className="font-mono text-xs" value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} placeholder="<p>Hi {{name}},</p>..." />
                )}
                <p className="mt-1 text-xs text-muted-foreground">Tokens: {"{{name}}"}, {"{{company}}"}, {"{{email}}"}</p>
              </div>

              {spam.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-warning-foreground" />
                  <div>
                    <strong>Spam trigger words detected:</strong> {spam.join(", ")}.
                    <div className="text-xs text-muted-foreground">Consider rewriting to improve inbox placement.</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Audience</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Recipient list</Label>
                <Select value={form.list_id} onValueChange={(v) => setForm({ ...form, list_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose list" /></SelectTrigger>
                  <SelectContent>
                    {lists.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name} ({l.count})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {templates.length > 0 && (
                <div>
                  <Label>Use template (optional)</Label>
                  <Select onValueChange={useTemplate}>
                    <SelectTrigger><SelectValue placeholder="Pick template" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Throttle</CardTitle><CardDescription>Better inbox delivery for cold lists.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Batch size</Label>
                <Input type="number" value={form.batch_size} onChange={(e) => setForm({ ...form, batch_size: +e.target.value })} />
              </div>
              <div>
                <Label>Delay between batches (sec)</Label>
                <Input type="number" value={form.batch_delay_seconds} onChange={(e) => setForm({ ...form, batch_delay_seconds: +e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>Send later</span>
                <Switch checked={mode === "later"} onCheckedChange={(v) => setMode(v ? "later" : "now")} />
              </div>
              {mode === "later" && (
                <>
                  <div>
                    <Label>Date & time</Label>
                    <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
                  </div>
                  <div className="text-xs text-muted-foreground">Timezone: {form.timezone}</div>
                </>
              )}
              <Button className="w-full" disabled={!form.list_id || !form.subject || !form.html || !form.name || create.isPending} onClick={() => create.mutate()}>
                {mode === "now" ? <><Send className="mr-2 h-4 w-4" /> Send now</> : <><CalendarClock className="mr-2 h-4 w-4" /> Schedule</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

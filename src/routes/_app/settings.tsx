import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSmtp, saveSmtp, testSmtp } from "@/lib/smtp.functions";
import { Loader2, Send, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

const PRESETS: Record<string, { host: string; port: number; secure: boolean }> = {
  gmail: { host: "smtp.gmail.com", port: 587, secure: false },
  outlook: { host: "smtp.office365.com", port: 587, secure: false },
  sendgrid: { host: "smtp.sendgrid.net", port: 587, secure: false },
  mailgun: { host: "smtp.mailgun.org", port: 587, secure: false },
  ses: { host: "email-smtp.us-east-1.amazonaws.com", port: 587, secure: false },
  custom: { host: "", port: 587, secure: false },
};

function SettingsPage() {
  const qc = useQueryClient();
  const fnGet = useServerFn(getSmtp);
  const fnSave = useServerFn(saveSmtp);
  const fnTest = useServerFn(testSmtp);
  const { data, isLoading } = useQuery({ queryKey: ["smtp"], queryFn: () => fnGet() });

  const [form, setForm] = useState({
    provider: "gmail", host: "smtp.gmail.com", port: 587, secure: false,
    username: "", password: "", from_email: "", from_name: "",
  });
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    if (data) setForm({
      provider: data.provider, host: data.host, port: data.port, secure: data.secure,
      username: data.username, password: data.password,
      from_email: data.from_email, from_name: data.from_name || "",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => fnSave({ data: { ...form, from_name: form.from_name || null } }),
    onSuccess: () => { toast.success("SMTP saved"); qc.invalidateQueries({ queryKey: ["smtp"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const test = useMutation({
    mutationFn: () => fnTest({ data: { to: testEmail } }),
    onSuccess: () => toast.success("Test email sent! Check the inbox."),
    onError: (e: any) => toast.error(e.message),
  });

  const onProvider = (p: string) => {
    const preset = PRESETS[p];
    setForm((f) => ({ ...f, provider: p, ...preset }));
  };

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <p className="text-sm text-muted-foreground">Connect your SMTP for better inbox delivery.</p>

      <Card className="mt-6 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> SMTP Configuration</CardTitle>
          <CardDescription>Use your own SMTP — emails are sent from your domain for the best deliverability.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Provider</Label>
                  <Select value={form.provider} onValueChange={onProvider}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="outlook">Outlook / Microsoft 365</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">Amazon SES</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Port</Label>
                    <Input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: +e.target.value })} />
                  </div>
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <Switch checked={form.secure} onCheckedChange={(v) => setForm({ ...form, secure: v })} /> SSL
                  </label>
                </div>
              </div>

              <div>
                <Label>SMTP Host</Label>
                <Input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Username</Label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="you@domain.com" />
                </div>
                <div>
                  <Label>Password / App Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>From email</Label>
                  <Input type="email" value={form.from_email} onChange={(e) => setForm({ ...form, from_email: e.target.value })} placeholder="hello@yourdomain.com" />
                </div>
                <div>
                  <Label>From name</Label>
                  <Input value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} placeholder="Your Brand" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save settings
                </Button>
                <div className="flex flex-1 items-center gap-2">
                  <Input placeholder="Send test to…" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                  <Button variant="outline" onClick={() => test.mutate()} disabled={!testEmail || test.isPending}>
                    <Send className="mr-2 h-4 w-4" /> Test
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Deliverability tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Use a domain with SPF, DKIM, and DMARC configured.</p>
          <p>• Warm up new domains by starting with small batches.</p>
          <p>• Avoid spam-trigger words — Mailwave warns you while composing.</p>
          <p>• Keep batch size 20–50 with a 30–120s delay for cold lists.</p>
        </CardContent>
      </Card>
    </div>
  );
}

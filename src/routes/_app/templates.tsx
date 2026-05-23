import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listTemplates, saveTemplate, deleteTemplate } from "@/lib/templates.functions";
import { FileText, Plus, Trash2, Edit2 } from "lucide-react";

export const Route = createFileRoute("/_app/templates")({ component: TemplatesPage });

function TemplatesPage() {
  const qc = useQueryClient();
  const fnList = useServerFn(listTemplates);
  const fnSave = useServerFn(saveTemplate);
  const fnDel = useServerFn(deleteTemplate);
  const { data: items = [] } = useQuery({ queryKey: ["templates"], queryFn: () => fnList() });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const start = (t?: any) => {
    setEditing(t || { name: "", subject: "", html: "" });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: () => fnSave({ data: editing }),
    onSuccess: () => { toast.success("Template saved"); qc.invalidateQueries({ queryKey: ["templates"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => fnDel({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["templates"] }); },
  });

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Templates</h1>
          <p className="text-sm text-muted-foreground">Reusable HTML email templates with personalization tokens.</p>
        </div>
        <Button onClick={() => start()}><Plus className="mr-2 h-4 w-4" /> New template</Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3"><CardContent className="py-12 text-center text-muted-foreground">No templates yet.</CardContent></Card>
        )}
        {items.map((t: any) => (
          <Card key={t.id} className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2 truncate"><FileText className="h-4 w-4 text-primary" /> {t.name}</span>
              </CardTitle>
              <CardDescription className="truncate">{t.subject}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => start(t)}><Edit2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => confirm("Delete?") && del.mutate(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} template</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={editing.subject || ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="Hi {{name}}, …" />
              </div>
              <div>
                <Label>HTML body</Label>
                <Textarea rows={12} value={editing.html || ""} onChange={(e) => setEditing({ ...editing, html: e.target.value })} className="font-mono text-xs" />
                <p className="mt-1 text-xs text-muted-foreground">Tokens: {"{{name}}"}, {"{{company}}"}, {"{{email}}"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => save.mutate()} disabled={!editing?.name || save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

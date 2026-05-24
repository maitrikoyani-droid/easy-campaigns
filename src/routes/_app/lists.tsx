import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { listLists, createList, deleteList } from "@/lib/lists.functions";
import { Upload, Users, Trash2, Plus, FileSpreadsheet, ArrowRight, X } from "lucide-react";

export const Route = createFileRoute("/_app/lists")({ component: ListsPage });

type Parsed = { email: string; name?: string; company?: string; custom_fields?: Record<string, any> };

function parseFile(file: File): Promise<Parsed[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
        const out: Parsed[] = [];
        for (const r of rows) {
          const keys = Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase().trim(), v]));
          const email = String(keys.email || keys["e-mail"] || keys.mail || "").trim();
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
          const name = String(keys.name || keys["full name"] || keys["first name"] || "").trim() || undefined;
          const company = String(keys.company || keys.organization || "").trim() || undefined;
          const custom: Record<string, any> = {};
          for (const [k, v] of Object.entries(keys)) {
            if (!["email", "name", "company", "e-mail", "mail", "full name", "first name", "organization"].includes(k) && v !== "") {
              custom[k] = v;
            }
          }
          out.push({ email, name, company, custom_fields: custom });
        }
        resolve(out);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function ListsPage() {
  const qc = useQueryClient();
  const fnList = useServerFn(listLists);
  const fnCreate = useServerFn(createList);
  const fnDel = useServerFn(deleteList);
  const { data: lists = [] } = useQuery({ queryKey: ["lists"], queryFn: () => fnList() });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [recipients, setRecipients] = useState<Parsed[]>([]);
  const [pasting, setPasting] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setName(""); setDescription(""); setRecipients([]); setPasting(""); };

  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      const rows = await parseFile(f);
      setRecipients(rows);
      if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
      toast.success(`Parsed ${rows.length} recipients`);
    } catch (e: any) { toast.error("Failed to parse file"); }
  };

  const onPaste = () => {
    const lines = pasting.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const out: Parsed[] = [];
    for (const line of lines) {
      const [email, n, c] = line.split(/[,\t]/).map((x) => x?.trim());
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        out.push({ email, name: n, company: c });
      }
    }
    setRecipients(out);
    toast.success(`Parsed ${out.length} recipients`);
  };

  const create = useMutation({
    mutationFn: () => fnCreate({ data: { name, description: description || null, recipients } }),
    onSuccess: () => {
      toast.success("List created");
      qc.invalidateQueries({ queryKey: ["lists"] });
      setOpen(false); reset();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => fnDel({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["lists"] }); },
  });

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Recipient Lists</h1>
          <p className="text-sm text-muted-foreground">Upload Excel/CSV or paste emails. Personalization tokens: <code>{"{{name}}"}</code>, <code>{"{{company}}"}</code>.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New list</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create recipient list</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Q4 prospects" />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
                <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Upload Excel / CSV</p>
                <p className="text-xs text-muted-foreground">Columns: email, name, company (extra cols become custom fields)</p>
                <input ref={fileRef} type="file" hidden accept=".xlsx,.xls,.csv" onChange={(e) => onFile(e.target.files?.[0])} />
                <Button variant="outline" className="mt-3" onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Choose file
                </Button>
              </div>

              <div>
                <Label>Or paste rows (email, name, company per line)</Label>
                <Textarea rows={5} value={pasting} onChange={(e) => setPasting(e.target.value)} placeholder="alice@acme.com, Alice, Acme" />
                <Button variant="ghost" size="sm" className="mt-1" onClick={onPaste}>Parse pasted rows</Button>
              </div>

              {recipients.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span><strong>{recipients.length}</strong> recipients ready ·{" "}
                      <span className="text-success">{recipients.filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)).length} valid</span>
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setRecipients([])}>Clear</Button>
                  </div>
                  <div className="max-h-64 overflow-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Company</TableHead>
                        <TableHead className="w-20">Status</TableHead><TableHead className="w-10"></TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {recipients.slice(0, 200).map((r, i) => {
                          const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email);
                          return (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs">{r.email}</TableCell>
                              <TableCell className="text-sm">{r.name || "—"}</TableCell>
                              <TableCell className="text-sm">{r.company || "—"}</TableCell>
                              <TableCell>{valid ? <Badge className="bg-success/15 text-success">Valid</Badge> : <Badge variant="destructive">Invalid</Badge>}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => setRecipients(recipients.filter((_, idx) => idx !== i))}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {recipients.length > 200 && <p className="text-xs text-muted-foreground">Showing first 200 of {recipients.length}.</p>}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
                Create list
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lists.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3"><CardContent className="py-12 text-center text-muted-foreground">No lists yet. Create one to start sending.</CardContent></Card>
        )}
        {lists.map((l: any) => (
          <Card key={l.id} className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="truncate">{l.name}</span>
                <Button variant="ghost" size="icon" onClick={() => confirm("Delete list?") && del.mutate(l.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardTitle>
              {l.description && <CardDescription className="line-clamp-2">{l.description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" /> {l.count} recipients
              </div>
              <Link to="/lists/$id" params={{ id: l.id }}>
                <Button variant="ghost" size="sm">Open <ArrowRight className="ml-1 h-3 w-3" /></Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

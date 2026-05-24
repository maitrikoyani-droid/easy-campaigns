import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getList, addRecipient, updateRecipient, deleteRecipient } from "@/lib/lists.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Plus, Trash2, X, Pencil } from "lucide-react";

export const Route = createFileRoute("/_app/lists/$id")({ component: ListDetail });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ListDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fnGet = useServerFn(getList);
  const fnAdd = useServerFn(addRecipient);
  const fnUpd = useServerFn(updateRecipient);
  const fnDel = useServerFn(deleteRecipient);

  const { data } = useQuery({ queryKey: ["list", id], queryFn: () => fnGet({ data: { id } }) });
  const recipients = data?.recipients ?? [];
  const list = data?.list;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ email: "", name: "", company: "" });
  const [adding, setAdding] = useState({ email: "", name: "", company: "" });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["list", id] });

  const add = useMutation({
    mutationFn: () => fnAdd({ data: { list_id: id, ...adding } }),
    onSuccess: () => { toast.success("Added"); setAdding({ email: "", name: "", company: "" }); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const upd = useMutation({
    mutationFn: (rid: string) => fnUpd({ data: { id: rid, ...draft } }),
    onSuccess: () => { toast.success("Saved"); setEditingId(null); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (rid: string) => fnDel({ data: { id: rid } }),
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
  });

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setDraft({ email: r.email, name: r.name || "", company: r.company || "" });
  };

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <Link to="/lists" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to lists
      </Link>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{list?.name ?? "List"}</h1>
          {list?.description && <p className="text-sm text-muted-foreground">{list.description}</p>}
        </div>
        <Badge variant="secondary">{recipients.length} recipients</Badge>
      </div>

      <Card className="mt-6 shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-accent/30">
                <TableCell><Input placeholder="email@domain.com" value={adding.email} onChange={(e) => setAdding({ ...adding, email: e.target.value })} /></TableCell>
                <TableCell><Input placeholder="Name" value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} /></TableCell>
                <TableCell><Input placeholder="Company" value={adding.company} onChange={(e) => setAdding({ ...adding, company: e.target.value })} /></TableCell>
                <TableCell>
                  {adding.email ? (EMAIL_RE.test(adding.email) ? <Badge className="bg-success/15 text-success">Valid</Badge> : <Badge variant="destructive">Invalid</Badge>) : null}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" disabled={!EMAIL_RE.test(adding.email) || add.isPending} onClick={() => add.mutate()}>
                    <Plus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </TableCell>
              </TableRow>

              {recipients.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No recipients yet. Add your first one above.</TableCell></TableRow>
              )}

              {recipients.map((r: any) => {
                const isEditing = editingId === r.id;
                const valid = EMAIL_RE.test(isEditing ? draft.email : r.email);
                return (
                  <TableRow key={r.id}>
                    <TableCell>{isEditing ? <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /> : <span className="font-mono text-sm">{r.email}</span>}</TableCell>
                    <TableCell>{isEditing ? <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /> : (r.name || <span className="text-muted-foreground">—</span>)}</TableCell>
                    <TableCell>{isEditing ? <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /> : (r.company || <span className="text-muted-foreground">—</span>)}</TableCell>
                    <TableCell>{valid ? <Badge className="bg-success/15 text-success">Valid</Badge> : <Badge variant="destructive">Invalid</Badge>}</TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => upd.mutate(r.id)} disabled={!valid}><Check className="h-4 w-4 text-success" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(r)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => confirm("Delete recipient?") && del.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Personalization tokens available in your templates: <code>{"{{name}}"}</code>, <code>{"{{company}}"}</code>, <code>{"{{email}}"}</code>.
      </p>
    </div>
  );
}

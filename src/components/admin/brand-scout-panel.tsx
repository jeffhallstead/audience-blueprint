import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteTeardown, listTeardowns, runTeardown } from "@/lib/brand-scout/brand-scout.functions";
import { getPublisherPattern } from "@/lib/publisher-patterns";
import { CATEGORIES } from "@/lib/assessment/config";

const empty = {
  brandName: "", website: "", handles: "", vertical: "beauty" as const,
  editorialNewsletter: false, recurringSeries: false, heavyPaid: false, activeCommunity: false, notes: "",
};
type Form = Omit<typeof empty, "vertical"> & { vertical: "beauty" | "fashion" | "food" | "wellness" | "other" };
type Row = Awaited<ReturnType<typeof listTeardowns>>[number];

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
}

export function BrandScoutPanel() {
  const qc = useQueryClient();
  const list = useServerFn(listTeardowns);
  const run = useServerFn(runTeardown);
  const del = useServerFn(deleteTeardown);
  const [form, setForm] = useState<Form>(empty);
  const [active, setActive] = useState<Row | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const history = useQuery({ queryKey: ["brand-teardowns"], queryFn: () => list() });

  useEffect(() => {
    setSubject(active?.email_subject ?? "");
    setBody(active?.email_body ?? "");
  }, [active]);

  const mutation = useMutation({
    mutationFn: () => run({ data: form }),
    onSuccess: (row) => { setActive(row); qc.invalidateQueries({ queryKey: ["brand-teardowns"] }); toast.success("Teardown ready"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: (_r, id) => { if (active?.id === id) setActive(null); qc.invalidateQueries({ queryKey: ["brand-teardowns"] }); },
  });

  const flag = (k: "editorialNewsletter" | "recurringSeries" | "heavyPaid" | "activeCommunity", label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={form[k]} onCheckedChange={(v) => setForm({ ...form, [k]: v === true })} />
      {label}
    </label>
  );

  const pattern = active ? getPublisherPattern(active.pattern_id) : undefined;
  const dims = (active?.dimension_scores ?? {}) as Record<string, number>;
  const priorities = (active?.priorities ?? []) as { title: string; detail: string }[];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="font-serif">Brand Scout</CardTitle>
            <p className="text-sm text-muted-foreground">Enter what you can see publicly. Get a scored diagnosis and an email teardown.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="bs-name">Brand name</Label>
              <Input id="bs-name" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="bs-web">Website</Label>
                <Input id="bs-web" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Vertical</Label>
                <Select value={form.vertical} onValueChange={(v) => setForm({ ...form, vertical: v as Form["vertical"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["beauty", "fashion", "food", "wellness", "other"].map((v) => (
                      <SelectItem key={v} value={v} className="capitalize">{v[0].toUpperCase() + v.slice(1)}</SelectItem>))}
                  </SelectContent>
                </Select></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="bs-handles">Social handles & reach</Label>
              <Input id="bs-handles" placeholder="IG 150k, TikTok 40k sporadic" value={form.handles} onChange={(e) => setForm({ ...form, handles: e.target.value })} /></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {flag("editorialNewsletter", "Editorial newsletter")}
              {flag("recurringSeries", "Recurring series")}
              {flag("heavyPaid", "Heavy paid ads")}
              {flag("activeCommunity", "Active community")}
            </div>
            <div className="space-y-1.5"><Label htmlFor="bs-notes">What you noticed</Label>
              <Textarea id="bs-notes" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button className="w-full" disabled={!form.brandName.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</> : "Run teardown"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-serif text-base">Past teardowns</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {(history.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
            {(history.data ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0">
                <button className="min-w-0 flex-1 text-left text-sm hover:underline" onClick={() => setActive(r)}>
                  <span className="font-medium">{r.brand_name}</span>
                  <span className="text-muted-foreground"> · {r.overall_score} · {getPublisherPattern(r.pattern_id)?.name ?? r.pattern_id}</span>
                </button>
                <Button size="icon" variant="ghost" aria-label="Delete teardown" onClick={() => remove.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          {!active ? <p className="text-sm text-muted-foreground">Run a teardown or open a past one to see results here.</p> : (
            <>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{active.brand_name}</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-serif text-5xl">{active.overall_score}</span>
                  <span className="text-sm text-muted-foreground">Estimated Publisher Index</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <div key={c.id}>
                    <div className="flex justify-between text-xs"><span>{c.label}</span><span>{dims[c.id] ?? 0}</span></div>
                    <div className="mt-1 h-1.5 bg-muted"><div className="h-full bg-primary" style={{ width: `${dims[c.id] ?? 0}%` }} /></div>
                  </div>))}
              </div>
              <div>
                <p className="font-serif text-lg">{pattern?.name ?? active.pattern_id}</p>
                <p className="text-sm text-muted-foreground">{active.pattern_reason}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Top 90-day priorities</p>
                {priorities.map((p, i) => (
                  <div key={i} className="text-sm"><span className="font-medium">{i + 1}. {p.title}</span> — {p.detail}</div>))}
              </div>
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between"><Label htmlFor="bs-subj">Email subject</Label>
                  <Button size="sm" variant="outline" onClick={() => copy(subject, "Subject")}><Copy className="mr-1 h-3.5 w-3.5" />Copy</Button></div>
                <Input id="bs-subj" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <div className="flex items-center justify-between"><Label htmlFor="bs-body">Email body</Label>
                  <Button size="sm" variant="outline" onClick={() => copy(body, "Email")}><Copy className="mr-1 h-3.5 w-3.5" />Copy</Button></div>
                <Textarea id="bs-body" rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

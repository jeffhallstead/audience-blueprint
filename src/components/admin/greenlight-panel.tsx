import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MAX_SCORE, PATTERN_LABELS, VERDICT_LABELS, type PatternId, type Verdict } from "@/lib/microdrama/greenlight";

type Filter = "all" | Verdict | "referral";

export function GreenlightPanel() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "greenlight"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("microdrama_greenlight_checks")
        .select("id,email,company,score,pattern_id,verdict,condition_met,enterprise_referral,blockers,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
  const rows = (data ?? []).filter((r) =>
    filter === "all" ? true : filter === "referral" ? r.enterprise_referral : r.verdict === filter,
  );
  const filters: [Filter, string][] = [
    ["all", "All"],
    ["green_light", "Green Light"],
    ["not_yet", "Not Yet"],
    ["no", "No"],
    ["referral", "Enterprise referral"],
  ];
  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>Microdrama Greenlight leads</CardTitle>
        <div className="flex flex-wrap gap-2">
          {filters.map(([v, l]) => (
            <Button key={v} size="sm" variant={filter === v ? "default" : "outline"} onClick={() => setFilter(v)}>
              {l}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-destructive">Couldn't load submissions.</p>}
        {!isLoading && rows.length === 0 && <p className="text-sm text-muted-foreground">No submissions yet.</p>}
        {rows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Company</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Verdict</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Growth model</th>
                <th className="py-2 pr-4">Condition</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="py-2 pr-4 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">{r.company}</td>
                  <td className="py-2 pr-4">
                    <a className="underline" href={`mailto:${r.email}`}>{r.email}</a>
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant={r.verdict === "green_light" ? "default" : "outline"}>
                      {VERDICT_LABELS[r.verdict as Verdict]}
                    </Badge>
                    {r.enterprise_referral && <Badge variant="secondary" className="ml-1">Referral</Badge>}
                  </td>
                  <td className="py-2 pr-4">{r.score}/{MAX_SCORE}</td>
                  <td className="py-2 pr-4">{PATTERN_LABELS[r.pattern_id as PatternId] ?? r.pattern_id}</td>
                  <td className="py-2 pr-4">{r.condition_met ? "Met" : "Not met"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

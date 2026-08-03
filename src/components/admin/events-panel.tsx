import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, RefreshCw } from "lucide-react";

import { listPlatformEvents } from "@/lib/admin/insights.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const WINDOWS = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
  { label: "30d", hours: 720 },
];

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function summarize(payloadJson: string) {
  try {
    const parsed = JSON.parse(payloadJson) as Record<string, unknown>;
    const entries = Object.entries(parsed).filter(([, value]) => value !== null && value !== "");
    if (entries.length === 0) return "—";
    return entries
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${typeof value === "object" ? "…" : String(value)}`)
      .join(" · ");
  } catch {
    return "—";
  }
}

export function EventsPanel() {
  const fetchEvents = useServerFn(listPlatformEvents);
  const [hours, setHours] = useState(168);
  const [eventType, setEventType] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "events", hours, eventType, search],
    queryFn: () => fetchEvents({ data: { hours, eventType: eventType ?? undefined, search } }),
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {WINDOWS.map((w) => (
          <Button
            key={w.hours}
            size="sm"
            variant={hours === w.hours ? "secondary" : "ghost"}
            onClick={() => setHours(w.hours)}
          >
            {w.label}
          </Button>
        ))}
        <form
          className="flex flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(term.trim());
          }}
        >
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Filter by event type or user email"
          />
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
        <Button size="sm" variant="ghost" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            Event types in window
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (data?.types ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded in this window.</p>
          ) : (
            <>
              <Button
                size="sm"
                variant={eventType === null ? "secondary" : "ghost"}
                onClick={() => setEventType(null)}
              >
                All
              </Button>
              {(data?.types ?? []).map((t) => (
                <Button
                  key={t.type}
                  size="sm"
                  variant={eventType === t.type ? "secondary" : "ghost"}
                  onClick={() => setEventType(t.type)}
                >
                  {t.type}
                  <Badge variant="secondary" className="ml-2 tabular-nums">
                    {t.count}
                  </Badge>
                </Button>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (data?.events ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing matches these filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Payload</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.events ?? []).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.eventType}</TableCell>
                    <TableCell className="text-muted-foreground">{event.userEmail ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{event.source}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[22rem] truncate text-muted-foreground">
                      {summarize(event.payloadJson)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{when(event.occurredAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

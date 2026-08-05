import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { listFeedback } from "@/lib/feedback/feedback.functions";
import { FEEDBACK_SENTIMENT_LABEL } from "@/lib/feedback/types";
import { Badge } from "@/components/ui/badge";
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

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Admin view of in-app feedback submissions. */
export function FeedbackPanel() {
  const fetchFeedback = useServerFn(listFeedback);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: () => fetchFeedback(),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((row) =>
      [row.email, row.fullName, row.comment, row.page, row.sentiment]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [data, search]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>User feedback</CardTitle>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search feedback"
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No feedback yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="align-top">
                    <div className="font-medium">{row.fullName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{row.email ?? row.userId}</div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant="secondary">
                      {FEEDBACK_SENTIMENT_LABEL[row.sentiment] ?? row.sentiment}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md whitespace-pre-wrap align-top text-sm">
                    {row.comment}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {row.page ?? "—"}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {shortDate(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

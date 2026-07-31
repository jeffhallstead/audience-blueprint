import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { RoadmapItem } from "@/lib/placeholder-blueprint";

/** Inline-editable roadmap initiative. */
export function RoadmapCard({
  item,
  onChange,
}: {
  item: RoadmapItem;
  onChange: (next: RoadmapItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);

  if (editing) {
    return (
      <div className="surface-panel space-y-3 p-5">
        <Input
          value={draft.title}
          aria-label="Initiative title"
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
        <Textarea
          rows={3}
          value={draft.description}
          aria-label="Initiative description"
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
        <Input
          value={draft.owner}
          aria-label="Initiative owner"
          onChange={(event) => setDraft({ ...draft, owner: event.target.value })}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft(item);
              setEditing(false);
            }}
          >
            <X className="size-4" /> Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onChange(draft);
              setEditing(false);
            }}
          >
            <Check className="size-4" /> Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel group flex items-start justify-between gap-4 p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold tracking-tight text-foreground">{item.title}</h4>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            {item.owner}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${item.title}`}
        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => setEditing(true)}
      >
        <Pencil className="size-4" />
      </Button>
    </div>
  );
}

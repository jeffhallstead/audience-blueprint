import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AnswerValue, Question } from "@/lib/wizard-config";

/** Renders one wizard question from configuration. */
export function QuestionCard({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}) {
  const id = `q-${question.key}`;
  const selected = Array.isArray(value) ? value : [];

  return (
    <div className="grid gap-3 border-b border-border py-6 last:border-b-0 sm:grid-cols-[minmax(0,18rem)_1fr] sm:gap-8">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {question.label}
          {question.required ? <span className="ml-1 text-brass">*</span> : null}
        </Label>
        {question.help ? <p className="text-xs text-muted-foreground">{question.help}</p> : null}
      </div>

      <div>
        {question.type === "text" || question.type === "number" ? (
          <Input
            id={id}
            type={question.type === "number" ? "number" : "text"}
            inputMode={question.type === "number" ? "numeric" : undefined}
            placeholder={question.placeholder}
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : null}

        {question.type === "textarea" ? (
          <Textarea
            id={id}
            rows={4}
            placeholder={question.placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : null}

        {question.type === "select" ? (
          <Select value={typeof value === "string" ? value : ""} onValueChange={onChange}>
            <SelectTrigger id={id}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {question.type === "scale" ? (
          <div role="radiogroup" aria-label={question.label} className="flex flex-wrap gap-2">
            {question.options?.map((option) => {
              const active = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange(option)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : null}

        {question.type === "multi" ? (
          <div className="flex flex-wrap gap-2">
            {question.options?.map((option) => {
              const active = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange(active ? selected.filter((item) => item !== option) : [...selected, option])
                  }
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active
                      ? "border-brass bg-brass/15 text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-brass/40 hover:text-foreground",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

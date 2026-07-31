import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AnswerValue, QuestionConfig } from "@/lib/assessment/config";

/** Renders one configured assessment question. Fully keyboard accessible. */
export function QuestionField({
  question,
  index,
  value,
  onChange,
  invalid,
}: {
  question: QuestionConfig;
  index: number;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  invalid?: boolean;
}) {
  const id = `q-${question.id}`;
  const describedBy = question.help ? `${id}-help` : undefined;
  const selected = Array.isArray(value) ? value : [];
  const stringValue = value === null || value === undefined ? "" : String(value);

  return (
    <fieldset
      className={cn(
        "grid gap-4 border-b border-border py-7 last:border-b-0 sm:grid-cols-[minmax(0,20rem)_1fr] sm:gap-10",
        invalid && "border-l-2 border-l-destructive pl-4",
      )}
    >
      <div className="space-y-1.5">
        <legend className="sr-only">{question.label}</legend>
        <Label htmlFor={id} className="text-sm leading-relaxed font-medium text-foreground">
          <span className="mr-2 font-mono text-xs text-muted-foreground">{String(index).padStart(2, "0")}</span>
          {question.label}
          {question.required ? (
            <span className="ml-1 text-primary" aria-hidden>
              *
            </span>
          ) : null}
        </Label>
        {question.help ? (
          <p id={describedBy} className="text-xs text-muted-foreground">
            {question.help}
          </p>
        ) : null}
        {invalid ? (
          <p role="alert" className="text-xs text-destructive">
            This answer is required.
          </p>
        ) : null}
      </div>

      <div>
        {question.type === "text" ? (
          question.id === "success_definition" ? (
            <Textarea
              id={id}
              rows={3}
              aria-describedby={describedBy}
              placeholder={question.placeholder}
              value={stringValue}
              onChange={(event) => onChange(event.target.value)}
            />
          ) : (
            <Input
              id={id}
              aria-describedby={describedBy}
              aria-required={question.required}
              placeholder={question.placeholder}
              value={stringValue}
              onChange={(event) => onChange(event.target.value)}
            />
          )
        ) : null}

        {question.type === "url" ? (
          <Input
            id={id}
            type="url"
            inputMode="url"
            aria-describedby={describedBy}
            placeholder={question.placeholder}
            value={stringValue}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : null}

        {question.type === "number" ? (
          <Input
            id={id}
            type="number"
            min={0}
            inputMode="numeric"
            aria-describedby={describedBy}
            aria-required={question.required}
            placeholder={question.placeholder}
            value={stringValue}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : null}

        {question.type === "select" ? (
          <Select value={stringValue} onValueChange={onChange}>
            <SelectTrigger id={id} aria-describedby={describedBy} className="max-w-sm">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {question.type === "single" || question.type === "likert" ? (
          <div
            role="radiogroup"
            aria-label={question.label}
            aria-describedby={describedBy}
            className={cn("flex flex-wrap gap-2", question.type === "likert" && "sm:flex-nowrap")}
          >
            {question.options?.map((option) => {
              const active = stringValue === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange(option.value)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {question.type === "multi" ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label={question.label} aria-describedby={describedBy}>
            {question.options?.map((option) => {
              const active = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange(
                      active ? selected.filter((item) => item !== option.value) : [...selected, option.value],
                    )
                  }
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}

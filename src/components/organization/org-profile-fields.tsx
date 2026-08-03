import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { OrgFieldConfig, OrgProfilePatch } from "@/lib/organization/profile-schema";

interface OrgProfileFieldsProps {
  fields: OrgFieldConfig[];
  values: OrgProfilePatch;
  invalid?: string[];
  onChange: (id: OrgFieldConfig["id"], value: string) => void;
}

/** Shared renderer for organization profile fields (intake + settings). */
export function OrgProfileFields({ fields, values, invalid = [], onChange }: OrgProfileFieldsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {fields.map((field) => {
        const value = values[field.id];
        const stringValue = value === null || value === undefined ? "" : String(value);
        const isInvalid = invalid.includes(field.id);
        return (
          <div key={field.id} className="space-y-2" id={`org-${field.id}`}>
            <Label htmlFor={`org-field-${field.id}`} className="text-sm">
              {field.label}
              {field.required ? <span className="ml-1 text-primary">*</span> : null}
            </Label>
            {field.type === "select" ? (
              <Select value={stringValue} onValueChange={(next) => onChange(field.id, next)}>
                <SelectTrigger
                  id={`org-field-${field.id}`}
                  className={cn(isInvalid && "border-destructive")}
                  aria-invalid={isInvalid}
                >
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`org-field-${field.id}`}
                type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                value={stringValue}
                placeholder={field.placeholder ?? ""}
                aria-invalid={isInvalid}
                className={cn(isInvalid && "border-destructive")}
                onChange={(event) => onChange(field.id, event.target.value)}
              />
            )}
            {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

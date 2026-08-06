import { useState } from "react";
import { ArrowRight, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrgProfileFields } from "./org-profile-fields";
import {
  INTAKE_FIELDS,
  missingIntakeFields,
  type OrgProfilePatch,
} from "@/lib/organization/profile-schema";

interface OrgIntakeStepProps {
  initialValues: OrgProfilePatch;
  saving: boolean;
  onSubmit: (patch: OrgProfilePatch) => void;
}

/**
 * Minimal gate collected before the Publisher Index assessment begins.
 * The remaining profile is requested after the score reveal.
 */
export function OrgIntakeStep({ initialValues, saving, onSubmit }: OrgIntakeStepProps) {
  const [values, setValues] = useState<OrgProfilePatch>(initialValues);
  const [invalid, setInvalid] = useState<string[]>([]);

  function handleContinue() {
    const missing = missingIntakeFields(values);
    if (missing.length) {
      setInvalid(missing.map((field) => field.id));
      document.getElementById(`org-${missing[0]!.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setInvalid([]);
    onSubmit(values);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-eyebrow">Step one of two</p>
        <h1 className="text-display text-4xl">Tell us who we're benchmarking.</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Six details, under a minute. They shape how your Publisher Index is interpreted — and they never change your
          score. You'll complete the rest of your organization profile after your results.
        </p>
      </div>

      <div className="surface-panel space-y-8 p-6 sm:p-10">
        <div className="flex items-center gap-3 border-b border-border pb-5">
          <Building2 className="size-4 text-primary" aria-hidden />
          <p className="text-sm font-medium text-foreground">Organization profile</p>
        </div>
        <OrgProfileFields
          fields={INTAKE_FIELDS}
          values={values}
          invalid={invalid}
          onChange={(id, value) => {
            setValues((prev) => ({ ...prev, [id]: value }));
            setInvalid((prev) => prev.filter((item) => item !== id));
          }}
        />
      </div>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleContinue} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Start the assessment
          {saving ? null : <ArrowRight className="size-4" aria-hidden />}
        </Button>
      </div>
    </div>
  );
}

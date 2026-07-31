import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/blueprint/progress-bar";
import { QuestionCard } from "@/components/blueprint/question-card";
import { useAuth } from "@/hooks/use-auth";
import { submitAssessment } from "@/lib/assessments";
import { TOTAL_STEPS, WIZARD_SECTIONS, type AnswerValue, type WizardAnswers } from "@/lib/wizard-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/wizard")({
  head: () => ({
    meta: [
      { title: "Blueprint Assessment — Owned Audience Blueprint" },
      { name: "description", content: "Complete the seven-section owned-audience readiness assessment." },
      { property: "og:title", content: "Blueprint Assessment" },
      { property: "og:description", content: "Complete the seven-section owned-audience readiness assessment." },
    ],
  }),
  component: Wizard,
});

function Wizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [saving, setSaving] = useState(false);

  const section = WIZARD_SECTIONS[step]!;
  const progress = Math.round((step / TOTAL_STEPS) * 100);
  const isLast = step === TOTAL_STEPS - 1;

  function setAnswer(key: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function goNext() {
    const missing = section.questions.find((question) => question.required && !answers[question.key]);
    if (missing) {
      toast.error(`${missing.label} is required`);
      return;
    }
    if (!isLast) {
      setStep((value) => value + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    void handleSubmit();
  }

  async function handleSubmit() {
    if (!user) return;
    setSaving(true);
    try {
      await submitAssessment(user.id, answers);
      navigate({ to: "/processing" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your assessment");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-eyebrow">
            Section {step + 1} of {TOTAL_STEPS}
          </p>
          <p className="text-xs text-muted-foreground">{progress}% complete</p>
        </div>
        <ProgressBar value={progress} tone="brass" />
        <ol className="flex flex-wrap gap-x-5 gap-y-2">
          {WIZARD_SECTIONS.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => index <= step && setStep(index)}
                disabled={index > step}
                className={cn(
                  "text-xs transition-colors",
                  index === step
                    ? "font-semibold text-foreground"
                    : index < step
                      ? "text-muted-foreground hover:text-foreground"
                      : "cursor-not-allowed text-muted-foreground/50",
                )}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="surface-panel p-6 sm:p-10">
        <div className="space-y-2 border-b border-border pb-6">
          <h1 className="text-display text-3xl">{section.title}</h1>
          <p className="text-sm text-muted-foreground">{section.summary}</p>
        </div>

        <div>
          {section.questions.map((question) => (
            <QuestionCard
              key={question.key}
              question={question}
              value={answers[question.key] ?? null}
              onChange={(value) => setAnswer(question.key, value)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          disabled={step === 0 || saving}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button onClick={goNext} disabled={saving} size="lg">
          {saving ? "Saving…" : isLast ? "Generate blueprint" : "Continue"}
          {isLast ? <Check className="size-4" /> : <ArrowRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

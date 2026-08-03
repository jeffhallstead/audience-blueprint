import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { syncAssessmentCompleted } from "@/lib/integrations/sync.functions";
import { ArrowLeft, ArrowRight, Check, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/blueprint/progress-bar";
import { QuestionField } from "@/components/assessment/question-field";
import { useAuth } from "@/hooks/use-auth";
import {
  ESTIMATED_MINUTES,
  SECTIONS,
  questionsForSection,
  type AnswerValue,
  type AssessmentAnswers,
} from "@/lib/assessment/config";
import { completionPercent, missingRequired } from "@/lib/assessment/scoring";
import {
  completeAssessment,
  getOrCreateAssessment,
  logEvent,
  saveAnswer,
  saveStep,
} from "@/lib/assessment/persistence";
import { OrgIntakeStep } from "@/components/organization/org-intake-step";
import { createOrganization, fetchMyOrganization } from "@/lib/organization/store";
import {
  ORG_FIELDS,
  missingIntakeFields,
  type OrgProfilePatch,
  type OrganizationProfile,
} from "@/lib/organization/profile-schema";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/wizard")({
  head: () => ({
    meta: [
      { title: "Publisher Index Assessment — Publisher Blueprint" },
      {
        name: "description",
        content: "A seven-section executive diagnostic that scores your organization's publishing maturity.",
      },
      { property: "og:title", content: "Publisher Index™ Assessment" },
      { property: "og:description", content: "Score your organization's publishing maturity in under 12 minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Wizard,
});

/** Intro → seven sections → review. Index = SECTIONS.length is the review step. */
const REVIEW_STEP = SECTIONS.length;

function Wizard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const syncAssessment = useServerFn(syncAssessmentCompleted);

  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null);
  const [orgSaving, setOrgSaving] = useState(false);
  const savedTimer = useRef<number | null>(null);

  // Load or resume the in-progress assessment and the organization profile.
  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([getOrCreateAssessment(user.id), fetchMyOrganization(user.id).catch(() => null)])
      .then(([assessment, org]) => {
        if (!active) return;
        setAssessmentId(assessment.id);
        setAnswers(assessment.answers);
        setOrganization(org);
        setStep(Math.min(assessment.currentStep, REVIEW_STEP));
        if (assessment.resumed && Object.keys(assessment.answers).length > 0) {
          setStarted(true);
          toast.success("Welcome back — your progress was restored.");
        }
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Could not start the assessment");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  const intakeComplete = !!organization && missingIntakeFields(organization as OrgProfilePatch).length === 0;

  /** Saves the minimal gate, then prefills the matching assessment answers. */
  async function handleIntake(patch: OrgProfilePatch) {
    if (!user) return;
    setOrgSaving(true);
    try {
      const org = await createOrganization(user.id, patch);
      setOrganization(org);
      const prefilled: AssessmentAnswers = {};
      for (const field of ORG_FIELDS) {
        if (!field.prefills) continue;
        const value = patch[field.id];
        if (value === null || value === undefined || String(value).trim() === "") continue;
        const answer = field.type === "number" ? Number(value) : String(value);
        prefilled[field.prefills] = answer as AnswerValue;
        if (assessmentId) await saveAnswer(assessmentId, user.id, field.prefills, answer as AnswerValue);
      }
      setAnswers((prev) => ({ ...prefilled, ...prev }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your organization profile");
    } finally {
      setOrgSaving(false);
    }
  }

  // Warn before losing an unsaved in-flight answer.
  useEffect(() => {
    if (!started || submitting) return;
    const handler = (event: BeforeUnloadEvent) => {
      if (saving !== "saving") return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [started, submitting, saving]);

  const section = step < REVIEW_STEP ? SECTIONS[step]! : null;
  const questions = useMemo(() => (section ? questionsForSection(section.id) : []), [section]);
  const percent = completionPercent(answers);
  const remainingMinutes = Math.max(
    1,
    Math.ceil(SECTIONS.slice(step).reduce((total, item) => total + item.estimatedMinutes, 0)),
  );

  const persist = useCallback(
    async (questionId: string, value: AnswerValue) => {
      if (!assessmentId || !user) return;
      setSaving("saving");
      try {
        await saveAnswer(assessmentId, user.id, questionId, value);
        setSaving("saved");
        if (savedTimer.current) window.clearTimeout(savedTimer.current);
        savedTimer.current = window.setTimeout(() => setSaving("idle"), 1600);
      } catch {
        setSaving("idle");
        toast.error("That answer could not be saved. Check your connection — we'll retry on the next change.");
      }
    },
    [assessmentId, user],
  );

  function setAnswer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setInvalid((prev) => prev.filter((id) => id !== questionId));
    void persist(questionId, value);
  }

  function goToStep(next: number) {
    setStep(next);
    setInvalid([]);
    if (assessmentId) void saveStep(assessmentId, next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goNext() {
    if (!section) return;
    const missing = missingRequired(questions, answers);
    if (missing.length) {
      setInvalid(missing.map((question) => question.id));
      toast.error(`${missing.length} required ${missing.length === 1 ? "answer" : "answers"} still needed`);
      document.getElementById(`q-${missing[0]!.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (user) void logEvent(user.id, "section_completed", assessmentId, section.id, { step });
    goToStep(step + 1);
  }

  async function handleSubmit() {
    if (!user || !assessmentId) return;
    const missing = missingRequired(
      SECTIONS.flatMap((item) => questionsForSection(item.id)),
      answers,
    );
    if (missing.length) {
      toast.error("Some required answers are still missing.");
      goToStep(SECTIONS.findIndex((item) => item.id === missing[0]!.section));
      return;
    }
    setSubmitting(true);
    try {
      await completeAssessment(user.id, assessmentId, answers);
      // CRM sync is best-effort and must never block the results screen.
      void syncAssessment({ data: { assessmentId } }).catch(() => {});
      navigate({ to: "/results" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your assessment");
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!started) {
    return <Introduction onStart={() => setStarted(true)} resumeStep={step} />;
  }

  if (!intakeComplete) {
    return (
      <OrgIntakeStep
        initialValues={(organization ?? {}) as OrgProfilePatch}
        saving={orgSaving}
        onSubmit={(patch) => void handleIntake(patch)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-eyebrow">
            {section ? `${section.eyebrow} of seven` : "Final step"} · {section?.title ?? "Review your answers"}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span aria-live="polite">
              {saving === "saving" ? "Saving…" : saving === "saved" ? "All answers saved" : `${percent}% complete`}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden /> ~{remainingMinutes} min left
            </span>
          </div>
        </div>
        <ProgressBar value={percent} tone="brass" />
        <ol className="flex flex-wrap gap-x-5 gap-y-2">
          {SECTIONS.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => index <= step && goToStep(index)}
                disabled={index > step}
                aria-current={index === step ? "step" : undefined}
                className={cn(
                  "text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  index === step
                    ? "font-semibold text-foreground"
                    : index < step
                      ? "text-muted-foreground hover:text-foreground"
                      : "cursor-not-allowed text-muted-foreground/40",
                )}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {section ? (
        <div className="surface-panel p-6 sm:p-10">
          <div className="space-y-2 border-b border-border pb-6">
            <h1 className="text-display text-3xl">{section.title}</h1>
            <p className="text-sm text-muted-foreground">{section.summary}</p>
            <p className="text-xs text-muted-foreground/70">
              {questions.length} questions · about {Math.ceil(section.estimatedMinutes)} min
            </p>
          </div>
          <div>
            {questions.map((question, index) => (
              <QuestionField
                key={question.id}
                question={question}
                index={index + 1}
                value={answers[question.id] ?? null}
                onChange={(value) => setAnswer(question.id, value)}
                invalid={invalid.includes(question.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <ReviewStep answers={answers} onEdit={goToStep} />
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => goToStep(Math.max(0, step - 1))}
          disabled={step === 0 || submitting}
        >
          <ArrowLeft className="size-4" aria-hidden /> Back
        </Button>
        {section ? (
          <Button onClick={goNext} size="lg">
            {step === SECTIONS.length - 1 ? "Review answers" : "Continue"}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button onClick={() => void handleSubmit()} disabled={submitting} size="lg">
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
            {submitting ? "Calculating Publisher Index™…" : "Calculate my Publisher Index™"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Introduction({ onStart, resumeStep }: { onStart: () => void; resumeStep: number }) {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-eyebrow">The Publisher Index™</p>
        <h1 className="text-display text-4xl sm:text-5xl">A diagnostic, not a quiz.</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Seven sections benchmark your organization's publishing maturity across company, audience, content,
          distribution, operations, goals, and constraints. Your answers produce a Publisher Index™ score, six category
          scores, and a maturity classification used throughout your Blueprint.
        </p>
      </div>

      <div className="surface-panel divide-y divide-border p-6 sm:p-8">
        {SECTIONS.map((section, index) => (
          <div key={section.id} className="flex gap-5 py-4 first:pt-0 last:pb-0">
            <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{section.title}</p>
              <p className="text-xs text-muted-foreground">{section.summary}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg" onClick={onStart}>
          {resumeStep > 0 ? "Resume assessment" : "Begin assessment"} <ArrowRight className="size-4" aria-hidden />
        </Button>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden /> ~{ESTIMATED_MINUTES} minutes · answers save automatically · leave
          and resume any time
        </p>
      </div>
    </div>
  );
}

function ReviewStep({ answers, onEdit }: { answers: AssessmentAnswers; onEdit: (step: number) => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-display text-3xl">Review your answers</h1>
        <p className="text-sm text-muted-foreground">
          Confirm everything reads correctly. You can revise any section before the index is calculated.
        </p>
      </div>

      {SECTIONS.map((section, index) => (
        <section key={section.id} className="surface-panel p-6">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
            <Button variant="ghost" size="sm" onClick={() => onEdit(index)}>
              Edit
            </Button>
          </div>
          <dl className="divide-y divide-border">
            {questionsForSection(section.id).map((question) => {
              const value = answers[question.id];
              const display = Array.isArray(value)
                ? value.join(", ")
                : question.type === "likert" || question.type === "single"
                  ? (question.options?.find((option) => option.value === String(value))?.label ?? "—")
                  : value === null || value === undefined || String(value).trim() === ""
                    ? "—"
                    : String(value);
              return (
                <div key={question.id} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,20rem)_1fr] sm:gap-8">
                  <dt className="text-xs text-muted-foreground">{question.label}</dt>
                  <dd className="text-sm text-foreground">{display}</dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}

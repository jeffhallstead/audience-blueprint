import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, Clock, Loader2, Lock, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/blueprint/progress-bar";
import { QuestionField } from "@/components/assessment/question-field";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  ESTIMATED_MINUTES,
  SECTIONS,
  questionsForSection,
  type AnswerValue,
  type AssessmentAnswers,
} from "@/lib/assessment/config";
import { completionPercent, computePublisherIndex, missingRequired } from "@/lib/assessment/scoring";
import {
  bufferAnonymousEvent,
  ensureAnonymousTest,
  readAnonymousTest,
  saveAnonymousAnswer,
  saveAnonymousStep,
} from "@/lib/assessment/local-store";
import { claimAnonymousTest } from "@/lib/assessment/claim";
import { startTestAccount } from "@/lib/assessment/anonymous.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "The free Publisher Test — Publisher Blueprint" },
      {
        name: "description",
        content:
          "Score your content operation across seven dimensions in about 12 minutes. No account needed to start.",
      },
      { property: "og:title", content: "The free Publisher Test" },
      {
        property: "og:description",
        content: "Seven sections, one Publisher Index score, and the category readings behind it. Free.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://blueprint.jeffhallstead.com/test" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.jeffhallstead.com/test" }],
  }),
  component: PublicTest,
});

const GATE_STEP = SECTIONS.length;
const emailSchema = z.string().trim().toLowerCase().email("Enter a valid work email").max(255);

function PublicTest() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [hydrated, setHydrated] = useState(false);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [resumable, setResumable] = useState(false);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [claiming, setClaiming] = useState(false);

  // Restore anonymous progress on mount (client only — never during SSR).
  useEffect(() => {
    const stored = readAnonymousTest();
    if (stored && Object.keys(stored.answers).length > 0) {
      setAnswers(stored.answers);
      setStep(Math.min(stored.step, GATE_STEP));
      setResumable(true);
    }
    setHydrated(true);
  }, []);

  // A signed-in visitor either claims local progress or resumes the normal wizard.
  useEffect(() => {
    if (!hydrated || authLoading || !user || claiming) return;
    const stored = readAnonymousTest();
    if (!stored || Object.keys(stored.answers).length === 0) {
      navigate({ to: "/wizard", replace: true });
      return;
    }
    setClaiming(true);
    claimAnonymousTest(user.id)
      .then((result) => {
        navigate({ to: result?.completed ? "/results" : "/wizard", replace: true });
      })
      .catch(() => {
        toast.error("We couldn't save your answers. Opening your assessment so you can finish there.");
        navigate({ to: "/wizard", replace: true });
      });
  }, [hydrated, authLoading, user, claiming, navigate]);

  const section = step < GATE_STEP ? SECTIONS[step]! : null;
  const questions = useMemo(() => (section ? questionsForSection(section.id) : []), [section]);
  const percent = completionPercent(answers);
  const remainingMinutes = Math.max(
    1,
    Math.ceil(SECTIONS.slice(step).reduce((total, item) => total + item.estimatedMinutes, 0)),
  );

  const goToStep = useCallback((next: number) => {
    setStep(next);
    setInvalid([]);
    saveAnonymousStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function setAnswer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setInvalid((prev) => prev.filter((id) => id !== questionId));
    saveAnonymousAnswer(questionId, value);
  }

  function beginTest() {
    ensureAnonymousTest();
    if (!resumable) bufferAnonymousEvent("assessment.anonymous_started");
    setStarted(true);
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
    bufferAnonymousEvent("assessment.section_completed", { section: section.id }, { step });
    goToStep(step + 1);
  }

  if (!hydrated || authLoading || user) {
    return (
      <Shell>
        <div className="flex items-center gap-3 py-24 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {user ? "Opening your score…" : "Loading the Publisher Test…"}
        </div>
      </Shell>
    );
  }

  if (!started) {
    return (
      <Shell>
        <Introduction onStart={beginTest} resumable={resumable} resumeStep={step} />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-8 py-10">
        <div className="space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-eyebrow">
              {section ? `${section.eyebrow} of seven` : "Final step"} · {section?.title ?? "Your score is ready"}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span aria-live="polite">{percent}% complete</span>
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
          <>
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
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => goToStep(Math.max(0, step - 1))} disabled={step === 0}>
                <ArrowLeft className="size-4" aria-hidden /> Back
              </Button>
              <Button onClick={goNext} size="lg">
                {step === SECTIONS.length - 1 ? "See my score" : "Continue"}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </>
        ) : (
          <EmailGate answers={answers} onEdit={goToStep} />
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link to="/">
          <Logo />
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-4xl px-6 pb-24">{children}</main>
    </div>
  );
}

function Introduction({
  onStart,
  resumable,
  resumeStep,
}: {
  onStart: () => void;
  resumable: boolean;
  resumeStep: number;
}) {
  return (
    <div className="space-y-8 py-10">
      <div className="space-y-3">
        <p className="text-eyebrow">The Publisher Index</p>
        <h1 className="text-display text-4xl sm:text-5xl">A diagnostic, not a quiz.</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Seven sections benchmark your organization&rsquo;s publishing maturity across company, audience, content,
          distribution, operations, goals, and constraints. Your answers produce a Publisher Index score, six category
          scores, and a maturity classification.
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
          {resumable ? `Resume — section ${Math.min(resumeStep + 1, SECTIONS.length)}` : "Begin the Publisher Test"}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden /> ~{ESTIMATED_MINUTES} minutes · no account needed to start
        </p>
      </div>
    </div>
  );
}

/**
 * The single ask in the whole funnel: one email field, after the work is done
 * and the score already exists.
 */
function EmailGate({ answers, onEdit }: { answers: AssessmentAnswers; onEdit: (step: number) => void }) {
  const navigate = useNavigate();
  const createAccount = useServerFn(startTestAccount);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sentToInbox, setSentToInbox] = useState(false);

  const index = useMemo(() => computePublisherIndex(answers), [answers]);
  const missing = useMemo(
    () => missingRequired(SECTIONS.flatMap((section) => questionsForSection(section.id)), answers),
    [answers],
  );

  useEffect(() => {
    bufferAnonymousEvent("assessment.email_gate_viewed", {}, { maturityLevel: index.maturity.level });
  }, [index.maturity.level]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Enter a valid work email");
      return;
    }
    if (missing.length) {
      toast.error("A few required answers are still missing.");
      onEdit(SECTIONS.findIndex((section) => section.id === missing[0]!.section));
      return;
    }

    setPending(true);
    bufferAnonymousEvent("assessment.email_submitted");
    try {
      const result = await createAccount({
        data: { email: parsed.data, origin: window.location.origin },
      });

      if (result.status === "existing") {
        setSentToInbox(true);
        return;
      }

      bufferAnonymousEvent("assessment.account_created");
      const { error } = await supabase.auth.verifyOtp({ token_hash: result.tokenHash, type: "email" });
      if (error) throw error;
      // The signed-in effect on this route claims the stored answers and
      // forwards to the results screen.
      navigate({ to: "/test", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't open your score. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (sentToInbox) {
    return (
      <div className="surface-panel space-y-4 p-8 sm:p-12">
        <MailCheck className="size-6 text-brass" aria-hidden />
        <h1 className="text-display text-3xl">Check your inbox</h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          That address already has a Publisher Blueprint account, so we sent a one-click sign-in link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Open it on this device and your score appears
          immediately — your answers are saved here in the meantime.
        </p>
        <Button variant="outline" onClick={() => setSentToInbox(false)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
      <div className="surface-panel relative overflow-hidden p-8 sm:p-12">
        <p className="text-eyebrow">Your Publisher Index</p>
        <div className="mt-6 flex items-end gap-4">
          <span className="text-display select-none text-7xl blur-md" aria-hidden>
            {index.overall}
          </span>
          <Lock className="mb-4 size-5 text-muted-foreground" aria-hidden />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Maturity level {index.maturity.level} of 5 —{" "}
          <span className="font-medium text-foreground">{index.maturity.title}</span>
        </p>
        <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
          {[
            "Your Publisher Index score, 0–100",
            "Six category readings: audience, content, distribution, operations, strategy, alignment",
            "Your strongest dimensions and your biggest gaps",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <Button variant="ghost" size="sm" className="mt-8" onClick={() => onEdit(SECTIONS.length - 1)}>
          <ArrowLeft className="size-4" aria-hidden /> Review my answers
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="surface-panel h-fit space-y-4 p-8">
        <div className="space-y-2">
          <h2 className="text-display text-2xl">See your score</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tell us where to keep your results. No password to choose, no card, nothing to install.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gate-email">Work email</Label>
          <Input
            id="gate-email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Opening your score…" : "Show my score"}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          We use your email to save your results and nothing else. No list, no spam.
        </p>
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth" className="underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

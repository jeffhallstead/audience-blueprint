import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, Clapperboard, HelpCircle, Loader2, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACT_URL } from "@/lib/marketing/book-a-call";
import {
  GREENLIGHT_QUESTIONS,
  MAX_SCORE,
  PATTERN_CONDITIONS,
  PATTERN_LABELS,
  VERDICT_LABELS,
  LAUNCH_WINDOW_LABELS,
  type GreenlightAnswers,
  type GreenlightCampaign,
  type LaunchWindow,
  type GreenlightResult,
} from "@/lib/microdrama/greenlight";
import { CATEGORIES, CATEGORY_DIAGNOSIS, CATEGORY_LABELS, VERDICT_SUMMARY, type Category } from "@/lib/microdrama/categories";
import { submitGreenlight } from "@/lib/microdrama/greenlight.functions";
import { cn } from "@/lib/utils";

const URL = "https://blueprint.jeffhallstead.com/microdrama-greenlight";
const TITLE = "Microdrama Greenlight: Is your brand ready for a vertical scripted series?";
const DESC =
  "A 3-minute assessment of your format fit, economics, and distribution readiness. Get a Green Light, Not Yet, or Not a Fit.";

export const Route = createFileRoute("/microdrama-greenlight")({
  head: () => ({
    meta: [
      { title: "Microdrama Greenlight | Publisher Blueprint by Jeff Hallstead" },
      { name: "description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Publisher Blueprint" },
      { property: "og:url", content: URL },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: GreenlightPage,
});

type Stage = "intro" | "category" | "questions" | "campaign" | "gate" | "result";
const TOTAL_STEPS = GREENLIGHT_QUESTIONS.length + 2;

function GreenlightPage() {
  const [stage, setStage] = useState<Stage>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<GreenlightResult | null>(null);
  const [campaign, setCampaign] = useState<GreenlightCampaign | null>(null);
  const [category, setCategory] = useState<Category | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" aria-label="Publisher Blueprint home">
            <Logo />
          </Link>
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Microdrama Greenlight</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        {stage === "intro" && <Intro onStart={() => setStage("category")} />}
        {stage === "category" && (
          <CategoryStep value={category} onChange={setCategory} onBack={() => setStage("intro")} onNext={() => setStage("questions")} />
        )}
        {stage === "questions" && (
          <Questions
            step={step}
            answers={answers}
            onAnswer={(key, value) => setAnswers((a) => ({ ...a, [key]: value }))}
            onBack={() => (step === 0 ? setStage("category") : setStep(step - 1))}
            onNext={() => (step === GREENLIGHT_QUESTIONS.length - 1 ? setStage("campaign") : setStep(step + 1))}
          />
        )}
        {stage === "campaign" && (
          <CampaignStep
            value={campaign}
            onChange={setCampaign}
            onBack={() => setStage("questions")}
            onNext={() => setStage("gate")}
          />
        )}
        {stage === "gate" && (
          <Gate
            answers={answers}
            category={category!}
            campaign={campaign}
            onBack={() => setStage("campaign")}
            onDone={(r) => {
              setResult(r);
              setStage("result");
              window.scrollTo({ top: 0 });
            }}
          />
        )}
        {stage === "result" && result && <Result result={result} campaign={campaign} category={category ?? "other"} />}
      </main>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="space-y-8">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        A decision tool for beauty, fashion, food, and wellness brands considering serialized short-form entertainment
      </p>
      <h1 className="font-serif text-4xl leading-tight md:text-5xl">
        Does your brand get a Green Light for a microdrama?
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        Answer 12 questions to find out whether a vertical scripted series fits your product, budget, and audience
        model, and the single condition that decides it.
      </p>
      <ul className="grid gap-3 text-sm sm:grid-cols-3">
        {["12 questions, about 3 minutes", "No account needed to start", "A clear verdict and your top blockers"].map(
          (t) => (
            <li key={t} className="flex items-start gap-2 rounded-md border border-border p-4">
              <Check className="mt-0.5 h-4 w-4 shrink-0" /> {t}
            </li>
          ),
        )}
      </ul>
      <Button size="lg" onClick={onStart}>
        Start the assessment <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </section>
  );
}

function Questions(props: {
  step: number;
  answers: Record<string, string>;
  onAnswer: (key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const q = GREENLIGHT_QUESTIONS[props.step]!;
  const selected = props.answers[q.key];
  const total = TOTAL_STEPS;
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <div className="flex justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span>
            Question {props.step + 2} of {total}
          </span>
          <span>{q.title}</span>
        </div>
        <div className="h-1 w-full bg-muted">
          <div className="h-1 bg-primary transition-all" style={{ width: `${((props.step + 2) / total) * 100}%` }} />
        </div>
      </div>
      <h2 className="font-serif text-2xl leading-snug md:text-3xl">{q.prompt}</h2>
      <div className="space-y-3" role="radiogroup" aria-label={q.prompt}>
        {q.options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected === o.value}
            onClick={() => props.onAnswer(q.key, o.value)}
            className={cn(
              "w-full rounded-md border p-4 text-left transition-colors",
              selected === o.value ? "border-primary bg-secondary" : "border-border hover:border-foreground/40",
            )}
          >
            <span className="block font-medium">{o.label}</span>
            {o.detail && <span className="mt-1 block text-sm text-muted-foreground">{o.detail}</span>}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={props.onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button disabled={!selected} onClick={props.onNext}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function Gate(props: { answers: Record<string, string>; category: Category; campaign: GreenlightCampaign | null; onBack: () => void; onDone: (r: GreenlightResult) => void }) {
  const submit = useServerFn(submitGreenlight);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const parsed: Record<string, unknown> = {};
      for (const q of GREENLIGHT_QUESTIONS) {
        const v = props.answers[q.key]!;
        parsed[q.key] = q.key === "operating_context" || v === "unsure" ? v : Number(v);
      }
      const r = await submit({ data: { email, company, category: props.category, answers: parsed as Required<GreenlightAnswers>, campaign: props.campaign ?? undefined } });
      props.onDone(r);
    } catch (err) {
      toast.error(err instanceof Error && err.message.includes("email") ? "Enter a valid work email." : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-8">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assessment complete · 12 of 12 answered</p>
      <div className="rounded-md border border-border p-6">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Verdict</p>
            <p className="select-none font-serif text-3xl blur-md" aria-hidden>Green Light</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fit score</p>
            <p className="font-serif text-3xl">
              <span className="select-none blur-md" aria-hidden>14</span> / {MAX_SCORE}
            </p>
          </div>
          <Lock className="ml-auto h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="font-serif text-2xl">Unlock your Microdrama Decision Brief</h2>
        <div className="space-y-2">
          <Label htmlFor="gl-email">Work email</Label>
          <Input id="gl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gl-company">Brand or company</Label>
          <Input id="gl-company" required value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={props.onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Unlock my brief
          </Button>
        </div>
      </form>
    </section>
  );
}

const HEADLINES = {
  green_light: "Green Light.",
  not_yet: "Not yet.",
  no: "Not a fit right now.",
} as const;

const BADGE = {
  green_light: "bg-success text-success-foreground",
  not_yet: "bg-warning text-warning-foreground",
  no: "bg-muted text-muted-foreground",
} as const;

function Result({ result, campaign, category }: { result: GreenlightResult; campaign: GreenlightCampaign | null; category: Category }) {
  const v = result.verdict;
  const headline = result.reason === "needs_conversation" ? "We need a few answers before we can call it." : HEADLINES[v];
  const soon = campaign?.hasCampaign && campaign.launchWindow === "within_3_months";
  const status = result.conditionStatus;
  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <span className={cn("inline-block rounded px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]", BADGE[v])}>
          {VERDICT_LABELS[v]}
        </span>
        <h1 className="font-serif text-3xl leading-tight md:text-4xl">{headline}</h1>
        <p className="max-w-2xl text-lg">{result.reason === "needs_conversation" ? "A few of your answers need a conversation before we can make the call." : VERDICT_SUMMARY[v]}</p>
        <p className="text-muted-foreground">
          {CATEGORY_LABELS[category]} · Fit score {result.score} / {MAX_SCORE} · Growth model: {result.patternUnknown ? "To be determined" : PATTERN_LABELS[result.patternId]}
        </p>
        {campaign?.hasCampaign && (
          <p className="text-sm">
            Planned for: {campaign.name || "an upcoming campaign"}
            {campaign.launchWindow ? ` · launching ${LAUNCH_WINDOW_LABELS[campaign.launchWindow]}` : ""}
          </p>
        )}
      </div>

      {!result.patternUnknown && (
        <div className="space-y-2 border-l-2 border-foreground pl-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {CATEGORY_LABELS[category]} × {PATTERN_LABELS[result.patternId]}
          </p>
          <p className="font-serif text-xl leading-relaxed">{CATEGORY_DIAGNOSIS[category][result.patternId]}</p>
        </div>
      )}

      <div className="rounded-md border border-border p-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">The deciding condition</p>
          <span className={cn("flex items-center gap-1 text-sm font-medium", status === "met" ? "text-success" : status === "unconfirmed" ? "text-muted-foreground" : "text-warning")}>
            {status === "met" ? <Check className="h-4 w-4" /> : status === "unconfirmed" ? <HelpCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {status === "met" ? "Met" : status === "unconfirmed" ? "To confirm" : "Not met"}
          </span>
        </div>
        <p className="font-serif text-xl">{PATTERN_CONDITIONS[result.patternId]}</p>
      </div>

      {result.blockers.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-2xl">{v === "green_light" ? "What to watch" : "Top blockers"}</h2>
          {result.blockers.map((b, i) => (
            <div key={b} className="flex gap-4 rounded-md border border-border p-4">
              <span className="font-serif text-lg text-muted-foreground">{i + 1}</span>
              <p>{b}</p>
            </div>
          ))}
        </div>
      )}

      {result.openQuestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-2xl">Open questions</h2>
          <p className="text-sm text-muted-foreground">You weren't sure about these. They're worth answering before you commit.</p>
          {result.openQuestions.map((q) => (
            <div key={q} className="flex gap-3 rounded-md border border-dashed border-border p-4">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p>{q}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4 rounded-md bg-secondary p-6">
        <Clapperboard className="h-6 w-6" />
        {v === "green_light" && (
          <>
            <p className="text-lg">The Microdrama Sprint turns this green light into a production-ready brief in three weeks.</p>
            <CallButton label={soon ? "Book a call before your launch window closes" : "Book a strategy call"} />
          </>
        )}
        {v === "not_yet" && (
          <>
            <p className="text-lg">
              {result.reason === "needs_conversation"
                ? "A 30-minute conversation is usually enough to answer these and give you a clear call."
                : "Most of these blockers can be cleared in a quarter. Let's map which ones come first."}
            </p>
            <CallButton label={soon ? "Book a call before your launch window closes" : "Book a 30-minute fit review"} />
          </>
        )}
        {v === "no" && (
          <>
            <p className="text-lg">Another format will likely deliver a better return. The Publisher Test shows which one fits.</p>
            <Button asChild>
              <Link to="/test">
                Take the Publisher Test <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
        {result.enterpriseReferral && (
          <p className="text-sm text-muted-foreground">At your scale, we'll also introduce you to vetted production partners.</p>
        )}
      </div>

      {v !== "no" && (
        <p className="text-sm text-muted-foreground">
          Want a full diagnostic of your content engine?{" "}
          <Link to="/test" className="underline underline-offset-4">
            Take the 12-minute Publisher Test →
          </Link>
        </p>
      )}
    </section>
  );
}

function CallButton({ label }: { label: string }) {
  return (
    <Button asChild>
      <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
        {label} <ArrowRight className="ml-2 h-4 w-4" />
      </a>
    </Button>
  );
}

const WINDOWS: LaunchWindow[] = ["within_3_months", "3_6_months", "6_12_months", "not_set"];

function CampaignStep(props: {
  value: GreenlightCampaign | null;
  onChange: (c: GreenlightCampaign) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const c = props.value;
  const option = (active: boolean) =>
    cn(
      "w-full rounded-md border p-4 text-left transition-colors",
      active ? "border-primary bg-secondary" : "border-border hover:border-foreground/40",
    );
  const ready = c !== null && (!c.hasCampaign || !!c.launchWindow);
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <div className="flex justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span>Question {TOTAL_STEPS} of {TOTAL_STEPS}</span>
          <span>Upcoming campaign</span>
        </div>
        <div className="h-1 w-full bg-primary" />
      </div>
      <h2 className="font-serif text-2xl leading-snug md:text-3xl">
        Is there a specific campaign or launch you're considering a microdrama for?
      </h2>
      <div className="space-y-3" role="radiogroup">
        <button type="button" role="radio" aria-checked={c?.hasCampaign === true} className={option(c?.hasCampaign === true)}
          onClick={() => props.onChange({ hasCampaign: true, name: c?.name, launchWindow: c?.launchWindow })}>
          <span className="block font-medium">Yes, there's a specific campaign</span>
        </button>
        <button type="button" role="radio" aria-checked={c?.hasCampaign === false} className={option(c?.hasCampaign === false)}
          onClick={() => props.onChange({ hasCampaign: false })}>
          <span className="block font-medium">Not yet, we're exploring</span>
        </button>
      </div>
      {c?.hasCampaign && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gl-campaign">What is it?</Label>
            <Input id="gl-campaign" maxLength={200} placeholder="e.g. Holiday launch, new product drop"
              value={c.name ?? ""} onChange={(e) => props.onChange({ ...c, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">When does it launch?</p>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="When does it launch?">
              {WINDOWS.map((w) => (
                <button key={w} type="button" role="radio" aria-checked={c.launchWindow === w}
                  className={option(c.launchWindow === w)} onClick={() => props.onChange({ ...c, launchWindow: w })}>
                  {w === "not_set" ? "Not set yet" : LAUNCH_WINDOW_LABELS[w].replace(/^in /, "").replace(/^w/, "W")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={props.onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button disabled={!ready} onClick={props.onNext}>
          See my verdict <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function CategoryStep(props: { value: Category | null; onChange: (c: Category) => void; onBack: () => void; onNext: () => void }) {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <div className="flex justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span>Question 1 of {TOTAL_STEPS}</span>
          <span>Category</span>
        </div>
        <div className="h-1 w-full bg-muted">
          <div className="h-1 bg-primary" style={{ width: `${(1 / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>
      <h2 className="font-serif text-2xl leading-snug md:text-3xl">Which category best describes your brand?</h2>
      <div className="space-y-3" role="radiogroup" aria-label="Which category best describes your brand?">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={props.value === c} onClick={() => props.onChange(c)}
            className={cn("w-full rounded-md border p-4 text-left transition-colors",
              props.value === c ? "border-primary bg-secondary" : "border-border hover:border-foreground/40")}>
            <span className="block font-medium">{CATEGORY_LABELS[c]}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={props.onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button disabled={!props.value} onClick={props.onNext}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

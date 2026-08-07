import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CORE_SALES_PERSONAS } from "@/lib/personas";

const FAQS = [
  {
    question: "I’m spending more to reach the same audience.",
    answer: "Start with the free Publisher Test. The Paid Media Plateau pattern is the fastest path to a consulting conversation.",
  },
  {
    question: "We publish all the time but nothing compounds.",
    answer: "The Campaign Factory pattern points to Blueprint first, then Publisher OS when it launches. The roadmap is the pitch.",
  },
  {
    question: "We have content but no owned audience.",
    answer: "The Orphaned Audience pattern usually leads directly to consulting. The Blueprint is the credibility step.",
  },
  {
    question: "The board wants to see content ROI.",
    answer: "The Stalled Studio pattern is a senior consulting engagement focused on measurement and board narrative.",
  },
  {
    question: "I have budget but no clear sequence.",
    answer: "The Funded Builder pattern starts with the $49 Blueprint. It gives you a defensible sequence before the next board meeting.",
  },
  {
    question: "I’m just getting started.",
    answer: "Start with the free Publisher Test. The product tier is the right fit for now.",
  },
];

export function PersonaSelector() {
  return (
    <section className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-display text-2xl">Not sure which path fits you?</h2>
        <p className="text-sm text-muted-foreground">
          Pick the pattern that matches your situation and I’ll tell you the right tier.
        </p>
      </div>
      <div className="space-y-3">
        {FAQS.map((item) => (
          <div
            key={item.question}
            className="surface-panel space-y-2 border-l-2 border-l-primary p-4"
          >
            <p className="text-sm font-medium text-foreground">{item.question}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </div>
      <Button asChild size="lg">
        <Link to="/auth" search={{ mode: "signup", plan: "test" }}>
          Start the free Publisher Test <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </section>
  );
}

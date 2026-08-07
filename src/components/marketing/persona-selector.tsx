import { BookACallButton } from "@/lib/marketing/book-a-call";

const FAQS = [
  {
    question: "I’m spending more to reach the same audience.",
    answer:
      "Start with the free Publisher Test. The Paid Media Plateau pattern is the fastest path to a consulting conversation.",
  },
  {
    question: "We publish all the time but nothing compounds.",
    answer:
      "The Campaign Factory pattern points to an editorial operating cadence. We walk your Blueprint together on a call.",
  },
  {
    question: "We have content but no owned audience.",
    answer:
      "The Orphaned Audience pattern usually leads directly to consulting. Your test score is the starting point.",
  },
  {
    question: "The board wants to see content ROI.",
    answer:
      "The Stalled Studio pattern is a senior consulting engagement focused on measurement and board narrative.",
  },
  {
    question: "I have budget but no clear sequence.",
    answer:
      "The Funded Builder pattern needs a defensible sequence before the next board meeting. That is what the Blueprint session produces.",
  },
  {
    question: "I’m just getting started.",
    answer: "Start with the free Publisher Test. It will tell you which owned channel to build first.",
  },
];

export function PersonaSelector() {
  return (
    <section className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-display text-2xl">Not sure which path fits you?</h2>
        <p className="text-sm text-muted-foreground">
          Pick the pattern that matches your situation and I’ll tell you the right next step.
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
      <BookACallButton surface="persona_selector" size="lg" label="Book a call" />
    </section>
  );
}

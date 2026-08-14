import { BookACallButton } from "@/lib/marketing/book-a-call";

const SITUATIONS = [
  {
    question: "I’m spending more to reach the same audience.",
    answer:
      "That is the Paid Media Plateau pattern. The free Publisher Test shows how much of your reach you are renting, and the Blueprint starts converting it into owned audience.",
  },
  {
    question: "We publish all the time but nothing compounds.",
    answer:
      "That is the Campaign Factory pattern. The work is there; the publishing franchises are not. We walk your Blueprint together on a call.",
  },
  {
    question: "We have followers but no owned audience.",
    answer:
      "That is the Borrowed Audience pattern. The Blueprint sequences the pathways from platform engagement into first-party relationships.",
  },
  {
    question: "The board wants to see content ROI.",
    answer:
      "That is the Invisible Studio pattern. The capability is real; the measurement story is missing. That is what the engagement builds first.",
  },
  {
    question: "I have budget but no clear sequence.",
    answer:
      "That is the Fragmented Builder pattern. Resources without a shared publishing architecture. The Blueprint sets the sequence before you scale spend.",
  },
  {
    question: "We already lead the category.",
    answer:
      "That is the Category Leader pattern. The question shifts from building capability to defending it — extending franchises and deepening first-party relationships.",
  },
];

export function PatternSelector() {
  return (
    <section className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-display text-2xl">Which Publisher Pattern sounds like you?</h2>
        <p className="text-sm text-muted-foreground">
          Pick the situation that matches yours and I’ll tell you the right next step.
        </p>
      </div>
      <div className="space-y-3">
        {SITUATIONS.map((item) => (
          <div key={item.question} className="surface-panel space-y-2 border-l-2 border-l-primary p-4">
            <p className="text-sm font-medium text-foreground">{item.question}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </div>
      <BookACallButton surface="pattern_selector" size="lg" label="Book a call" />
    </section>
  );
}

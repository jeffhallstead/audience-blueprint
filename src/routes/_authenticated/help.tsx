import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LifeBuoy, Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { title: "Help & Support | Publisher Blueprint" },
      {
        name: "description",
        content:
          "Getting-started guide, frequently asked questions, and support contacts for the Publisher Blueprint platform.",
      },
      { property: "og:title", content: "Help & Support | Publisher Blueprint" },
      {
        property: "og:description",
        content: "Learn how to run the assessment, read your Blueprint, and get help from the team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: HelpPage,
});

const STEPS: { title: string; body: string; to: string; cta: string }[] = [
  {
    title: "Take the Publisher Index™ assessment",
    body: "Answer seven short sections about your audience, content, distribution, operations, strategy, and alignment. Progress saves automatically, so you can stop and return anytime.",
    to: "/assessment",
    cta: "Open the assessment",
  },
  {
    title: "Read your executive dashboard",
    body: "Your overall score, six category scores, and maturity level land on the dashboard along with your biggest opportunity and risk. Download or email the PDF report from here.",
    to: "/dashboard",
    cta: "View dashboard",
  },
  {
    title: "Work the 90-day roadmap",
    body: "The roadmap sequences your priorities into three phases with owners and status. Update status as your team ships each move.",
    to: "/roadmap",
    cta: "View roadmap",
  },
  {
    title: "Ask Publisher Copilot™",
    body: "Copilot uses your assessment data to draft strategy documents, briefs, and recommendations. Save anything useful to your Strategy Library.",
    to: "/copilot",
    cta: "Open Copilot",
  },
  {
    title: "Export to your tools",
    body: "Send saved recommendations to Excel, Google Sheets, Airtable, or Asana. Connect a destination once in Settings and reuse it everywhere.",
    to: "/settings",
    cta: "Manage connections",
  },
];

const FAQ: { question: string; answer: string }[] = [
  {
    question: "What is included for free versus paid?",
    answer:
      "Every account can complete the assessment and see a summary score with a limited PDF. The full Blueprint — detailed category analysis, complete recommendation set, the 90-day roadmap, and the full report export — unlocks with a Publisher Blueprint purchase.",
  },
  {
    question: "How is my Publisher Index™ score calculated?",
    answer:
      "Each answer maps to weighted points across six categories. Category scores roll up into a 0-100 overall score, which places you in one of five maturity levels from Ad Hoc to Publisher-Grade.",
  },
  {
    question: "Can I retake the assessment?",
    answer:
      "Yes. Start a new assessment at any time from the dashboard. Previous scores are retained so you can track movement over time.",
  },
  {
    question: "How do I get a receipt or manage billing?",
    answer:
      "Open Plans & Billing to view invoices, update payment details, or cancel a subscription. Receipts are also emailed at the time of purchase.",
  },
  {
    question: "How do you handle my data?",
    answer:
      "Your assessment answers, documents, and reports are private to your account and protected by row-level security. Report PDFs are stored privately and shared only through expiring links sent to your own email address.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "Settings includes account deletion. Deleting cancels any active subscription and removes your assessment data.",
  },
];

function HelpPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Support"
        title="Help & support"
        description="A short guide to getting the most from Publisher Blueprint, answers to common questions, and a direct line to the team."
      />

      <section className="space-y-4" aria-labelledby="getting-started">
        <h2 id="getting-started" className="text-lg font-semibold tracking-tight">
          Getting started
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <DashboardCard key={step.to} eyebrow={`Step ${index + 1}`} title={step.title}>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              <Button asChild variant="ghost" size="sm" className="w-fit gap-2 px-0">
                <Link to={step.to}>
                  {step.cta}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </DashboardCard>
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="faq">
        <h2 id="faq" className="text-lg font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="surface-panel px-6">
          {FAQ.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger className="text-left text-sm">{item.question}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="space-y-4" aria-labelledby="contact">
        <h2 id="contact" className="text-lg font-semibold tracking-tight">
          Still need a hand?
        </h2>
        <DashboardCard accent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm font-medium">
                <LifeBuoy className="size-4" /> Contact support
              </p>
              <p className="text-sm text-muted-foreground">
                Use the Feedback button in the corner of any screen for quick notes, or email us for
                account and billing questions. We reply within one business day.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <a href="mailto:support@jeffhallstead.com">
                  <Mail className="size-4" /> Email support
                </a>
              </Button>
              <Button asChild className="gap-2">
                <a href="https://jeffhallstead.com/contact" target="_blank" rel="noreferrer noopener">
                  Talk to a strategist
                </a>
              </Button>
            </div>
          </div>
        </DashboardCard>
      </section>
    </div>
  );
}

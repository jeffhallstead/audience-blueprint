import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/legal-page";
import { SELLER } from "@/lib/legal";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Notice | Publisher Blueprint" },
      {
        name: "description",
        content:
          "How Publisher Blueprint collects, uses, shares and retains personal data, and the rights you have over it.",
      },
      { property: "og:title", content: "Privacy Notice | Publisher Blueprint" },
      { property: "og:description", content: "How we handle your personal data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://blueprint.jeffhallstead.com/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.jeffhallstead.com/privacy" }],
  }),
});

function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Notice" updated="August 2026">
      <p>
        <strong>{SELLER.legalName}</strong>, trading as {SELLER.tradingName}, is the data controller
        for personal data processed through the Publisher Blueprint platform. This notice explains
        what we collect, why, who we share it with, and the rights you have. Contact us at{" "}
        <a href={`mailto:${SELLER.supportEmail}`}>{SELLER.supportEmail}</a>.
      </p>

      <h2>What we collect and why</h2>
      <ul>
        <li>
          <strong>Account data</strong> (name, email, login credentials or Google sign-in identifier)
          — to create and secure your account. Legal basis: performance of our contract with you.
        </li>
        <li>
          <strong>Assessment and business data</strong> (organisation name, website, industry, team
          size, answers to the Publisher Index) — to generate your scores, blueprint and roadmap.
          Legal basis: performance of our contract.
        </li>
        <li>
          <strong>Copilot content</strong> (your prompts, generated documents, saved
          recommendations) — to provide the AI features and keep your work available. Legal basis:
          performance of our contract.
        </li>
        <li>
          <strong>Usage and product telemetry</strong> (pages viewed, feature events, device
          identifiers, IP address, approximate location from IP) — for security, fraud prevention
          and improving the product. Legal basis: our legitimate interests.
        </li>
        <li>
          <strong>Support messages and feedback</strong> — to answer you and improve the service.
          Legal basis: legitimate interests.
        </li>
        <li>
          <strong>Marketing communications</strong>, where you opt in — legal basis: consent, which
          you can withdraw at any time.
        </li>
        <li>
          <strong>Billing records</strong> (plan, purchase and subscription status, invoice
          references) — to give you access to what you paid for and meet accounting obligations.
          Legal basis: contract and legal obligation.
        </li>
      </ul>

      <h2>Who we share it with</h2>
      <ul>
        <li>
          <strong>Stripe</strong>, our payment provider, for checkout, subscription management,
          payments, tax compliance and invoicing. See{" "}
          <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
            Stripe&rsquo;s privacy policy
          </a>
          .
        </li>
        <li>
          <strong>Service providers and subprocessors</strong> — hosting and database infrastructure,
          authentication, AI model providers that process your Copilot prompts, email delivery and
          product analytics.
        </li>
        <li>
          <strong>Professional advisers</strong> such as legal and accounting, where necessary.
        </li>
        <li>
          <strong>Authorities</strong>, where we are required to do so by law.
        </li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>Retention</h2>
      <p>
        We keep account, assessment and Copilot data for as long as your account is active. If you
        delete your account, that data is deleted with it. Billing records are retained for as long
        as required for tax and accounting purposes. Telemetry is retained in aggregated or
        anonymised form after it is no longer needed in identifiable form.
      </p>

      <h2>Your rights</h2>
      <p>
        Subject to the law in your country, you may request access to your data, correction,
        deletion, restriction of processing, portability, and object to processing based on
        legitimate interests. You may withdraw consent to marketing at any time. In the UK or EEA
        you can also complain to your supervisory authority, and we aim to respond to requests
        within one month. You can delete your account and its data yourself from Settings, or email{" "}
        <a href={`mailto:${SELLER.supportEmail}`}>{SELLER.supportEmail}</a>.
      </p>

      <h2>International transfers</h2>
      <p>
        Our infrastructure and subprocessors may process data outside your country, including in the
        United States. Where data leaves the UK or EEA we rely on adequacy decisions or Standard
        Contractual Clauses with appropriate safeguards.
      </p>

      <h2>Security</h2>
      <p>
        We apply appropriate technical and organisational measures, including encryption in transit,
        encrypted storage, row-level access controls that scope data to your account, and least
        privilege access for administrators.
      </p>

      <h2>Cookies</h2>
      <p>
        We use essential cookies and local storage to keep you signed in and to keep the app working;
        these cannot be switched off. Our payment provider sets cookies during checkout. Any
        analytics cookies are used only to understand product usage in aggregate. You can manage or
        clear cookies in your browser settings.
      </p>
    </LegalPage>
  );
}

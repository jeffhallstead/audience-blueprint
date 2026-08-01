import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/legal-page";
import { SELLER, PADDLE_BUYER_TERMS } from "@/lib/legal";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Publisher Blueprint™" },
      {
        name: "description",
        content:
          "The terms governing use of Publisher Blueprint™, including licensing, acceptable use, payments and termination.",
      },
      { property: "og:title", content: "Terms & Conditions | Publisher Blueprint™" },
      { property: "og:description", content: "Terms governing use of Publisher Blueprint™." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms & Conditions" updated="August 2026">
      <p>
        These terms are an agreement between you and <strong>{SELLER.legalName}</strong>, trading as{" "}
        {SELLER.tradingName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;), operator of the Publisher
        Blueprint™ platform. By creating an account or continuing to use the service you agree to
        these terms. If you are accepting on behalf of an organisation, you confirm you have the
        authority to bind it; otherwise you confirm you are of legal age to contract.
      </p>

      <h2>The service</h2>
      <p>
        Publisher Blueprint™ is a subscription and one-time-purchase software service that provides
        a diagnostic assessment (the Publisher Index™), an executive dashboard, a strategic roadmap,
        and AI-assisted strategy deliverables through Publisher Copilot™. We grant you a limited,
        non-exclusive, non-transferable right to use the service within the plan you have selected.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Keep your credentials confidential; you are responsible for activity under your account.</li>
        <li>Provide accurate account information and keep it up to date.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You must not misuse the service. In particular, you must not:</p>
      <ul>
        <li>use it unlawfully, or for fraud, spam or deceptive activity;</li>
        <li>infringe intellectual property or other rights of any person;</li>
        <li>interfere with security — no malware, probing, scraping or circumventing plan limits;</li>
        <li>reverse engineer, resell or redistribute the service.</li>
      </ul>

      <h2>AI-generated content</h2>
      <p>
        Publisher Copilot™ produces AI-generated strategy documents, recommendations and prompts.
        You are responsible for the prompts and content you submit, for having the rights to any
        material you input, and for reviewing and verifying outputs before relying on or publishing
        them. You must not use the AI features to generate unlawful content, hate speech, deepfakes,
        malware, or to attempt to bypass safety controls. Outputs may be inaccurate or incomplete
        and are not legal, financial, tax or other regulated professional advice. We may filter,
        refuse, remove or restrict content and outputs, and may suspend accounts for repeated or
        serious violations. If you believe content infringes your rights, contact{" "}
        <a href={`mailto:${SELLER.supportEmail}`}>{SELLER.supportEmail}</a> and we will investigate
        and act, including terminating repeat infringers.
      </p>

      <h2>Intellectual property</h2>
      <p>
        We retain ownership of the service, its software, methodology, documentation and branding,
        including the Publisher Index™, Publisher Blueprint™, Publisher OS™ and Publisher Copilot™
        marks. You retain ownership of the content and data you submit, and grant us a limited
        licence to host and process it solely to provide the service to you.
      </p>

      <h2>Payment and subscriptions</h2>
      <p>
        Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant
        of Record for all our orders. Paddle provides all customer service inquiries and handles
        returns. Payment, billing, tax, cancellation and refund mechanics are governed by{" "}
        <a href={PADDLE_BUYER_TERMS} target="_blank" rel="noreferrer">
          Paddle&rsquo;s Buyer Terms
        </a>
        . Publisher OS™ renews monthly until cancelled; cancelling stops future renewals and access
        continues to the end of the paid period. The Publisher Blueprint™ purchase is one-time and
        includes one month of Publisher OS™ access.
      </p>

      <h2>Service level and warranties</h2>
      <p>
        We work to keep the service available but do not guarantee uninterrupted or error-free
        performance. To the fullest extent permitted by law we disclaim all implied warranties,
        including merchantability and fitness for a particular purpose.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent permitted by law, our aggregate liability is capped at the fees you paid in
        the twelve months preceding the claim, and we exclude indirect, consequential or special
        damages including loss of profits, data or goodwill. Nothing limits liability for fraud,
        death or personal injury where that limitation is not permitted. You indemnify us against
        claims arising from your content, unlawful use, or breach of these terms.
      </p>

      <h2>Suspension and termination</h2>
      <p>
        We may suspend or terminate access for material breach of these terms, non-payment, security
        or fraud risk, or repeated or serious policy violations. You may close your account at any
        time from Settings. On termination your access ends and your data is deleted in line with
        our Privacy Notice; export anything you need beforehand.
      </p>

      <h2>General</h2>
      <p>
        You may not assign these terms without our consent; we may assign them in a merger or
        acquisition. Neither party is liable for delays caused by events beyond reasonable control.
        These terms are governed by the laws of {SELLER.jurisdiction}, and the courts there have
        jurisdiction over disputes. Questions:{" "}
        <a href={`mailto:${SELLER.supportEmail}`}>{SELLER.supportEmail}</a>.
      </p>
    </LegalPage>
  );
}

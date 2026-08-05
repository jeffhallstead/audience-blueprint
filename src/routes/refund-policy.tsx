import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/legal-page";
import { SELLER, PROCESSOR } from "@/lib/legal";

export const Route = createFileRoute("/refund-policy")({
  component: RefundPolicyPage,
  head: () => ({
    meta: [
      { title: "Refund Policy | Publisher Blueprint™" },
      {
        name: "description",
        content:
          "Publisher Blueprint™ offers a 30-day money-back guarantee. Refunds are issued by Momentive Ventures LLC through our payment provider.",
      },
      { property: "og:title", content: "Refund Policy | Publisher Blueprint™" },
      {
        property: "og:description",
        content: "30-day money-back guarantee on Publisher Blueprint™ purchases and subscriptions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function RefundPolicyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Refund Policy" updated="August 2026">
      <p>
        We offer a <strong>{SELLER.refundDays}-day money-back guarantee</strong>. If Publisher
        Blueprint™ is not right for you, request a full refund within {SELLER.refundDays} days of
        your order date and we will refund it.
      </p>

      <h2>What this covers</h2>
      <ul>
        <li>
          The one-time Publisher Blueprint™ purchase — refundable within {SELLER.refundDays} days of
          purchase.
        </li>
        <li>
          Publisher OS™ monthly subscriptions — the most recent payment is refundable within{" "}
          {SELLER.refundDays} days. Cancelling stops future renewals and access continues to the end
          of the paid period.
        </li>
      </ul>

      <h2>How to request a refund</h2>
      <p>
        Email us at <a href={`mailto:${SELLER.supportEmail}`}>{SELLER.supportEmail}</a> from the
        address on your receipt, or open Manage billing in your account and reply to any invoice.
        We issue approved refunds through {PROCESSOR.name}, our payment provider.
        Approved refunds are returned to the original payment method, typically within 5–10 business
        days depending on your bank.
      </p>

      <h2>After a refund</h2>
      <p>
        When a refund is approved, access to paid features ends and your account reverts to the free
        Publisher Test™ tier. Your assessment results remain available.
      </p>

    </LegalPage>
  );
}

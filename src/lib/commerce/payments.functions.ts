import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createStripeClient,
  getStripeErrorMessage,
  type StripeEnv,
} from "@/lib/stripe.server";

const isEnv = (value: unknown): StripeEnv => (value === "live" ? "live" : "sandbox");

export type CheckoutSessionResult = { clientSecret: string } | { error: string };

/**
 * Resolve (or create) the Stripe customer for this user, keyed on
 * `metadata.userId` so later reads (portal, invoices) can find them.
 */
async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string | undefined; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");

  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data.length && found.data[0]) return found.data[0].id;

  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }

  const created = await stripe.customers.create({
    ...(options.email ? { email: options.email } : {}),
    metadata: { userId: options.userId },
  });
  return created.id;
}

/** Creates an embedded Checkout session for a catalog price. */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    return {
      priceId: data.priceId,
      returnUrl: String(data.returnUrl),
      environment: isEnv(data.environment),
    };
  })
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const {
        data: { user },
      } = await context.supabase.auth.getUser();

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const stripePrice = prices.data[0];
      if (!stripePrice) throw new Error(`Price not found: ${data.priceId}`);
      const isRecurring = stripePrice.type === "recurring";

      const customerId = await resolveOrCreateCustomer(stripe, {
        email: user?.email ?? undefined,
        userId: context.userId,
      });

      let description: string | undefined;
      if (!isRecurring) {
        const productId =
          typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;
        const product = await stripe.products.retrieve(productId);
        description = "name" in product ? product.name : undefined;
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        ...(isRecurring
          ? { subscription_data: { metadata: { userId: context.userId } } }
          : { payment_intent_data: { description } }),
        metadata: { userId: context.userId, managed_payments: "true" },
        // Stripe handles tax compliance, fraud, disputes and transaction support.
        managed_payments: { enabled: true },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      console.error("[payments] checkout session failed", error);
      return { error: getStripeErrorMessage(error) };
    }
  });

export type PortalSessionResult = { url: string | null } | { error: string };

/** Stripe-hosted billing portal for the signed-in customer. */
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv; returnUrl?: string }) => ({
    environment: isEnv(data.environment),
    returnUrl: data.returnUrl ? String(data.returnUrl) : undefined,
  }))
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    const customerId = await findCustomerId(context.supabase, context.userId, data.environment);
    if (!customerId) return { url: null };

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        ...(data.returnUrl ? { return_url: data.returnUrl } : {}),
      });
      return { url: portal.url };
    } catch (error) {
      console.error("[payments] portal failed", error);
      return { error: getStripeErrorMessage(error) };
    }
  });

async function findCustomerId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  environment: StripeEnv,
): Promise<string | null> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .eq("environment", environment)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subscription?.stripe_customer_id) return subscription.stripe_customer_id as string;

  const { data: purchase } = await supabase
    .from("purchases")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .eq("environment", environment)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (purchase?.stripe_customer_id as string | undefined) ?? null;
}

export type Invoice = {
  id: string;
  createdAt: string;
  amountCents: number;
  currency: string;
  status: string;
  description: string;
  invoiceUrl: string | null;
};

/** Billing history — subscription invoices plus one-time charges. */
export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => ({ environment: isEnv(data.environment) }))
  .handler(async ({ data, context }): Promise<Invoice[]> => {
    const customerId = await findCustomerId(context.supabase, context.userId, data.environment);
    if (!customerId) return [];

    try {
      const stripe = createStripeClient(data.environment);
      const [invoices, charges] = await Promise.all([
        stripe.invoices.list({ customer: customerId, limit: 50 }),
        stripe.charges.list({ customer: customerId, limit: 50 }),
      ]);

      const rows: Invoice[] = invoices.data
        .filter((inv) => inv.status === "paid" || inv.status === "open")
        .map((inv) => ({
          id: inv.id ?? "",
          createdAt: new Date((inv.created ?? 0) * 1000).toISOString(),
          amountCents: inv.amount_paid ?? 0,
          currency: (inv.currency ?? "usd").toUpperCase(),
          status: inv.status ?? "paid",
          description: inv.lines?.data?.[0]?.description ?? "Publisher OS™ — monthly",
          invoiceUrl: inv.hosted_invoice_url ?? null,
        }));

      const invoicedCharges = new Set(
        invoices.data.map((inv) => inv.id).filter((id): id is string => !!id),
      );
      for (const charge of charges.data) {
        const invoiceId = typeof charge.invoice === "string" ? charge.invoice : charge.invoice?.id;
        if (invoiceId && invoicedCharges.has(invoiceId)) continue;
        if (charge.status !== "succeeded") continue;
        rows.push({
          id: charge.id,
          createdAt: new Date(charge.created * 1000).toISOString(),
          amountCents: charge.amount,
          currency: charge.currency.toUpperCase(),
          status: charge.refunded ? "refunded" : "paid",
          description: charge.description ?? "Publisher Blueprint™",
          invoiceUrl: charge.receipt_url ?? null,
        });
      }

      return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      console.error("[payments] invoice list failed", error);
      return [];
    }
  });

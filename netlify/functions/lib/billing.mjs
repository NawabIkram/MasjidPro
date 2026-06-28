import Stripe from "stripe";
import { getJSON, setJSON } from "./storage.mjs";

export const BILLING_PLANS = Object.freeze({
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPrice: 49,
    description: "Donations, receipts, prayer times, announcements, and donor portal access.",
  },
  growth: {
    id: "growth",
    name: "Growth",
    monthlyPrice: 99,
    description: "Recurring giving, reports, AI assistance, and growing team workflows.",
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPrice: 199,
    description: "Advanced reporting, custom branding, and priority onboarding support.",
  },
});

let stripeClient;

const now = () => new Date().toISOString();
const toIso = (seconds) => seconds ? new Date(seconds * 1000).toISOString() : null;
const billingKey = (masjidId) => `billing/${masjidId}`;

export function getStripeConfig() {
  const ready = Boolean(String(process.env.STRIPE_SECRET_KEY ?? "").trim());
  const webhookReady = ready && Boolean(String(process.env.STRIPE_WEBHOOK_SECRET ?? "").trim());
  return { ready, webhookReady };
}

function getStripe() {
  const secretKey = String(process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!secretKey) {
    throw Object.assign(new Error("Online billing is temporarily unavailable."), { statusCode: 503, operational: true });
  }
  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

function getPlan(planId) {
  const plan = BILLING_PLANS[String(planId ?? "").toLowerCase()];
  if (!plan) throw Object.assign(new Error("Please select a valid MasjidPro plan."), { statusCode: 422 });
  return plan;
}

function publicBilling(record) {
  const config = getStripeConfig();
  if (!record) {
    return {
      checkoutReady: config.ready,
      webhookReady: config.webhookReady,
      planId: null,
      planName: "No active plan",
      monthlyPrice: 0,
      currency: "USD",
      status: "inactive",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      synced: true,
    };
  }
  return {
    checkoutReady: config.ready,
    webhookReady: config.webhookReady,
    planId: record.planId,
    planName: record.planName,
    monthlyPrice: record.monthlyPrice,
    currency: record.currency,
    status: record.status,
    currentPeriodEnd: record.currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(record.cancelAtPeriodEnd),
    synced: record.synced !== false,
  };
}

async function saveSubscription(masjidId, planId, subscription, customerId) {
  const plan = getPlan(planId);
  const firstItem = subscription?.items?.data?.[0];
  const record = {
    masjidId,
    planId: plan.id,
    planName: plan.name,
    monthlyPrice: plan.monthlyPrice,
    currency: "USD",
    status: subscription?.status ?? "active",
    stripeCustomerId: String(customerId ?? subscription?.customer ?? ""),
    stripeSubscriptionId: String(subscription?.id ?? ""),
    currentPeriodStart: toIso(subscription?.current_period_start ?? firstItem?.current_period_start),
    currentPeriodEnd: toIso(subscription?.current_period_end ?? firstItem?.current_period_end),
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    synced: true,
    updatedAt: now(),
  };
  await setJSON(billingKey(masjidId), record);
  if (record.stripeCustomerId) {
    await setJSON(`billing-customers/${record.stripeCustomerId}`, { masjidId, updatedAt: record.updatedAt });
  }
  return record;
}

async function resolveMasjidId(subscription) {
  if (subscription?.metadata?.masjidId) return subscription.metadata.masjidId;
  const customerId = typeof subscription?.customer === "string" ? subscription.customer : subscription?.customer?.id;
  if (!customerId) return null;
  return (await getJSON(`billing-customers/${customerId}`))?.masjidId ?? null;
}

export async function getBillingStatus(masjidId) {
  const stored = await getJSON(billingKey(masjidId));
  if (!stored?.stripeSubscriptionId || !getStripeConfig().ready) return publicBilling(stored);

  try {
    const subscription = await getStripe().subscriptions.retrieve(stored.stripeSubscriptionId);
    const updated = await saveSubscription(masjidId, stored.planId, subscription, stored.stripeCustomerId);
    return publicBilling(updated);
  } catch {
    return publicBilling({ ...stored, synced: false });
  }
}

export async function createCheckoutSession({ masjidId, masjidName, user, planId, origin }) {
  const plan = getPlan(planId);
  const stripe = getStripe();
  const stored = await getJSON(billingKey(masjidId));
  if (["active", "trialing", "past_due"].includes(stored?.status)) {
    throw Object.assign(new Error("This workspace already has a subscription. Use Manage Billing to change it."), { statusCode: 409 });
  }

  const metadata = { masjidId, planId: plan.id, adminUserId: user.id };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ui_mode: "hosted",
    client_reference_id: masjidId,
    customer: stored?.stripeCustomerId || undefined,
    customer_email: stored?.stripeCustomerId ? undefined : user.email,
    success_url: `${origin}/checkout/${plan.id}?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/${plan.id}?status=cancelled`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: plan.monthlyPrice * 100,
        recurring: { interval: "month" },
        product_data: {
          name: `MasjidPro ${plan.name}`,
          description: plan.description,
        },
      },
    }],
    metadata,
    subscription_data: { metadata },
    custom_text: {
      submit: { message: `${masjidName} can manage or cancel this subscription from MasjidPro billing settings.` },
    },
  });

  return { url: session.url, sessionId: session.id };
}

export async function confirmCheckoutSession({ masjidId, sessionId }) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(String(sessionId ?? ""), { expand: ["subscription"] });
  if (session.client_reference_id !== masjidId || session.metadata?.masjidId !== masjidId) {
    throw Object.assign(new Error("This checkout session does not belong to the active workspace."), { statusCode: 403 });
  }
  if (session.status !== "complete" || !session.subscription) {
    throw Object.assign(new Error("Stripe has not completed this subscription yet."), { statusCode: 409 });
  }

  const subscription = typeof session.subscription === "string"
    ? await stripe.subscriptions.retrieve(session.subscription)
    : session.subscription;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const record = await saveSubscription(masjidId, session.metadata.planId, subscription, customerId);
  return publicBilling(record);
}

export async function createCustomerPortalSession({ masjidId, origin }) {
  const stripe = getStripe();
  const stored = await getJSON(billingKey(masjidId));
  if (!stored?.stripeCustomerId) {
    throw Object.assign(new Error("No Stripe billing account is connected to this workspace yet."), { statusCode: 409 });
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: stored.stripeCustomerId,
    return_url: `${origin}/settings`,
  });
  return { url: session.url };
}

export function constructStripeEvent(rawBody, signature) {
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  if (!webhookSecret) {
    throw Object.assign(new Error("Stripe webhook handling is not configured."), { statusCode: 503, operational: true });
  }
  if (!signature) throw Object.assign(new Error("Stripe signature is missing."), { statusCode: 400 });
  try {
    return getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw Object.assign(new Error("Stripe webhook signature is invalid."), { statusCode: 400 });
  }
}

export async function applyStripeEvent(event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.mode !== "subscription" || !session.subscription || !session.metadata?.masjidId) return;
    const subscription = await getStripe().subscriptions.retrieve(String(session.subscription));
    await saveSubscription(session.metadata.masjidId, session.metadata.planId, subscription, session.customer);
    return;
  }

  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const subscription = event.data.object;
    const masjidId = await resolveMasjidId(subscription);
    if (!masjidId) return;
    const stored = await getJSON(billingKey(masjidId));
    const planId = subscription.metadata?.planId || stored?.planId;
    if (!planId) return;
    await saveSubscription(masjidId, planId, subscription, subscription.customer);
  }
}

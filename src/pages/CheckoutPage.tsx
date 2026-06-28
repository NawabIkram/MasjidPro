import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { pricingPlans } from "../data/mockData";
import { confirmBillingCheckout, createBillingCheckout, getBillingStatus } from "../services/api";
import type { BillingStatus } from "../services/api";
import { currency } from "../utils/format";

export function CheckoutPage() {
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, masjids } = useAuth();
  const selectedPlan = useMemo(
    () => pricingPlans.find((plan) => plan.id === planId) ?? pricingPlans.find((plan) => plan.highlighted) ?? pricingPlans[0],
    [planId],
  );
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const checkoutStatus = searchParams.get("status");
  const sessionId = searchParams.get("session_id");
  const activeMasjid = masjids.find((masjid) => masjid.id === user?.preferredMasjidId) ?? masjids[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const request = checkoutStatus === "success" && sessionId
      ? confirmBillingCheckout(sessionId)
      : getBillingStatus();
    request
      .then((result) => { if (!cancelled) setBilling(result); })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Billing status could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [checkoutStatus, sessionId]);

  const startCheckout = async () => {
    setSubmitting(true);
    setError("");
    try {
      const session = await createBillingCheckout(selectedPlan.id);
      window.location.assign(session.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Secure checkout could not be opened.");
      setSubmitting(false);
    }
  };

  const subscriptionActive = billing && ["active", "trialing", "past_due"].includes(billing.status);

  return (
    <main className="public-page checkout-page">
      <nav className="public-nav">
        <Link className="public-brand" to="/">
          <span className="brand-mark">M</span>
          <strong>MasjidPro</strong>
        </Link>
        <div>
          <Link to="/pricing">Pricing</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </nav>

      <section className="checkout-grid">
        <section className="checkout-form">
          <span className="eyebrow">Secure subscription</span>
          <h1>Activate {selectedPlan.name}</h1>
          <p>Confirm the workspace and continue to Stripe to securely enter billing details.</p>

          <div className="checkout-workspace">
            <div>
              <span>Workspace</span>
              <strong>{activeMasjid?.name ?? "Active masjid"}</strong>
            </div>
            <div>
              <span>Billing contact</span>
              <strong>{user?.email}</strong>
            </div>
          </div>

          {loading ? (
            <div className="checkout-loading" role="status"><Loader2 className="spin" size={20} />Checking billing status...</div>
          ) : null}
          {checkoutStatus === "cancelled" ? <div className="auth-notice" role="status">Checkout was cancelled. No subscription was created.</div> : null}
          {error ? <div className="auth-error" role="alert">{error}</div> : null}

          {!loading && checkoutStatus === "success" && subscriptionActive ? (
            <div className="checkout-success">
              <CheckCircle2 size={20} />
              <span>{billing.planName} is active for this workspace.</span>
              <Link to="/settings">Manage Billing<ArrowRight size={16} /></Link>
            </div>
          ) : null}

          {!loading && subscriptionActive && checkoutStatus !== "success" ? (
            <div className="checkout-success">
              <CheckCircle2 size={20} />
              <span>This workspace already has the {billing.planName} plan.</span>
              <Link to="/settings">Manage Billing<ArrowRight size={16} /></Link>
            </div>
          ) : null}

          {!loading && !subscriptionActive ? (
            <button
              className="primary-button full"
              disabled={submitting || !billing?.checkoutReady}
              type="button"
              onClick={() => void startCheckout()}
            >
              {submitting ? <Loader2 className="spin" size={18} /> : <CreditCard size={18} />}
              {submitting ? "Opening Stripe..." : `Continue to Stripe - ${currency(selectedPlan.price)}/month`}
            </button>
          ) : null}

          {!loading && !billing?.checkoutReady ? (
            <p className="checkout-help">Online checkout is temporarily unavailable. Your workspace remains accessible.</p>
          ) : null}

          <p className="checkout-terms">Your subscription renews monthly until cancelled. Billing details are entered and stored by Stripe.</p>
        </section>

        <aside className="checkout-summary">
          <span className="eyebrow">Order summary</span>
          <h2>{selectedPlan.name}</h2>
          <strong>{currency(selectedPlan.price)}<span>/month</span></strong>
          <p>{selectedPlan.description}</p>
          <ul className="checkout-feature-list">
            {selectedPlan.features.map((feature) => <li key={feature}><CheckCircle2 size={16} />{feature}</li>)}
          </ul>
          <div className="trust-strip mini">
            <div><ShieldCheck size={18} /><span>Stripe-hosted secure checkout</span></div>
            <div><CheckCircle2 size={18} /><span>Plan status tracked in MasjidPro</span></div>
          </div>
        </aside>
      </section>
    </main>
  );
}

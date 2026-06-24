import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { pricingPlans } from "../data/mockData";
import { currency } from "../utils/format";

export function CheckoutPage() {
  const { planId } = useParams();
  const selectedPlan = useMemo(
    () => pricingPlans.find((plan) => plan.id === planId) ?? pricingPlans.find((plan) => plan.highlighted) ?? pricingPlans[0],
    [planId],
  );
  const [paid, setPaid] = useState(false);

  return (
    <main className="public-page checkout-page">
      <nav className="public-nav">
        <Link className="public-brand" to="/">
          <span className="brand-mark">M</span>
          <strong>MasjidPro</strong>
        </Link>
        <div>
          <Link to="/pricing">Pricing</Link>
          <Link to="/demo">Demo</Link>
        </div>
      </nav>

      <section className="checkout-grid">
        <section className="checkout-form">
          <span className="eyebrow">Stripe-style checkout</span>
          <h1>Activate {selectedPlan.name}</h1>
          <p>This is a safe Phase 2 checkout simulation. Real Stripe keys can plug in later.</p>
          <div className="form-grid two">
            <label><span>Masjid name</span><input defaultValue="Masjid Al-Furqan" /></label>
            <label><span>Admin email</span><input defaultValue="admin@masjid.org" /></label>
            <label><span>Card number</span><input defaultValue="4242 4242 4242 4242" /></label>
            <label><span>Billing country</span><input defaultValue="United States" /></label>
          </div>
          <button className="primary-button full" type="button" onClick={() => setPaid(true)}>
            <CreditCard size={18} />
            Pay {currency(selectedPlan.price)} and activate
          </button>
          {paid ? (
            <div className="checkout-success">
              <CheckCircle2 size={20} />
              <span>Subscription activated. Workspace, billing record, and receipt are ready.</span>
              <Link to="/dashboard">
                Open Dashboard
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : null}
        </section>

        <aside className="checkout-summary">
          <span className="eyebrow">Order summary</span>
          <h2>{selectedPlan.name}</h2>
          <strong>{currency(selectedPlan.price)}<span>/mo</span></strong>
          <p>{selectedPlan.description}</p>
          <div className="trust-strip mini">
            <div><ShieldCheck size={18} /><span>Stripe secured payments</span></div>
            <div><CheckCircle2 size={18} /><span>Receipt generated confirmation</span></div>
          </div>
        </aside>
      </section>
    </main>
  );
}

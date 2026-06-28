import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { pricingPlans } from "../data/mockData";

export function PricingPage() {
  const { user } = useAuth();

  return (
    <main className="public-page">
      <nav className="public-nav">
        <Link className="public-brand" to="/">
          <span className="brand-mark">M</span>
          <strong>MasjidPro</strong>
        </Link>
        <div>
          <Link to="/demo">Demo</Link>
          <Link to={user ? user.role === "admin" ? "/dashboard" : "/donor-portal" : "/login"}>{user ? "Workspace" : "Login"}</Link>
        </div>
      </nav>

      <section className="public-heading">
        <span className="eyebrow">Paid plans</span>
        <h1>Simple pricing for masjid teams.</h1>
        <p>Choose the right plan for donations, receipts, announcements, reports, and donor care.</p>
      </section>

      <section className="pricing-grid">
        {pricingPlans.map((plan) => (
          <article className={plan.highlighted ? "pricing-card highlighted" : "pricing-card"} key={plan.id}>
            <span className="eyebrow">{plan.bestFor}</span>
            <h2>{plan.name}</h2>
            <strong>${plan.price}<span>/mo</span></strong>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <CheckCircle2 size={16} />
                  {feature}
                </li>
              ))}
            </ul>
            {user?.role === "donor" ? (
              <span className={`${plan.highlighted ? "primary-button" : "secondary-button"} full disabled-action`} aria-disabled="true">Admin account required</span>
            ) : (
              <Link
                className={plan.highlighted ? "primary-button full" : "secondary-button full"}
                to={user?.role === "admin" ? `/checkout/${plan.id}` : `/login?plan=${plan.id}`}
              >
                Choose {plan.name}
              </Link>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

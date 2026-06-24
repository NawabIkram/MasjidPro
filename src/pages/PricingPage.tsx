import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { pricingPlans } from "../data/mockData";

export function PricingPage() {
  return (
    <main className="public-page">
      <nav className="public-nav">
        <Link className="public-brand" to="/">
          <span className="brand-mark">M</span>
          <strong>MasjidPro</strong>
        </Link>
        <div>
          <Link to="/demo">Demo</Link>
          <Link to="/login">Login</Link>
        </div>
      </nav>

      <section className="public-heading">
        <span className="eyebrow">Paid plans</span>
        <h1>Simple pricing for the first 20 paying masjids.</h1>
        <p>Phase 2 target: convert beta users, publish pricing, and reach $1,000-$2,000 MRR.</p>
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
            <Link className={plan.highlighted ? "primary-button full" : "secondary-button full"} to={`/checkout/${plan.id}`}>
              Choose {plan.name}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

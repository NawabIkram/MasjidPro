import { ArrowRight, BarChart3, CheckCircle2, Megaphone, ShieldCheck, WalletCards } from "lucide-react";
import type { ElementType } from "react";
import { Link } from "react-router-dom";
import { pricingPlans } from "../data/mockData";

const publicStats = [
  { label: "Donation workflows", value: "5+" },
  { label: "Masjid dashboards", value: "Multi" },
  { label: "Admin modules", value: "6" },
];

export function MarketingPage() {
  const featuredPlan = pricingPlans.find((plan) => plan.highlighted) ?? pricingPlans[1];

  return (
    <main className="public-page">
      <nav className="public-nav">
        <Link className="public-brand" to="/">
          <span className="brand-mark">M</span>
          <strong>MasjidPro</strong>
        </Link>
        <div>
          <Link to="/pricing">Pricing</Link>
          <Link to="/demo">Demo</Link>
          <Link to="/login">Login</Link>
        </div>
      </nav>

      <section className="public-hero">
        <div>
          <span className="eyebrow">MasjidPro for Islamic centers</span>
          <h1>Run donations, prayer times, and community updates from one trusted dashboard.</h1>
          <p>
            MasjidPro gives Islamic centers a polished dashboard for donations, receipts, prayer
            times, announcements, reports, and donor trust without spreadsheet chaos.
          </p>
          <div className="button-row">
            <Link className="primary-button" to="/pricing">
              View Paid Plans
              <ArrowRight size={18} />
            </Link>
            <Link className="secondary-button" to="/demo">
              Open Interactive Demo
            </Link>
          </div>
        </div>
        <section className="public-hero-card">
          <span className="eyebrow">Recommended plan</span>
          <h2>{featuredPlan.name}</h2>
          <strong>${featuredPlan.price}/mo</strong>
          <p>{featuredPlan.description}</p>
          <Link className="primary-button full" to={`/checkout/${featuredPlan.id}`}>
            Start Checkout
          </Link>
        </section>
      </section>

      <section className="public-stats">
        {publicStats.map((stat) => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="public-feature-grid">
        <Feature icon={WalletCards} title="Donation engine" text="Track funds, receipts, refunds, recurring gifts, and exports." />
        <Feature icon={Megaphone} title="AI announcements" text="Draft Jumuah, fundraiser, and urgent community updates faster." />
        <Feature icon={BarChart3} title="Board reports" text="Show monthly giving, fund distribution, top donors, and trends." />
        <Feature icon={ShieldCheck} title="Trust layer" text="Stripe-ready payment trust, privacy notes, and audit history." />
      </section>

      <section className="case-study-strip">
        <CheckCircle2 size={22} />
        <p>
          Built for secure payment records, privacy-aware donor management, clear receipts, and
          simple reporting your masjid team can trust.
        </p>
      </section>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: ElementType;
  title: string;
  text: string;
}) {
  return (
    <article className="public-feature-card">
      <Icon size={22} />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

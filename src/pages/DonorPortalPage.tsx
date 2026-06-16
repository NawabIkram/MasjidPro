import { Download, HeartHandshake, ReceiptText, Repeat2, WalletCards } from "lucide-react";
import { Badge, Card, EmptyState, ProgressBar, SectionHeader, StatCard, TrustStrip } from "../components/ui";
import { announcements, campaign, donations, prayerTimes } from "../data/mockData";
import { currency } from "../utils/format";

type DonorView = "dashboard" | "donate" | "donations" | "receipts" | "recurring" | "profile";

export function DonorPortalPage({ view = "dashboard" }: { view?: DonorView }) {
  if (view === "donate") return <DonateView />;
  if (view === "donations") return <MyDonationsView />;
  if (view === "receipts") return <ReceiptsView />;
  if (view === "recurring") return <RecurringView />;
  if (view === "profile") return <ProfileView />;
  return <DashboardView />;
}

function DashboardView() {
  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Donor Portal</span>
          <h1>Give, manage receipts, and stay connected to your masjid.</h1>
        </div>
        <button className="primary-button" type="button">
          <HeartHandshake size={18} />
          Donate Now
        </button>
      </div>

      <div className="stats-grid">
        <StatCard title="My Total Donations" value={currency(18500)} change="+4 gifts this year" icon={WalletCards} />
        <StatCard title="Active Recurring" value="$150/mo" change="Next gift Jun 28" icon={Repeat2} tone="blue" />
        <StatCard title="Receipts Ready" value="18" change="PDF downloads" icon={ReceiptText} tone="gold" />
      </div>

      <div className="dashboard-grid">
        <Card className="campaign-card">
          <SectionHeader title="Ramadan Fundraiser" eyebrow="Your masjid campaign" />
          <strong className="zakat-total">{currency(campaign.raised)}</strong>
          <span>raised of {currency(campaign.goal)}</span>
          <ProgressBar value={(campaign.raised / campaign.goal) * 100} />
          <button className="primary-button full" type="button">Donate to Campaign</button>
        </Card>

        <Card>
          <SectionHeader title="Prayer Times" eyebrow="Today" />
          <div className="mini-prayer-list">
            {prayerTimes.map((prayer) => (
              <div className={prayer.isNext ? "mini-prayer next" : "mini-prayer"} key={prayer.name}>
                <span>{prayer.name}</span>
                <strong>{prayer.adhan}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card>
          <SectionHeader title="Latest Announcements" eyebrow="From your masjid" />
          <div className="announcement-list">
            {announcements.slice(0, 2).map((announcement) => (
              <div className="announcement-item" key={announcement.id}>
                <div>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.excerpt}</p>
                </div>
                <Badge tone="green">{announcement.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <TrustStrip />
      </div>
    </div>
  );
}

function DonateView() {
  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Donate</span>
          <h1>Make a secure gift and receive an instant receipt confirmation.</h1>
        </div>
      </div>
      <Card>
        <SectionHeader title="Donation Form" eyebrow="Stripe secured" />
        <div className="form-grid two">
          <label><span>Amount</span><input defaultValue="150" type="number" /></label>
          <label><span>Fund</span><select defaultValue="Sadaqah"><option>Zakat</option><option>Sadaqah</option><option>General</option><option>Building</option></select></label>
          <label><span>Frequency</span><select defaultValue="Monthly"><option>One-time</option><option>Monthly</option><option>Weekly</option></select></label>
          <label><span>Payment method</span><select defaultValue="Card"><option>Card</option><option>Bank Transfer</option></select></label>
        </div>
        <button className="primary-button full" type="button">Donate and Generate Receipt</button>
      </Card>
    </div>
  );
}

function MyDonationsView() {
  return (
    <div className="page-stack">
      <SectionHeader title="My Donations" eyebrow="Donation history" />
      <Card>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Fund</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {donations.slice(0, 4).map((donation) => (
                <tr key={donation.id}>
                  <td>{donation.fund}</td>
                  <td>{currency(donation.amount)}</td>
                  <td>{donation.method}</td>
                  <td>{donation.date}</td>
                  <td><Badge tone={donation.status === "Completed" ? "green" : "gold"}>{donation.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ReceiptsView() {
  return (
    <div className="page-stack">
      <SectionHeader title="Receipts" eyebrow="Download center" />
      <Card>
        <div className="receipt-list">
          {donations.filter((donation) => donation.receiptId !== "Pending").map((donation) => (
            <div className="receipt-row" key={donation.id}>
              <div>
                <strong>{donation.receiptId}</strong>
                <span>{donation.date} | {donation.fund}</span>
              </div>
              <strong>{currency(donation.amount)}</strong>
              <button className="secondary-button compact" type="button"><Download size={16} /> PDF</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function RecurringView() {
  return (
    <div className="page-stack">
      <SectionHeader title="Recurring Donations" eyebrow="Active plans" />
      <Card>
        <div className="recurring-card">
          <Repeat2 size={22} />
          <div>
            <strong>$150 monthly Sadaqah</strong>
            <p>Next payment Jun 28, 2026. Receipt will be generated automatically.</p>
          </div>
          <Badge tone="green">Active</Badge>
        </div>
      </Card>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="page-stack">
      <SectionHeader title="Profile" eyebrow="Donor account" />
      <Card>
        <div className="form-grid two">
          <label><span>Full name</span><input defaultValue="Ahmed Khalil" /></label>
          <label><span>Email</span><input defaultValue="ahmed.k@email.com" /></label>
          <label><span>Phone</span><input defaultValue="+1 713 555 0198" /></label>
          <label><span>Preferred fund</span><select defaultValue="Zakat"><option>Zakat</option><option>Sadaqah</option><option>General</option></select></label>
        </div>
        <EmptyState title="No profile alerts" description="Your donor profile is complete and ready for receipts." />
      </Card>
    </div>
  );
}

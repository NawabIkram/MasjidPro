import { useEffect, useState } from "react";
import { Download, HeartHandshake, ReceiptText, Repeat2, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Badge, Card, EmptyState, LoadingSkeleton, SectionHeader, StatCard, Toast, TrustStrip } from "../components/ui";
import {
  createDonation,
  createRecurringDonation,
  getAnnouncements,
  getDonations,
  getPrayerSchedule,
  getRecurringDonations,
  updateRecurringDonation,
} from "../services/api";
import type { Announcement, Donation, FundType, PrayerTime, RecurringDonation } from "../types";
import { downloadSimplePdf } from "../utils/downloads";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [recurring, setRecurring] = useState<RecurringDonation[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDonations(), getRecurringDonations(), getAnnouncements("Published"), getPrayerSchedule()])
      .then(([giftRecords, plans, news, schedule]) => {
        setDonations(giftRecords);
        setRecurring(plans);
        setAnnouncements(news);
        setPrayers(schedule.prayers);
      })
      .finally(() => setLoading(false));
  }, [user?.preferredMasjidId]);

  if (loading) return <div className="page-stack"><LoadingSkeleton rows={6} /></div>;

  const completed = donations.filter((donation) => donation.status === "Completed");
  const total = completed.reduce((sum, donation) => sum + donation.amount, 0);
  const receipts = donations.filter((donation) => donation.receiptId !== "Pending").length;

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div><span className="eyebrow">Donor Portal</span><h1>Welcome back, {user?.name}. Your giving records are ready.</h1></div>
        <button className="primary-button" type="button" onClick={() => navigate("/donate")}><HeartHandshake size={18} />Donate Now</button>
      </div>

      <div className="stats-grid">
        <StatCard title="My Total Donations" value={currency(total)} change={`${completed.length} completed gifts`} icon={WalletCards} />
        <StatCard title="Active Recurring" value={String(recurring.filter((item) => item.status === "Active").length)} change="Managed securely" icon={Repeat2} tone="blue" />
        <StatCard title="Receipts Ready" value={String(receipts)} change="PDF downloads" icon={ReceiptText} tone="gold" />
      </div>

      <div className="dashboard-grid">
        <Card>
          <SectionHeader title="Recent Giving" eyebrow="Your records" />
          {donations.length ? (
            <div className="receipt-list">{donations.slice(0, 4).map((donation) => <div className="receipt-row" key={donation.id}><div><strong>{donation.fund}</strong><span>{donation.date}</span></div><strong>{currency(donation.amount)}</strong><Badge tone={donation.status === "Completed" ? "green" : "gold"}>{donation.status}</Badge></div>)}</div>
          ) : <EmptyState title="No donations yet" description="Your first donation will appear here with its status and receipt." />}
        </Card>
        <Card>
          <SectionHeader title="Prayer Times" eyebrow="Today" />
          <div className="mini-prayer-list">{prayers.map((prayer) => <div className={prayer.isNext ? "mini-prayer next" : "mini-prayer"} key={prayer.name}><span>{prayer.name}</span><strong>{prayer.adhan}</strong></div>)}</div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card>
          <SectionHeader title="Latest Announcements" eyebrow="From your masjid" />
          {announcements.length ? <div className="announcement-list">{announcements.slice(0, 3).map((announcement) => <div className="announcement-item" key={announcement.id}><div><strong>{announcement.title}</strong><p>{announcement.excerpt}</p></div><Badge tone="green">{announcement.status}</Badge></div>)}</div> : <EmptyState title="No published announcements" description="Updates from your masjid will appear here." />}
        </Card>
        <TrustStrip />
      </div>
    </div>
  );
}

function DonateView() {
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState(150);
  const [fund, setFund] = useState<FundType>("Sadaqah");
  const [frequency, setFrequency] = useState<"One-time" | "Monthly" | "Weekly">("One-time");

  const submitDonation = async () => {
    setSubmitting(true);
    setError("");
    try {
      const donation = await createDonation({ donorName: "Signed-in donor", donorEmail: "account", fund, amount, method: "Card", status: "Pending" });
      if (frequency !== "One-time") await createRecurringDonation({ amount, fund, frequency });
      setToast(`Donation recorded with ${donation.status.toLowerCase()} status. ${frequency === "One-time" ? "" : "Recurring plan created."}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Donation could not be recorded.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-title-row"><div><span className="eyebrow">Donate</span><h1>Record a gift for your selected masjid fund.</h1></div></div>
      {error ? <div className="auth-error" role="alert">{error}</div> : null}
      <Card>
        <SectionHeader title="Donation Form" eyebrow="Receipt tracked" />
        <div className="form-grid two">
          <label><span>Amount</span><input min="1" value={amount} type="number" onChange={(event) => setAmount(Number(event.target.value))} /></label>
          <label><span>Fund</span><select value={fund} onChange={(event) => setFund(event.target.value as FundType)}><option>Zakat</option><option>Sadaqah</option><option>General</option><option>Building</option></select></label>
          <label><span>Frequency</span><select value={frequency} onChange={(event) => setFrequency(event.target.value as typeof frequency)}><option>One-time</option><option>Monthly</option><option>Weekly</option></select></label>
          <label><span>Payment method</span><select defaultValue="Card"><option>Card</option><option>Bank Transfer</option></select></label>
        </div>
        <button className="primary-button full" disabled={submitting || amount <= 0} type="button" onClick={() => void submitDonation()}>{submitting ? "Recording..." : "Record Donation"}</button>
      </Card>
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

function useDonationRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getDonations().then(setRecords).finally(() => setLoading(false));
  }, [user?.preferredMasjidId]);
  return { records, loading };
}

function MyDonationsView() {
  const { records, loading } = useDonationRecords();
  if (loading) return <LoadingSkeleton rows={5} />;
  return (
    <div className="page-stack">
      <SectionHeader title="My Donations" eyebrow="Donation history" />
      <Card>
        {!records.length ? <EmptyState title="No donations yet" description="Donation records will appear here after you submit your first gift." /> : <>
          <div className="table-wrap"><table><thead><tr><th>Fund</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead><tbody>{records.map((donation) => <tr key={donation.id}><td>{donation.fund}</td><td>{currency(donation.amount)}</td><td>{donation.method}</td><td>{donation.date}</td><td><Badge tone={donation.status === "Completed" ? "green" : "gold"}>{donation.status}</Badge></td></tr>)}</tbody></table></div>
          <div className="mobile-list">{records.map((donation) => <div className="mobile-record" key={donation.id}><div><strong>{donation.fund}</strong><span>{donation.date}</span></div><Badge tone={donation.status === "Completed" ? "green" : "gold"}>{donation.status}</Badge><dl><div><dt>Amount</dt><dd>{currency(donation.amount)}</dd></div><div><dt>Method</dt><dd>{donation.method}</dd></div><div><dt>Receipt</dt><dd>{donation.receiptId}</dd></div></dl></div>)}</div>
        </>}
      </Card>
    </div>
  );
}

function ReceiptsView() {
  const { records, loading } = useDonationRecords();
  const receipts = records.filter((donation) => donation.receiptId !== "Pending");
  const downloadReceipt = (donation: Donation) => downloadSimplePdf(`${donation.receiptId}.pdf`, "MasjidPro Donation Receipt", [`Receipt: ${donation.receiptId}`, `Donor: ${donation.donorName}`, `Fund: ${donation.fund}`, `Amount: ${currency(donation.amount)}`, `Date: ${donation.date}`, `Status: ${donation.status}`]);
  if (loading) return <LoadingSkeleton rows={4} />;
  return <div className="page-stack"><SectionHeader title="Receipts" eyebrow="Download center" /><Card>{receipts.length ? <div className="receipt-list">{receipts.map((donation) => <div className="receipt-row" key={donation.id}><div><strong>{donation.receiptId}</strong><span>{donation.date} | {donation.fund}</span></div><strong>{currency(donation.amount)}</strong><button className="secondary-button compact" type="button" onClick={() => downloadReceipt(donation)}><Download size={16} />PDF</button></div>)}</div> : <EmptyState title="No receipts yet" description="Receipts become available after a donation is completed." />}</Card></div>;
}

function RecurringView() {
  const [records, setRecords] = useState<RecurringDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  useEffect(() => { getRecurringDonations().then(setRecords).finally(() => setLoading(false)); }, []);
  const toggle = async (record: RecurringDonation) => {
    const updated = await updateRecurringDonation(record.id, record.status === "Active" ? "Paused" : "Active");
    setRecords((current) => current.map((item) => item.id === updated.id ? updated : item));
    setToast(`Recurring donation ${updated.status.toLowerCase()}.`);
  };
  if (loading) return <LoadingSkeleton rows={4} />;
  return <div className="page-stack"><SectionHeader title="Recurring Donations" eyebrow="Your plans" /><Card>{records.length ? records.map((record) => <div className="recurring-card" key={record.id}><Repeat2 size={22} /><div><strong>{currency(record.amount)} {record.frequency.toLowerCase()} {record.fund}</strong><p>{record.nextPayment}</p></div><Badge tone={record.status === "Active" ? "green" : "gold"}>{record.status}</Badge><button className="secondary-button compact" type="button" onClick={() => void toggle(record)}>{record.status === "Active" ? "Pause" : "Resume"}</button></div>) : <EmptyState title="No recurring donations" description="Choose weekly or monthly when recording a new donation." />}</Card>{toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}</div>;
}

function ProfileView() {
  const { user, updateAccount } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); try { await updateAccount({ name, phone }); setToast("Profile saved securely."); } finally { setSaving(false); } };
  return <div className="page-stack"><SectionHeader title="Profile" eyebrow="Donor account" /><Card><div className="form-grid two"><label><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label><label><span>Email</span><input value={user?.email ?? ""} readOnly /></label><label><span>Phone</span><input value={phone} onChange={(event) => setPhone(event.target.value)} /></label></div><button className="primary-button full" disabled={saving} type="button" onClick={() => void save()}>{saving ? "Saving..." : "Save Profile"}</button></Card>{toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}</div>;
}

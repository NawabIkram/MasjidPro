import { useEffect, useMemo, useState } from "react";
import { Download, FileText, MoreHorizontal, Plus, Search, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { Badge, Card, EmptyState, LoadingSkeleton, Modal, SectionHeader, StatCard, Toast } from "../components/ui";
import { donations } from "../data/mockData";
import type { Donation, DonationStatus, FundType } from "../types";
import { downloadCsv, downloadReceipt, downloadSimplePdf } from "../utils/downloads";
import { currency } from "../utils/format";
import { createDonation, generateCampaignCopy, getDonations, type AICampaignResult } from "../services/api";

const funds: Array<FundType | "All"> = ["All", "Zakat", "Sadaqah", "General", "Building"];
const statuses: Array<DonationStatus | "All"> = ["All", "Completed", "Pending", "Refunded"];

function statusTone(status: DonationStatus): "green" | "gold" | "red" {
  if (status === "Completed") return "green";
  if (status === "Pending") return "gold";
  return "red";
}

export function DonationsPage() {
  const [records, setRecords] = useState<Donation[]>(donations);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fund, setFund] = useState<FundType | "All">("All");
  const [status, setStatus] = useState<DonationStatus | "All">("All");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [method, setMethod] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState("");
  const [newDonation, setNewDonation] = useState({
    donorName: "New Donor",
    donorEmail: "donor@email.com",
    amount: 250,
    fund: "Zakat" as FundType,
    method: "Card" as Donation["method"],
    status: "Completed" as DonationStatus,
  });

  const [showAiModal, setShowAiModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignTopic, setCampaignTopic] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [aiCampaignResult, setAiCampaignResult] = useState<AICampaignResult | null>(null);
  const [campaignTab, setCampaignTab] = useState<keyof AICampaignResult>("email");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getDonations()
      .then((data) => {
        if (mounted) {
          setRecords(data);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visibleDonations = useMemo(() => {
    return records.filter((donation) => {
      const matchesSearch =
        donation.donorName.toLowerCase().includes(search.toLowerCase()) ||
        donation.donorEmail.toLowerCase().includes(search.toLowerCase());
      const matchesFund = fund === "All" || donation.fund === fund;
      const matchesStatus = status === "All" || donation.status === status;
      const matchesMethod = method === "All" || donation.method === method;
      return matchesSearch && matchesFund && matchesStatus && matchesMethod;
    });
  }, [records, search, fund, status, method]);

  function exportCsv() {
    downloadCsv(
      "masjidpro-donations.csv",
      ["Donor", "Email", "Fund", "Amount", "Method", "Date", "Status", "Refund", "Receipt"],
      visibleDonations.map((donation) => [
        donation.donorName,
        donation.donorEmail,
        donation.fund,
        donation.amount,
        donation.method,
        donation.date,
        donation.status,
        donation.refundStatus,
        donation.receiptId,
      ]),
    );
    setToast("CSV export downloaded.");
  }

  function exportPdf() {
    downloadSimplePdf(
      "masjidpro-donations.pdf",
      "MasjidPro Donations Report",
      visibleDonations.map(
        (donation) =>
          `${donation.date} - ${donation.donorName} - ${donation.fund} - ${currency(donation.amount)} - ${donation.status}`,
      ),
    );
    setToast("PDF export downloaded.");
  }

  async function recordDonation() {
    const next = await createDonation(newDonation);
    setRecords((current) => [next, ...current]);
    setShowAddModal(false);
    setToast("Donation recorded through backend and receipt generated.");
  }

  async function generateAICampaign() {
    if (!campaignTopic || !campaignGoal) {
      setToast("Please enter a campaign topic and goal.");
      return;
    }

    setIsGenerating(true);
    setToast("AI is generating campaign materials...");

    try {
      const result = await generateCampaignCopy(campaignTopic, campaignGoal);
      setAiCampaignResult(result);
      setToast("Campaign materials generated successfully!");
    } catch (error: any) {
      setToast(error.message || "Failed to generate campaign.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Giving</span>
          <h1>Track incoming donations and manage campaigns.</h1>
        </div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={exportCsv}>
            <Download size={18} />
            Export CSV
          </button>
          <button className="secondary-button" type="button" onClick={exportPdf}>
            <FileText size={18} />
            Export PDF
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setShowAiModal(true)}
            style={{background: 'linear-gradient(to right, #0f766e, #0369a1)', color: 'white', borderColor: 'transparent'}}
          >
            <Sparkles size={18} />
            AI Campaign Builder
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            Add Donation
          </button>
        </div>
      </div>

      <div className="stats-grid three">
        <StatCard title="Total Raised" value={currency(110430)} change="+14% vs last month" icon={ShieldCheck} tone="green" />
        <StatCard title="Zakat Fund" value={currency(48230)} change="+8% vs last month" icon={ShieldCheck} tone="gold" />
        <StatCard title="General Fund" value={currency(62200)} change="+6% vs last month" icon={ShieldCheck} tone="blue" />
      </div>

      <Card>
        <SectionHeader title="Filters" eyebrow="Search and segment" />
        <div className="filters-grid">
          <label className="search-field">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search donor name or email"
            />
          </label>
          <label>
            <span>Fund type</span>
            <select value={fund} onChange={(event) => setFund(event.target.value as FundType | "All")}>
              {funds.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Payment method</span>
            <select value={method} onChange={(event) => setMethod(event.target.value)}>
              <option>All</option>
              <option>Card</option>
              <option>Bank Transfer</option>
              <option>Cash</option>
            </select>
          </label>
          <label>
            <span>Date range</span>
            <select value={dateRange} onChange={(event) => setDateRange(event.target.value)}>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Ramadan campaign</option>
              <option>Custom range</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as DonationStatus | "All")}>
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </Card>

      <Card>
        <SectionHeader title="All Donations" />
        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : visibleDonations.length === 0 ? (
          <EmptyState title="No donations yet" description="Try a different filter or add the first donation record." />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Email</th>
                    <th>Fund</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Refund</th>
                    <th>Receipt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDonations.map((donation) => (
                    <DonationRow donation={donation} key={donation.id} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-list">
              {visibleDonations.map((donation) => (
                <DonationMobileCard donation={donation} key={donation.id} />
              ))}
            </div>
          </>
        )}
      </Card>

      {/* AI Campaign Modal */}
      {showAiModal ? (
        <Modal
          title="Live AI Campaign Assistant"
          description="Let AI write your fundraising campaign copy across all channels."
          onClose={() => setShowAiModal(false)}
        >
          <div className="form-grid two" style={{marginBottom: '1.5rem'}}>
            <label><span>Campaign Topic</span><input value={campaignTopic} onChange={(e) => setCampaignTopic(e.target.value)} placeholder="e.g. Ramadan Food Drive" /></label>
            <label><span>Funding Goal</span><input value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)} placeholder="e.g. $50,000" /></label>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={generateAICampaign}
            disabled={isGenerating}
            style={{ width: "100%", justifyContent: "center", background: "linear-gradient(to right, #0f766e, #0369a1)", marginBottom: '1.5rem' }}
          >
            {isGenerating ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
            {isGenerating ? "Generating..." : "Generate with AI"}
          </button>

          {aiCampaignResult && (
            <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}}>
              <h3 style={{marginTop: 0, color: '#0f172a'}}>{aiCampaignResult.title}</h3>
              <p style={{color: '#475569', fontSize: '0.875rem', marginBottom: '1rem'}}>{aiCampaignResult.description}</p>

              <div className="tab-nav" style={{marginBottom: '1rem'}}>
                {(['email', 'sms', 'push', 'social'] as Array<keyof AICampaignResult>).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`tab-btn ${campaignTab === key ? 'active' : ''}`}
                    onClick={() => setCampaignTab(key)}
                    style={{textTransform: 'capitalize', padding: '0.5rem'}}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div style={{whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: '#1e293b', minHeight: '100px'}}>
                {aiCampaignResult[campaignTab]}
              </div>
            </div>
          )}

          <div className="button-row end" style={{marginTop: '1.5rem'}}>
            <button className="secondary-button" type="button" onClick={() => setShowAiModal(false)}>Close</button>
          </div>
        </Modal>
      ) : null}

      {/* Add Donation Modal */}
      {showAddModal ? (
        <Modal
          title="Add Donation"
          description="Record a donation and generate a receipt confirmation."
          onClose={() => setShowAddModal(false)}
        >
          <div className="form-grid two">
            <label><span>Donor name</span><input value={newDonation.donorName} onChange={(event) => setNewDonation((current) => ({ ...current, donorName: event.target.value }))} /></label>
            <label><span>Email</span><input value={newDonation.donorEmail} onChange={(event) => setNewDonation((current) => ({ ...current, donorEmail: event.target.value }))} /></label>
            <label><span>Amount</span><input value={newDonation.amount} type="number" onChange={(event) => setNewDonation((current) => ({ ...current, amount: Number(event.target.value) }))} /></label>
            <label><span>Fund</span><select value={newDonation.fund} onChange={(event) => setNewDonation((current) => ({ ...current, fund: event.target.value as FundType }))}><option>Zakat</option><option>Sadaqah</option><option>General</option><option>Building</option></select></label>
            <label><span>Method</span><select value={newDonation.method} onChange={(event) => setNewDonation((current) => ({ ...current, method: event.target.value as Donation["method"] }))}><option>Card</option><option>Bank Transfer</option><option>Cash</option></select></label>
            <label><span>Status</span><select value={newDonation.status} onChange={(event) => setNewDonation((current) => ({ ...current, status: event.target.value as DonationStatus }))}><option>Completed</option><option>Pending</option><option>Refunded</option></select></label>
          </div>
          <div className="button-row end">
            <button className="secondary-button" type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button
              className="primary-button"
              type="button"
              onClick={recordDonation}
            >
              Record Donation
            </button>
          </div>
        </Modal>
      ) : null}

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

function DonationRow({ donation }: { donation: Donation }) {
  function handleReceiptDownload() {
    downloadReceipt(`${donation.receiptId || donation.id}.txt`, {
      Receipt: donation.receiptId,
      Donor: donation.donorName,
      Email: donation.donorEmail,
      Fund: donation.fund,
      Amount: currency(donation.amount),
      Date: donation.date,
      Status: donation.status,
    });
  }

  return (
    <tr>
      <td><strong>{donation.donorName}</strong></td>
      <td>{donation.donorEmail}</td>
      <td>{donation.fund}</td>
      <td>{currency(donation.amount)}</td>
      <td>{donation.method}</td>
      <td>{donation.date}</td>
      <td><Badge tone={statusTone(donation.status)}>{donation.status}</Badge></td>
      <td>{donation.refundStatus}</td>
      <td>{donation.receiptId}</td>
      <td><button className="icon-button compact-icon" type="button" aria-label="Download receipt" onClick={handleReceiptDownload}><MoreHorizontal size={16} /></button></td>
    </tr>
  );
}

function DonationMobileCard({ donation }: { donation: Donation }) {
  return (
    <div className="mobile-record">
      <div>
        <strong>{donation.donorName}</strong>
        <span>{donation.donorEmail}</span>
      </div>
      <Badge tone={statusTone(donation.status)}>{donation.status}</Badge>
      <dl>
        <div><dt>Fund</dt><dd>{donation.fund}</dd></div>
        <div><dt>Amount</dt><dd>{currency(donation.amount)}</dd></div>
        <div><dt>Method</dt><dd>{donation.method}</dd></div>
        <div><dt>Refund</dt><dd>{donation.refundStatus}</dd></div>
        <div><dt>Receipt</dt><dd>{donation.receiptId}</dd></div>
      </dl>
    </div>
  );
}

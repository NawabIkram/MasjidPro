import {
  BarChart3,
  BellRing,
  Calculator,
  Download,
  Megaphone,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Users,
  CalendarDays,
  Clock,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  announcements,
  auditLog,
  campaign,
  fundBreakdown,
  prayerTimes,
  attendanceRecords,
  masjidEvents,
  staffMembers,
} from "../data/mockData";
import { downloadTextFile } from "../utils/downloads";
import { currency, percent } from "../utils/format";
import { Badge, Card, EmptyState, LoadingSkeleton, ProgressBar, SectionHeader, StatCard, Toast, TrustStrip } from "../components/ui";
import { useLanguage } from "../i18n/i18n";
import { generateAIJson } from "../lib/gemini";

const quickActions = [
  { label: "Create Announcement", icon: Megaphone, path: "/announcements" },
  { label: "Add Donation", icon: Plus, path: "/donations" },
  { label: "Export Report", icon: Download, path: "/reports" },
  { label: "Calculate Zakat", icon: Calculator, path: "/zakat" },
];

export function DashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const nextPrayer = prayerTimes.find((prayer) => prayer.isNext) ?? prayerTimes[0];
  const campaignPercent = Math.round((campaign.raised / campaign.goal) * 100);

  const presentStaff = attendanceRecords.filter((r) => r.status === "Present" || r.status === "Late");
  const upcomingEvents = masjidEvents.filter((e) => e.status === "Upcoming").slice(0, 3);

  // AI Insight State
  const [insight, setInsight] = useState<{headline: string, recommendation: string} | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  function handleQuickAction(action: typeof quickActions[0]) {
    if (action.path) navigate(action.path);
  }

  async function generateInsight() {
    setInsightLoading(true);
    try {
      const result = await generateAIJson<{headline: string, recommendation: string}>(
        "Analyze the dashboard metrics and provide a single critical insight and an actionable recommendation.",
        `{ "headline": "A short 1-sentence insight (e.g. Donations are down 15% this week)", "recommendation": "A 1-sentence actionable suggestion" }`
      );
      setInsight(result);
    } catch (error) {
      setToast("Failed to generate AI insight.");
    } finally {
      setInsightLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="hero-row">
        <div>
          <span className="eyebrow">{t("dash_hero_eyebrow")}</span>
          <h1>{t("dash_hero_title")}</h1>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            downloadTextFile(
              "masjidpro-board-summary.txt",
              [
                "MasjidPro Board Summary",
                `Campaign: ${campaign.name}`,
                `Raised: ${currency(campaign.raised)} of ${currency(campaign.goal)}`,
                `Next Prayer: ${nextPrayer.name} at ${nextPrayer.adhan}`,
                "Insight: Focus Friday messaging on recurring Sadaqah.",
              ].join("\n"),
            );
            setToast("Board summary generated and downloaded.");
          }}
        >
          <Sparkles size={18} />
          {t("dash_generate")}
        </button>
      </div>

      <div className="stats-grid four">
        <StatCard title={t("dash_totalDonations")} value={currency(18340)} change="+24% this month" icon={WalletCards} />
        <StatCard title={t("dash_zakatFund")} value={currency(7240)} change="+18% this month" icon={ShieldCheck} tone="gold" />
        <StatCard title={t("dash_sadaqahFund")} value={currency(4180)} change="+9% this month" icon={WalletCards} />
        <StatCard title={t("dash_recurringDonors")} value="156" change="+12 donors" icon={BarChart3} tone="blue" />
      </div>

      <div className="dashboard-grid">
        <Card>
          <SectionHeader title={t("dash_fundBreakdown")} eyebrow={t("dash_liveAllocation")} />
          <div className="fund-list">
            {fundBreakdown.map((fund) => (
              <div className="fund-row" key={fund.fund}>
                <div>
                  <strong>{fund.fund} Fund</strong>
                  <span>{currency(fund.amount)}</span>
                </div>
                <div className="fund-progress">
                  <span>{percent(fund.percentage)}</span>
                  <ProgressBar value={fund.percentage} color={fund.color} label={`${fund.fund} progress`} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="campaign-card">
          <SectionHeader title={campaign.name} eyebrow={t("dash_donationGoal")} />
          <div className="campaign-amount">
            <strong>{currency(campaign.raised)}</strong>
            <span>raised of {currency(campaign.goal)}</span>
          </div>
          <ProgressBar value={campaignPercent} label="Campaign progress" />
          <div className="campaign-footer">
            <Badge tone="gold">{campaignPercent}% complete</Badge>
            <span>{campaign.dueDate}</span>
          </div>
          <button className="secondary-button" type="button" onClick={() => navigate("/donate")}>{t("dash_viewCampaign")}</button>
        </Card>
      </div>

      <div className="dashboard-grid three">
        <Card>
          <SectionHeader title={t("dash_quickActions")} eyebrow={t("dash_commonTasks")} />
          <div className="quick-actions">
            {quickActions.map((action) => (
              <button type="button" key={action.label} onClick={() => handleQuickAction(action)}>
                <action.icon size={18} />
                {action.label}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title={t("dash_nextPrayer")} eyebrow={t("dash_prayerTimes")} />
          <div className="next-prayer-card">
            <span>{nextPrayer.name}</span>
            <strong>02:18:45</strong>
            <p>Iqamah at {nextPrayer.iqamah}</p>
          </div>
          <div className="mini-prayer-list">
            {prayerTimes.map((prayer) => (
              <div className={prayer.isNext ? "mini-prayer next" : "mini-prayer"} key={prayer.name}>
                <span>{prayer.name}</span>
                <strong>{prayer.adhan}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title={t("dash_aiInsight")} eyebrow={t("dash_donationSignal")} />

          {insight ? (
            <>
              <div className="insight-box">
                <Sparkles size={20} style={{color: '#0f766e'}} />
                <div>
                  <strong>{insight.headline}</strong>
                  <p>Suggested action: {insight.recommendation}</p>
                </div>
              </div>
              <button className="secondary-button" type="button" onClick={() => setInsight(null)}>Refresh</button>
            </>
          ) : (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'1rem'}}>
               <Sparkles size={32} style={{color: '#94a3b8'}} />
               <p style={{color: '#64748b', fontSize: '0.875rem', textAlign: 'center'}}>Click below to generate a live operational insight.</p>
               <button className="secondary-button" type="button" onClick={generateInsight} disabled={insightLoading}>
                 {insightLoading ? <Loader2 size={16} className="spin" /> : "Generate Insight"}
               </button>
            </div>
          )}
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card>
          <SectionHeader title={t("dash_staffOnDuty")} eyebrow={t("dash_todayAttendance")} action={<button className="text-button" type="button" onClick={() => navigate("/staff")}>{t("viewAll")}</button>} />
          <div className="activity-list">
            {presentStaff.map((record) => {
              const staff = staffMembers.find(s => s.id === record.staffId);
              return (
                <div className="activity-item" key={record.id}>
                  <span><Clock size={14} style={{display:'inline', marginRight:'4px'}}/>{record.checkIn}</span>
                  <div>
                    <strong>{record.staffName}</strong>
                    <p>{staff?.role}</p>
                  </div>
                  <Badge tone={record.status === "Present" ? "green" : "gold"}>{record.status}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionHeader title={t("dash_upcomingEvents")} eyebrow={t("dash_nextEvents")} action={<button className="text-button" type="button" onClick={() => navigate("/events")}>{t("viewAll")}</button>} />
          <div className="announcement-list">
            {upcomingEvents.map((event) => (
              <div className="announcement-item" key={event.id}>
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.date} • {event.startTime}</p>
                </div>
                <Badge tone="blue">
                  {event.rsvpCount} RSVPs
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card>
          <SectionHeader title={t("dash_recentAnnouncements")} action={<button className="text-button" type="button" onClick={() => navigate("/announcements")}>{t("viewAll")}</button>} />
          <div className="announcement-list">
            {announcements.map((announcement) => (
              <div className="announcement-item" key={announcement.id}>
                <div>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.excerpt}</p>
                </div>
                <Badge tone={announcement.status === "Published" ? "green" : announcement.status === "Scheduled" ? "blue" : "neutral"}>
                  {announcement.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title={t("dash_activityLog")} eyebrow={t("dash_auditTrail")} />
          <div className="activity-list">
            {auditLog.map((entry) => (
              <div className="activity-item" key={entry.id}>
                <span>{entry.time}</span>
                <div>
                  <strong>{entry.action}</strong>
                  <p>{entry.user}</p>
                </div>
                <Badge tone={entry.status === "Success" ? "green" : "gold"}>{entry.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

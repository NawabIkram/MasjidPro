import { Download, FileText, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { Badge, Card, EmptyState, LoadingSkeleton, ProgressBar, SectionHeader, Modal, Toast } from "../components/ui";
import { donors, fundBreakdown, monthlyDonations, recurringTrend, reportMetrics } from "../data/mockData";
import { currency } from "../utils/format";
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/i18n";
import { downloadCsv, downloadSimplePdf } from "../utils/downloads";
import { generateReportSummary, getReports, type AIReportResult, type ReportsApiData } from "../services/api";

export function ReportsPage() {
  const { t } = useLanguage();
  const [reportData, setReportData] = useState<ReportsApiData>({
    reportMetrics,
    monthlyDonations,
    recurringTrend,
    fundBreakdown,
    topDonors: donors,
  });
  const [loading, setLoading] = useState(true);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<AIReportResult | null>(null);
  const [toast, setToast] = useState("");
  const maxMonthly = Math.max(...reportData.monthlyDonations.map((item) => item.amount));
  const maxRecurring = Math.max(...reportData.recurringTrend.map((item) => item.donors));

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getReports()
      .then((data) => {
        if (mounted) {
          setReportData(data);
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

  async function generateAIReport() {
    setIsGenerating(true);
    setToast("AI is analyzing your donation data...");

    try {
      const result = await generateReportSummary();
      setReportResult(result);
      setToast("AI report generated successfully!");
    } catch (error: any) {
      setToast(error.message || "Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  }

  function exportCsv() {
    downloadCsv(
      "masjidpro-monthly-report.csv",
      ["Metric", "Value", "Change"],
      reportData.reportMetrics.map((metric) => [metric.label, metric.value, `${metric.change}%`]),
    );
    setToast("CSV report downloaded.");
  }

  function exportPdf() {
    downloadSimplePdf(
      "masjidpro-monthly-report.pdf",
      "MasjidPro Monthly Report",
      [
        ...reportData.reportMetrics.map((metric) => `${metric.label}: ${metric.value} (+${metric.change}%)`),
        "",
        "Monthly donations:",
        ...reportData.monthlyDonations.map((item) => `${item.month}: ${currency(item.amount)}`),
        "",
        "Fund distribution:",
        ...reportData.fundBreakdown.map((fund) => `${fund.fund}: ${currency(fund.amount)} (${fund.percentage}%)`),
      ],
    );
    setToast("PDF report downloaded.");
  }

  function downloadAiReport() {
    if (!reportResult) return;
    downloadSimplePdf(
      "masjidpro-ai-board-report.pdf",
      reportResult.title,
      [
        "Executive Summary",
        reportResult.summary,
        "",
        "Key Insights",
        ...reportResult.insights.map((insight) => `- ${insight}`),
        "",
        "Recommendations",
        ...reportResult.recommendations.map((recommendation) => `- ${recommendation}`),
      ],
    );
    setToast("AI report PDF downloaded.");
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Reports</span>
          <h1>Monthly giving, fund distribution, top donors, and recurring donation trends.</h1>
        </div>
        <div className="button-row">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setShowAiModal(true)}
            style={{background: 'linear-gradient(to right, #0f766e, #0369a1)', color: 'white', borderColor: 'transparent'}}
          >
            <Sparkles size={18} />
            Generate AI Report
          </button>
          <button className="secondary-button" type="button" onClick={exportCsv}>
            <Download size={18} />
            Export CSV
          </button>
          <button className="primary-button" type="button" onClick={exportPdf}>
            <FileText size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="stats-grid four">
        {loading ? <LoadingSkeleton rows={2} /> : null}
        {reportData.reportMetrics.map((metric) => (
          <Card className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.label.includes("Donor Retention") ? `${metric.value}%` : currency(metric.value)}</strong>
            <Badge tone="green">+{metric.change}%</Badge>
          </Card>
        ))}
      </div>

      <div className="report-grid">
        <Card>
          <SectionHeader title="Monthly Donations Chart" eyebrow="Last 6 months" />
          <div className="bar-chart">
            {reportData.monthlyDonations.map((item) => (
              <div className="bar-column" key={item.month}>
                <span style={{ height: `${(item.amount / maxMonthly) * 100}%` }} />
                <strong>{item.month}</strong>
                <small>{currency(item.amount)}</small>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Fund Distribution" eyebrow="By category" />
          <div className="fund-list">
            {reportData.fundBreakdown.map((fund) => (
              <div className="fund-row" key={fund.fund}>
                <div>
                  <strong>{fund.fund}</strong>
                  <span>{currency(fund.amount)}</span>
                </div>
                <ProgressBar value={fund.percentage} color={fund.color} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="report-grid">
        <Card>
          <SectionHeader title="Top Donors" eyebrow="This month" />
          <div className="top-donor-list">
            {reportData.topDonors.map((donor, index) => (
              <div className="top-donor" key={donor.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{donor.name}</strong>
                  <p>{donor.fundPreference} preference</p>
                </div>
                <strong>{currency(donor.lifetimeDonations)}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Recurring Donations Trend" eyebrow="Active donors" />
          <div className="line-chart">
            {reportData.recurringTrend.map((item) => (
              <div className="trend-point" key={item.month}>
                <span style={{ height: `${(item.donors / maxRecurring) * 100}%` }} />
                <small>{item.month}</small>
                <strong>{item.donors}</strong>
              </div>
            ))}
          </div>
          <div className="info-box">
            <TrendingUp size={20} />
            <p>Recurring donors increased steadily across the last six months.</p>
          </div>
        </Card>
      </div>

      {showAiModal ? (
        <Modal
          title="AI Board Report Generator"
          description="Instantly analyze all dashboard metrics to generate an executive summary and strategic recommendations."
          onClose={() => setShowAiModal(false)}
        >
          {!reportResult && (
            <div style={{textAlign: 'center', padding: '2rem 0'}}>
               <button
                  className="primary-button"
                  type="button"
                  onClick={generateAIReport}
                  disabled={isGenerating}
                  style={{ justifyContent: "center", background: "linear-gradient(to right, #0f766e, #0369a1)", margin: '0 auto' }}
                >
                  {isGenerating ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                  {isGenerating ? "Analyzing Masjid Data..." : "Run AI Analysis"}
                </button>
            </div>
          )}

          {reportResult && (
            <div style={{background: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', maxHeight: '60vh', overflowY: 'auto'}}>
              <h2 style={{marginTop: 0, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem'}}>{reportResult.title}</h2>

              <h4 style={{color: '#0f766e', marginBottom: '0.5rem'}}>Executive Summary</h4>
              <p style={{color: '#334155', fontSize: '0.875rem', lineHeight: '1.6'}}>{reportResult.summary}</p>

              <h4 style={{color: '#0f766e', marginBottom: '0.5rem', marginTop: '1.5rem'}}>Key Insights</h4>
              <ul style={{color: '#334155', fontSize: '0.875rem', lineHeight: '1.6', paddingLeft: '1.25rem'}}>
                {reportResult.insights.map((insight, i) => (
                  <li key={i} style={{marginBottom: '0.5rem'}}>{insight}</li>
                ))}
              </ul>

              <h4 style={{color: '#0f766e', marginBottom: '0.5rem', marginTop: '1.5rem'}}>Actionable Recommendations</h4>
              <ul style={{color: '#334155', fontSize: '0.875rem', lineHeight: '1.6', paddingLeft: '1.25rem'}}>
                {reportResult.recommendations.map((rec, i) => (
                  <li key={i} style={{marginBottom: '0.5rem'}}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="button-row end" style={{marginTop: '1.5rem'}}>
            <button className="secondary-button" type="button" onClick={() => {setShowAiModal(false); setReportResult(null);}}>Close</button>
            {reportResult && <button className="primary-button" type="button" onClick={downloadAiReport}><Download size={16}/> Download PDF</button>}
          </div>
        </Modal>
      ) : null}

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

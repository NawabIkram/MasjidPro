import { useMemo, useState } from "react";
import { Calculator, CreditCard, Info, ReceiptText } from "lucide-react";
import { Badge, Card, ProgressBar, SectionHeader, Toast, TrustStrip } from "../components/ui";
import { downloadSimplePdf } from "../utils/downloads";
import { currency } from "../utils/format";

const fields = [
  { key: "cash", label: "Cash & Bank Savings" },
  { key: "gold", label: "Gold Value" },
  { key: "silver", label: "Silver Value" },
  { key: "investments", label: "Investments" },
  { key: "business", label: "Business Assets" },
  { key: "debts", label: "Debts & Liabilities" },
] as const;

type FieldKey = (typeof fields)[number]["key"];

export function ZakatPage() {
  const [toast, setToast] = useState("");
  const [values, setValues] = useState<Record<FieldKey, number>>({
    cash: 8500,
    gold: 4200,
    silver: 600,
    investments: 5200,
    business: 2000,
    debts: 1800,
  });

  const totals = useMemo(() => {
    const assets = values.cash + values.gold + values.silver + values.investments + values.business;
    const net = Math.max(assets - values.debts, 0);
    const due = net * 0.025;
    return { assets, net, due };
  }, [values]);

  const nisab = 6200;
  const aboveNisab = totals.net >= nisab;

  function recordPayment() {
    downloadSimplePdf("masjidpro-zakat-record.pdf", "MasjidPro Zakat Record", [
      `Total assets: ${currency(totals.assets)}`,
      `Deductions: ${currency(values.debts)}`,
      `Net wealth: ${currency(totals.net)}`,
      `Zakat due: ${currency(totals.due)}`,
      `Nisab status: ${aboveNisab ? "Above Nisab" : "Below Nisab"}`,
    ]);
    setToast("Zakat payment record downloaded.");
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Zakat Calculator</span>
          <h1>Calculate, explain, and record Zakat with a clear donor-ready breakdown.</h1>
        </div>
        <button className="primary-button" type="button" onClick={recordPayment}>
          <ReceiptText size={18} />
          Record Zakat Payment
        </button>
      </div>

      <div className="zakat-grid">
        <Card>
          <SectionHeader title="Assets & Liabilities" eyebrow="2.5% calculation" />
          <div className="form-grid two">
            {fields.map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <input
                  type="number"
                  value={values[field.key]}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.key]: Number(event.target.value),
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <button className="secondary-button full" type="button" onClick={() => setToast(`Zakat recalculated: ${currency(totals.due)} due.`)}>
            <Calculator size={18} />
            Recalculate Zakat
          </button>
        </Card>

        <Card className="zakat-result">
          <SectionHeader title="Zakat Due" eyebrow="Result" />
          <strong className="zakat-total">{currency(totals.due)}</strong>
          <Badge tone={aboveNisab ? "green" : "neutral"}>
            {aboveNisab ? "Above Nisab" : "Below Nisab"}
          </Badge>
          <ProgressBar value={Math.min((totals.net / 50000) * 100, 100)} />
          <div className="breakdown-list">
            <div><span>Total assets</span><strong>{currency(totals.assets)}</strong></div>
            <div><span>Deductions</span><strong>-{currency(values.debts)}</strong></div>
            <div><span>Net wealth</span><strong>{currency(totals.net)}</strong></div>
            <div><span>Zakat rate</span><strong>2.5%</strong></div>
          </div>
          <button className="primary-button full" type="button" onClick={recordPayment}>
            <CreditCard size={18} />
            Pay Now via MasjidPro
          </button>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card>
          <SectionHeader title="Nisab Guidance" eyebrow="Donor note" />
          <div className="info-box">
            <Info size={20} />
            <p>
              Current gold-based Nisab is shown as {currency(nisab)} for this prototype. A real
              backend can replace this with a daily value from a trusted source.
            </p>
          </div>
        </Card>
        <TrustStrip />
      </div>
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

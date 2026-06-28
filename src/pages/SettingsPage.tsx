import { BellRing, CreditCard, LockKeyhole, MapPin, ShieldCheck, UsersRound } from "lucide-react";
import type { ElementType } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Badge, Card, LoadingSkeleton, SectionHeader, Toast, TrustStrip } from "../components/ui";
import { createBillingPortal, getBillingStatus, getWorkspaceSettings, updateWorkspaceSettings } from "../services/api";
import type { BillingStatus } from "../services/api";
import type { WorkspaceSettings } from "../types";

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([getWorkspaceSettings(), getBillingStatus()])
      .then(([workspace, subscription]) => {
        setSettings(workspace);
        setBilling(subscription);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Settings could not be loaded."))
      .finally(() => setLoading(false));
  }, [user?.preferredMasjidId]);

  const update = <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    try {
      setSettings(await updateWorkspaceSettings(settings));
      setToast("Workspace settings saved securely.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const manageBilling = async () => {
    if (!billing || billing.status === "inactive") {
      navigate("/pricing");
      return;
    }
    setBillingBusy(true);
    setError("");
    try {
      const session = await createBillingPortal();
      window.location.assign(session.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Billing management could not be opened.");
      setBillingBusy(false);
    }
  };

  if (loading) return <div className="page-stack"><LoadingSkeleton rows={6} /></div>;

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>Manage this masjid workspace and its notification preferences.</h1>
        </div>
        <button className="primary-button" disabled={saving || !settings} type="button" onClick={() => void save()}>{saving ? "Saving..." : "Save Settings"}</button>
      </div>

      {error ? <div className="auth-error" role="alert">{error}</div> : null}

      {settings ? (
        <>
          <div className="settings-grid">
            <Card>
              <SectionHeader title="Masjid Profile" eyebrow="Workspace identity" />
              <div className="form-grid two">
                <label><span>Masjid name</span><input value={settings.name} onChange={(event) => update("name", event.target.value)} /></label>
                <label><span>Country</span><input value={settings.country} onChange={(event) => update("country", event.target.value)} /></label>
                <label><span>City</span><input value={settings.city} onChange={(event) => update("city", event.target.value)} /></label>
                <label><span>Address</span><input value={settings.address} onChange={(event) => update("address", event.target.value)} /></label>
                <label><span>Location label</span><input value={settings.location} onChange={(event) => update("location", event.target.value)} /></label>
                <label><span>Timezone</span><input value={settings.timezone} onChange={(event) => update("timezone", event.target.value)} /></label>
              </div>
            </Card>

            <Card>
              <SectionHeader title="Prayer Settings" eyebrow="Calculation rules" />
              <div className="form-grid two">
                <label><span>Calculation method</span><select value={settings.calculationMethod} onChange={(event) => update("calculationMethod", event.target.value)}><option>ISNA</option><option>MWL</option><option>Umm al-Qura</option><option>Karachi</option></select></label>
                <label><span>Asr method</span><select value={settings.asrMethod} onChange={(event) => update("asrMethod", event.target.value)}><option>Standard</option><option>Hanafi</option></select></label>
              </div>
              <div className="settings-toggles">
                <Toggle label="Email notifications" checked={settings.emailNotifications} onChange={(value) => update("emailNotifications", value)} />
                <Toggle label="Push notifications" checked={settings.pushNotifications} onChange={(value) => update("pushNotifications", value)} />
                <Toggle label="SMS notifications" checked={settings.smsNotifications} onChange={(value) => update("smsNotifications", value)} />
                <Toggle label="Automatic receipts" checked={settings.receiptGeneration} onChange={(value) => update("receiptGeneration", value)} />
              </div>
            </Card>
          </div>

          <div className="settings-grid">
            <BillingPanel billing={billing} busy={billingBusy} onManage={() => void manageBilling()} />
            <SettingsPanel icon={BellRing} title="Notification Settings" items={[settings.emailNotifications ? "Email enabled" : "Email disabled", settings.pushNotifications ? "Push enabled" : "Push disabled", settings.smsNotifications ? "SMS enabled" : "SMS disabled"]} />
            <SettingsPanel icon={UsersRound} title="Workspace Access" items={[`${user?.name} - Administrator`, user?.email ?? "", "Role-based routes enforced"]} />
            <SettingsPanel icon={LockKeyhole} title="Security" items={["Passwords protected with scrypt", "HttpOnly session cookie", "Audit log enabled"]} />
          </div>

          <div className="dashboard-grid">
            <TrustStrip />
            <Card>
              <SectionHeader title="Workspace Summary" eyebrow="Tenant data" />
              <div className="info-box"><MapPin size={20} /><p>{settings.name} keeps its own profile, timezone, prayer settings, donations, announcements, and reports.</p></div>
              <div className="info-box"><ShieldCheck size={20} /><p>Access is limited to signed-in users assigned to this masjid workspace.</p></div>
            </Card>
          </div>
        </>
      ) : null}
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

function BillingPanel({ billing, busy, onManage }: { billing: BillingStatus | null; busy: boolean; onManage: () => void }) {
  const isActive = Boolean(billing && ["active", "trialing", "past_due"].includes(billing.status));
  const renewsOn = billing?.currentPeriodEnd
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(billing.currentPeriodEnd))
    : null;
  return (
    <Card>
      <SectionHeader title="Plan & Billing" eyebrow="Subscription" action={<CreditCard size={18} />} />
      <div className="billing-summary">
        <div>
          <span>Current plan</span>
          <strong>{billing?.planName ?? "No active plan"}</strong>
        </div>
        <Badge tone={isActive ? "green" : "neutral"}>{billing?.status.replaceAll("_", " ") ?? "inactive"}</Badge>
      </div>
      {isActive ? <p>{billing?.monthlyPrice ? `$${billing.monthlyPrice}/month` : "Subscription active"}{renewsOn ? ` - ${billing?.cancelAtPeriodEnd ? "Ends" : "Renews"} ${renewsOn}` : ""}</p> : <p>Choose a monthly plan to activate Stripe billing for this workspace.</p>}
      {billing?.synced === false ? <p className="settings-note">Showing the latest saved billing status. Stripe sync will retry automatically.</p> : null}
      <button className="secondary-button full" disabled={busy || (!billing?.checkoutReady && !isActive)} type="button" onClick={onManage}>
        {busy ? "Opening Stripe..." : isActive ? "Manage Billing" : "Choose a Plan"}
      </button>
    </Card>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="toggle-row"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}

function SettingsPanel({ icon: Icon, title, items }: { icon: ElementType; title: string; items: string[] }) {
  return (
    <Card>
      <SectionHeader title={title} action={<Icon size={18} />} />
      <div className="checklist">{items.filter(Boolean).map((item) => <span key={item}>{item}</span>)}</div>
    </Card>
  );
}

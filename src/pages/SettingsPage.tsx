import { BellRing, CreditCard, LockKeyhole, MapPin, ShieldCheck, UsersRound } from "lucide-react";
import type { ElementType } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Card, LoadingSkeleton, SectionHeader, Toast, TrustStrip } from "../components/ui";
import { getWorkspaceSettings, updateWorkspaceSettings } from "../services/api";
import type { WorkspaceSettings } from "../types";

export function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getWorkspaceSettings()
      .then(setSettings)
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
            <SettingsPanel icon={CreditCard} title="Payment Settings" items={["Receipt generation configured", "Refund review required", "Stripe connection available in Payments"]} />
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

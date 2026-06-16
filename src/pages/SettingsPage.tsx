import { BellRing, CreditCard, LockKeyhole, MapPin, ShieldCheck, Upload, UsersRound } from "lucide-react";
import type { ElementType } from "react";
import { Card, SectionHeader, TrustStrip } from "../components/ui";

export function SettingsPage() {
  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>Manage masjid profile, payment, notification, team, and security settings.</h1>
        </div>
        <button className="primary-button" type="button">Save Settings</button>
      </div>

      <div className="settings-grid">
        <Card>
          <SectionHeader title="Masjid Profile" eyebrow="Workspace identity" />
          <div className="form-grid two">
            <label><span>Masjid name</span><input defaultValue="Masjid Al-Furqan" /></label>
            <label><span>Logo upload</span><button className="secondary-button full" type="button"><Upload size={16} /> Upload logo</button></label>
            <label><span>Location</span><input defaultValue="Houston, TX" /></label>
            <label><span>Timezone</span><input defaultValue="America/Chicago" /></label>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Prayer Settings" eyebrow="Calculation rules" />
          <div className="form-grid two">
            <label><span>Calculation method</span><select defaultValue="ISNA"><option>ISNA</option><option>MWL</option><option>Umm al-Qura</option></select></label>
            <label><span>Asr method</span><select defaultValue="Hanafi"><option>Standard</option><option>Hanafi</option></select></label>
            <label><span>Jumuah reminder</span><select defaultValue="30"><option value="15">15 minutes before</option><option value="30">30 minutes before</option></select></label>
            <label><span>Daily prayer reminder</span><select defaultValue="20"><option value="10">10 minutes before</option><option value="20">20 minutes before</option></select></label>
          </div>
        </Card>
      </div>

      <div className="settings-grid">
        <SettingsPanel icon={CreditCard} title="Payment Settings" items={["Stripe connected", "Receipt generation enabled", "Refund review required"]} />
        <SettingsPanel icon={BellRing} title="Notification Settings" items={["Email enabled", "Push notifications enabled", "SMS requires Twilio setup"]} />
        <SettingsPanel icon={UsersRound} title="Team Members" items={["Imam Abdullah - Super Admin", "Finance Admin - Donations", "Volunteer Lead - Announcements"]} />
        <SettingsPanel icon={LockKeyhole} title="Security Settings" items={["Two-factor authentication planned", "Audit log enabled", "Role-based navigation active"]} />
      </div>

      <div className="dashboard-grid">
        <TrustStrip />
        <Card>
          <SectionHeader title="Workspace Summary" eyebrow="Multi-masjid ready" />
          <div className="info-box">
            <MapPin size={20} />
            <p>Each registered masjid keeps its own workspace, logo, location, timezone, prayer settings, and payment setup.</p>
          </div>
          <div className="info-box">
            <ShieldCheck size={20} />
            <p>Donation audit log and receipt confirmation are enabled for Phase 1 trust signals.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SettingsPanel({
  icon: Icon,
  title,
  items,
}: {
  icon: ElementType;
  title: string;
  items: string[];
}) {
  return (
    <Card>
      <SectionHeader title={title} action={<Icon size={18} />} />
      <div className="checklist">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </Card>
  );
}

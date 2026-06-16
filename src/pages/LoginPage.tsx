import { useState } from "react";
import type { ElementType } from "react";
import {
  ArrowRight,
  Building2,
  Clock3,
  Globe2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { masjids } from "../data/mockData";

type AuthTab = "signin" | "masjid" | "donor";

export function LoginPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-mark large">M</div>
        <span className="eyebrow">MasjidPro AI</span>
        <h1>Modern masjid operations for admins and donors.</h1>
        <p>
          Register a masjid workspace, manage donations and prayer times, or let donors give and
          download receipts from a clean secure portal.
        </p>
        <div className="login-trust">
          <ShieldCheck size={18} />
          Stripe secured payments, privacy-ready records, and receipt confirmations
        </div>
      </section>

      <section className="login-card">
        <div>
          <span className="eyebrow">Welcome</span>
          <h2>{activeTab === "signin" ? "Sign in to MasjidPro" : activeTab === "masjid" ? "Register your masjid" : "Create donor account"}</h2>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication options">
          <button className={activeTab === "signin" ? "active" : ""} type="button" onClick={() => setActiveTab("signin")}>
            Sign In
          </button>
          <button className={activeTab === "masjid" ? "active" : ""} type="button" onClick={() => setActiveTab("masjid")}>
            Register Masjid
          </button>
          <button className={activeTab === "donor" ? "active" : ""} type="button" onClick={() => setActiveTab("donor")}>
            Donor Register
          </button>
        </div>

        {activeTab === "signin" ? <SignInForm /> : null}
        {activeTab === "masjid" ? <MasjidRegistrationForm /> : null}
        {activeTab === "donor" ? <DonorRegistrationForm /> : null}
      </section>
    </main>
  );
}

function SignInForm() {
  return (
    <>
      <label>
        <span>Email Address</span>
        <div className="input-icon">
          <Mail size={18} />
          <input placeholder="imam@masjid.org" type="email" />
        </div>
      </label>
      <label>
        <span>Password</span>
        <div className="input-icon">
          <Lock size={18} />
          <input placeholder="Password" type="password" />
        </div>
      </label>
      <div className="login-options">
        <label><input type="checkbox" defaultChecked /> Remember this device</label>
        <a href="#">Forgot password?</a>
      </div>
      <Link className="primary-button full" to="/dashboard">
        Sign In as Admin
        <ArrowRight size={18} />
      </Link>
      <Link className="secondary-button full" to="/donor-portal">
        Continue as Donor
      </Link>
      <button className="secondary-button full" type="button">Continue with Google</button>
      <div className="auth-ctas">
        <span>New Masjid? Register your Masjid</span>
        <span>Donor? Create donor account</span>
      </div>
    </>
  );
}

function MasjidRegistrationForm() {
  return (
    <div className="registration-form">
      <div className="form-grid two">
        <IconField icon={Building2} label="Masjid name" placeholder="Masjid Al-Furqan" />
        <IconField icon={Globe2} label="Country" placeholder="United States" />
        <IconField icon={MapPin} label="City" placeholder="Houston" />
        <IconField icon={MapPin} label="Address" placeholder="123 Community Drive" />
        <IconField icon={Clock3} label="Timezone" placeholder="America/Chicago" />
        <label>
          <span>Prayer calculation method</span>
          <select defaultValue="ISNA">
            <option>ISNA</option>
            <option>MWL</option>
            <option>Umm al-Qura</option>
            <option>Karachi</option>
          </select>
        </label>
        <label>
          <span>Asr method</span>
          <select defaultValue="Hanafi">
            <option>Standard</option>
            <option>Hanafi</option>
          </select>
        </label>
        <IconField icon={UserRound} label="Admin name" placeholder="Imam Abdullah" />
        <IconField icon={Mail} label="Admin email" placeholder="admin@masjid.org" />
        <IconField icon={Lock} label="Password" placeholder="Create password" type="password" />
      </div>
      <label className="upload-field">
        <Upload size={18} />
        <span>Upload logo</span>
        <input type="file" />
      </label>
      <Link className="primary-button full" to="/dashboard">
        Create Masjid Workspace
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}

function DonorRegistrationForm() {
  return (
    <div className="registration-form">
      <div className="form-grid two">
        <IconField icon={UserRound} label="Full name" placeholder="Aisha Rahman" />
        <IconField icon={Mail} label="Email" placeholder="donor@email.com" />
        <IconField icon={Phone} label="Phone" placeholder="+1 713 555 0100" />
        <IconField icon={Lock} label="Password" placeholder="Create password" type="password" />
        <label className="wide">
          <span>Select masjid</span>
          <select defaultValue={masjids[0].id}>
            {masjids.map((masjid) => (
              <option key={masjid.id} value={masjid.id}>
                {masjid.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Link className="primary-button full" to="/donor-portal">
        Create Donor Account
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}

function IconField({
  icon: Icon,
  label,
  placeholder,
  type = "text",
}: {
  icon: ElementType;
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label>
      <span>{label}</span>
      <div className="input-icon">
        <Icon size={18} />
        <input placeholder={placeholder} type={type} />
      </div>
    </label>
  );
}

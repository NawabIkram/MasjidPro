import { useEffect, useState } from "react";
import type { FormEvent } from "react";
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
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { Toast } from "../components/ui";
import { ApiError, getMasjids } from "../services/api";
import type { DonorRegistrationInput, GoogleAuthInput, MasjidRegistrationInput } from "../services/api";
import type { Masjid } from "../types";

type AuthTab = "signin" | "masjid" | "donor";

const initialMasjid: MasjidRegistrationInput = {
  masjidName: "",
  country: "",
  city: "",
  address: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Karachi",
  calculationMethod: "ISNA",
  asrMethod: "Hanafi",
  adminName: "",
  adminEmail: "",
  password: "",
};

const initialDonor: DonorRegistrationInput = {
  name: "",
  email: "",
  phone: "",
  password: "",
  masjidId: "",
};

export function LoginPage() {
  const { user, login, continueWithGoogle, registerMasjid, registerDonor } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [signin, setSignin] = useState({ email: "", password: "" });
  const [masjidForm, setMasjidForm] = useState(initialMasjid);
  const [donorForm, setDonorForm] = useState(initialDonor);

  useEffect(() => {
    if (user) navigate(user.role === "admin" ? "/dashboard" : "/donor-portal", { replace: true });
  }, [navigate, user]);

  useEffect(() => {
    getMasjids().then((records) => {
      setMasjids(records);
      setDonorForm((current) => ({ ...current, masjidId: current.masjidId || records[0]?.id || "" }));
    });
  }, []);

  const runAuth = async (
    action: () => Promise<{ role: "admin" | "donor" }>,
    onFailure?: (caught: unknown) => boolean,
  ) => {
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const account = await action();
      navigate(account.role === "admin" ? "/dashboard" : "/donor-portal", { replace: true });
    } catch (caught) {
      if (onFailure?.(caught)) return;
      setError(caught instanceof Error ? caught.message : "Unable to complete this request.");
    } finally {
      setSubmitting(false);
    }
  };

  const runGoogleAuth = (credential: string, mode: AuthTab) => {
    let input: GoogleAuthInput;
    if (mode === "donor") {
      if (!donorForm.masjidId) {
        setError("Please select a masjid before continuing with Google.");
        return;
      }
      input = { credential, mode: "donor", masjidId: donorForm.masjidId, phone: donorForm.phone };
    } else if (mode === "masjid") {
      const required = [masjidForm.masjidName, masjidForm.country, masjidForm.city, masjidForm.address, masjidForm.timezone];
      if (required.some((value) => !value.trim())) {
        setError("Complete the masjid details before continuing with Google.");
        return;
      }
      input = {
        credential,
        mode: "masjid",
        masjidName: masjidForm.masjidName,
        country: masjidForm.country,
        city: masjidForm.city,
        address: masjidForm.address,
        timezone: masjidForm.timezone,
        calculationMethod: masjidForm.calculationMethod,
        asrMethod: masjidForm.asrMethod,
        phone: masjidForm.phone,
      };
    } else {
      input = { credential, mode: "sign-in" };
    }
    void runAuth(
      () => continueWithGoogle(input),
      (caught) => {
        if (mode !== "signin" || !(caught instanceof ApiError) || caught.status !== 404) return false;
        setActiveTab("donor");
        setNotice("This Google account is new. Select a masjid and choose Sign up with Google to create a donor account, or use Register Masjid for an administrator account.");
        return true;
      },
    );
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-mark large">M</div>
        <span className="eyebrow">MasjidPro AI</span>
        <h1>Modern masjid operations for admins and donors.</h1>
        <p>Register a workspace, manage giving and prayer times, or access donor receipts through one secure account.</p>
        <div className="login-trust">
          <ShieldCheck size={18} />
          Secure sessions, privacy-ready records, and persistent receipt history
        </div>
      </section>

      <section className="login-card">
        <div>
          <span className="eyebrow">Welcome</span>
          <h2>{activeTab === "signin" ? "Sign in to MasjidPro" : activeTab === "masjid" ? "Register your masjid" : "Create donor account"}</h2>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication options">
          <button className={activeTab === "signin" ? "active" : ""} type="button" onClick={() => { setActiveTab("signin"); setError(""); setNotice(""); }}>Sign In</button>
          <button className={activeTab === "masjid" ? "active" : ""} type="button" onClick={() => { setActiveTab("masjid"); setError(""); setNotice(""); }}>Register Masjid</button>
          <button className={activeTab === "donor" ? "active" : ""} type="button" onClick={() => { setActiveTab("donor"); setError(""); setNotice(""); }}>Donor Register</button>
        </div>

        {error ? <div className="auth-error" role="alert">{error}</div> : null}
        {notice ? <div className="auth-notice" role="status">{notice}</div> : null}

        {activeTab === "signin" ? (
          <form onSubmit={(event) => { event.preventDefault(); void runAuth(() => login(signin.email, signin.password)); }}>
            <label>
              <span>Email Address</span>
              <div className="input-icon"><Mail size={18} /><input required autoComplete="email" value={signin.email} onChange={(event) => setSignin((current) => ({ ...current, email: event.target.value }))} placeholder="admin@masjid.org" type="email" /></div>
            </label>
            <label>
              <span>Password</span>
              <div className="input-icon"><Lock size={18} /><input required minLength={8} autoComplete="current-password" value={signin.password} onChange={(event) => setSignin((current) => ({ ...current, password: event.target.value }))} placeholder="Password" type="password" /></div>
            </label>
            <div className="login-options">
              <label><input type="checkbox" defaultChecked /> Remember this device</label>
              <button type="button" onClick={() => setToast("Password reset email service will be available after email provider setup.")}>Forgot password?</button>
            </div>
            <button className="primary-button full" disabled={submitting} type="submit">{submitting ? "Signing in..." : "Sign In"}<ArrowRight size={18} /></button>
            <AuthDivider />
            <GoogleSignInButton
              disabled={submitting}
              onCredential={(credential) => runGoogleAuth(credential, "signin")}
              onStart={() => { setError(""); setNotice(""); }}
            />
            <div className="auth-ctas">
              <button type="button" onClick={() => setActiveTab("masjid")}>New Masjid? Register your Masjid</button>
              <button type="button" onClick={() => setActiveTab("donor")}>Donor? Create donor account</button>
            </div>
          </form>
        ) : null}

        {activeTab === "masjid" ? (
          <MasjidRegistrationForm
            value={masjidForm}
            submitting={submitting}
            onChange={setMasjidForm}
            onSubmit={(event) => { event.preventDefault(); void runAuth(() => registerMasjid(masjidForm)); }}
            onGoogle={(credential) => runGoogleAuth(credential, "masjid")}
          />
        ) : null}

        {activeTab === "donor" ? (
          <DonorRegistrationForm
            value={donorForm}
            masjids={masjids}
            submitting={submitting}
            onChange={setDonorForm}
            onSubmit={(event) => { event.preventDefault(); void runAuth(() => registerDonor(donorForm)); }}
            onGoogle={(credential) => runGoogleAuth(credential, "donor")}
          />
        ) : null}
      </section>
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </main>
  );
}

function MasjidRegistrationForm({
  value,
  submitting,
  onChange,
  onSubmit,
  onGoogle,
}: {
  value: MasjidRegistrationInput;
  submitting: boolean;
  onChange: (value: MasjidRegistrationInput) => void;
  onSubmit: (event: FormEvent) => void;
  onGoogle: (credential: string) => void;
}) {
  const field = (name: keyof MasjidRegistrationInput) => ({
    value: value[name] ?? "",
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [name]: event.target.value }),
  });

  return (
    <form className="registration-form" onSubmit={onSubmit}>
      <div className="form-grid two">
        <AuthField icon={Building2} label="Masjid name" placeholder="Masjid Al-Furqan" {...field("masjidName")} />
        <AuthField icon={Globe2} label="Country" placeholder="Pakistan" {...field("country")} />
        <AuthField icon={MapPin} label="City" placeholder="Islamabad" {...field("city")} />
        <AuthField icon={MapPin} label="Address" placeholder="Community address" {...field("address")} />
        <AuthField icon={Clock3} label="Timezone" placeholder="Asia/Karachi" {...field("timezone")} />
        <label><span>Prayer calculation method</span><select {...field("calculationMethod")}><option>ISNA</option><option>MWL</option><option>Umm al-Qura</option><option>Karachi</option></select></label>
        <label><span>Asr method</span><select {...field("asrMethod")}><option>Standard</option><option>Hanafi</option></select></label>
        <AuthField icon={UserRound} label="Admin name" placeholder="Admin full name" {...field("adminName")} />
        <AuthField icon={Mail} label="Admin email" placeholder="admin@masjid.org" type="email" {...field("adminEmail")} />
        <AuthField icon={Lock} label="Password" placeholder="Minimum 8 characters" type="password" minLength={8} {...field("password")} />
      </div>
      <button className="primary-button full" disabled={submitting} type="submit">{submitting ? "Creating workspace..." : "Create Masjid Workspace"}<ArrowRight size={18} /></button>
      <AuthDivider />
      <GoogleSignInButton
        disabled={submitting || [value.masjidName, value.country, value.city, value.address, value.timezone].some((item) => !item.trim())}
        onCredential={onGoogle}
        text="signup_with"
      />
    </form>
  );
}

function DonorRegistrationForm({
  value,
  masjids,
  submitting,
  onChange,
  onSubmit,
  onGoogle,
}: {
  value: DonorRegistrationInput;
  masjids: Masjid[];
  submitting: boolean;
  onChange: (value: DonorRegistrationInput) => void;
  onSubmit: (event: FormEvent) => void;
  onGoogle: (credential: string) => void;
}) {
  return (
    <form className="registration-form" onSubmit={onSubmit}>
      <div className="form-grid two">
        <AuthField icon={UserRound} label="Full name" placeholder="Aisha Rahman" value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} />
        <AuthField icon={Mail} label="Email" placeholder="donor@email.com" type="email" value={value.email} onChange={(event) => onChange({ ...value, email: event.target.value })} />
        <AuthField icon={Phone} label="Phone" placeholder="+92 300 0000000" type="tel" value={value.phone} onChange={(event) => onChange({ ...value, phone: event.target.value })} />
        <AuthField icon={Lock} label="Password" placeholder="Minimum 8 characters" type="password" minLength={8} value={value.password} onChange={(event) => onChange({ ...value, password: event.target.value })} />
        <label className="wide"><span>Select masjid</span><select required value={value.masjidId} onChange={(event) => onChange({ ...value, masjidId: event.target.value })}>{masjids.map((masjid) => <option key={masjid.id} value={masjid.id}>{masjid.name} - {masjid.location}</option>)}</select></label>
      </div>
      <button className="primary-button full" disabled={submitting || !value.masjidId} type="submit">{submitting ? "Creating account..." : "Create Donor Account"}<ArrowRight size={18} /></button>
      <AuthDivider />
      <GoogleSignInButton disabled={submitting || !value.masjidId} onCredential={onGoogle} text="signup_with" />
    </form>
  );
}

function AuthDivider() {
  return <div className="auth-divider" aria-hidden="true"><span>or</span></div>;
}

function AuthField({ icon: Icon, label, minLength, ...input }: {
  icon: typeof UserRound;
  label: string;
  placeholder: string;
  type?: string;
  minLength?: number;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <div className="input-icon"><Icon size={18} /><input required minLength={minLength} autoComplete="off" {...input} /></div>
    </label>
  );
}

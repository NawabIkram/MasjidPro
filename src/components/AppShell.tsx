import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Bot,
  Calculator,
  ChevronDown,
  Globe,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Repeat2,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n/i18n";
import { AiAssistant } from "./AiAssistant";
import { Modal, Toast } from "./ui";

const adminNavItems = [
  { to: "/dashboard", key: "nav_dashboard", mobileKey: "mobile_home", icon: LayoutDashboard },
  { to: "/donations", key: "nav_donations", mobileKey: "mobile_giving", icon: WalletCards },
  { to: "/zakat", key: "nav_zakat", mobileKey: "nav_zakat", icon: Calculator },
  { to: "/prayer-times", key: "nav_prayerTimes", mobileKey: "mobile_prayer", icon: Moon },
  { to: "/announcements", key: "nav_announcements", mobileKey: "mobile_news", icon: Megaphone },
  { to: "/reports", key: "nav_reports", mobileKey: "mobile_reports", icon: BarChart3 },
  { to: "/donors", key: "nav_donors", mobileKey: "nav_donors", icon: UsersRound },
  { to: "/settings", key: "nav_settings", mobileKey: "nav_settings", icon: Settings },
];

const donorNavItems = [
  { to: "/donor-portal", key: "nav_donorDashboard", mobileKey: "mobile_home", icon: LayoutDashboard },
  { to: "/donate", key: "nav_donate", mobileKey: "mobile_donate", icon: HandCoins },
  { to: "/my-donations", key: "nav_myDonations", mobileKey: "mobile_history", icon: WalletCards },
  { to: "/receipts", key: "nav_receipts", mobileKey: "nav_receipts", icon: ReceiptText },
  { to: "/recurring", key: "nav_recurring", mobileKey: "mobile_recurring", icon: Repeat2 },
  { to: "/prayer-times", key: "nav_prayerTimes", mobileKey: "mobile_prayer", icon: Moon },
  { to: "/announcements", key: "nav_announcements", mobileKey: "mobile_news", icon: Megaphone },
  { to: "/profile", key: "nav_profile", mobileKey: "nav_profile", icon: UserRound },
];

export function AppShell() {
  const { t, lang, setLang } = useLanguage();
  const { user, masjids, logout, selectMasjid } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const activeRole = user?.role ?? "admin";
  const activeMasjid = masjids.find((masjid) => masjid.id === user?.preferredMasjidId) ?? masjids[0];
  const navItems = activeRole === "admin" ? adminNavItems : donorNavItems;

  const title = useMemo(() => {
    const active = [...adminNavItems, ...donorNavItems].find((item) => item.to === location.pathname);
    return active ? t(active.key as never) : t("nav_dashboard");
  }, [location.pathname, t]);

  if (!user || !activeMasjid) return null;

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const signOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">
      <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
        <div className="brand">
          <div className="brand-mark">M</div>
          <div className="brand-copy">
            <strong>{t("brandName")}</strong>
            <span>{activeRole === "admin" ? t("adminSuite") : t("donorPortal")}</span>
          </div>
        </div>
        <nav className="side-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              <item.icon size={20} />
              <span>{t(item.key as never)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="secure-note">
            <ShieldCheck size={18} />
            <span>{t("privacyReady")}</span>
          </div>
          <button type="button" className="logout-link" onClick={() => void signOut()}>
            <LogOut size={18} />
            <span>{t("signOut")}</span>
          </button>
        </div>
      </aside>

      <div className="main-frame">
        <header className="topbar">
          <button
            className="icon-button desktop-only"
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
          <button className="icon-button mobile-only" type="button" aria-label={t("openMenu")} onClick={() => setShowMobileMenu(true)}>
            <Menu size={20} />
          </button>
          <div className="page-heading">
            <span className="eyebrow">{t("activeDashboard")}</span>
            <h1>{title}</h1>
          </div>
          <label className="masjid-selector">
            <span>{t("masjid")}</span>
            <select value={activeMasjid.id} onChange={(event) => void selectMasjid(event.target.value)}>
              {masjids.map((masjid) => (
                <option key={masjid.id} value={masjid.id}>{masjid.name}</option>
              ))}
            </select>
            <ChevronDown size={16} />
          </label>
          <div className="role-selector role-badge">
            <span>{t("role")}</span>
            <strong>{activeRole === "admin" ? t("admin") : t("donor")}</strong>
          </div>

          <div className="topbar-actions">
            <button className="search-button" type="button" onClick={() => setShowSearch(true)}>
              <Search size={18} />
              <span>{t("search")}</span>
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              aria-label={t("language")}
              title={lang === "en" ? "Switch to Arabic" : "Switch to English"}
            >
              <Globe size={20} />
            </button>
            <button className="icon-button" type="button" aria-label={t("notifications")} onClick={() => setToast("No unread notifications.")}>
              <Bell size={20} />
            </button>
            <div className="avatar" title={user.name}>{initials}</div>
          </div>
        </header>

        <div className="active-masjid-strip">
          <strong>{activeMasjid.name}</strong>
          <span>{activeMasjid.location}</span>
          <span>{activeMasjid.method}</span>
        </div>

        <main className="content">
          <Outlet context={{ activeMasjid, activeRole }} />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map((item) => (
          <NavLink key={item.to} to={item.to}>
            <item.icon size={20} />
            <span>{t(item.mobileKey as never)}</span>
          </NavLink>
        ))}
        <NavLink to={activeRole === "admin" ? "/reports" : "/profile"}>
          <Bot size={20} />
          <span>{t("nav_more")}</span>
        </NavLink>
      </nav>

      <AiAssistant />
      {showMobileMenu ? (
        <div className="mobile-menu-backdrop" role="presentation" onClick={() => setShowMobileMenu(false)}>
          <section className="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Mobile menu" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">{activeMasjid.name}</span>
                <h2>{activeRole === "admin" ? t("adminSuite") : t("donorPortal")}</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close menu" onClick={() => setShowMobileMenu(false)}>
                <PanelLeftClose size={18} />
              </button>
            </div>

            <div className="mobile-menu-context">
              <label>
                <span>{t("masjid")}</span>
                <select value={activeMasjid.id} onChange={(event) => void selectMasjid(event.target.value)}>
                  {masjids.map((masjid) => (
                    <option key={masjid.id} value={masjid.id}>{masjid.name}</option>
                  ))}
                </select>
              </label>
              <div className="mobile-role-display">
                <span>{t("role")}</span>
                <strong>{activeRole === "admin" ? t("admin") : t("donor")}</strong>
              </div>
            </div>

            <label className="mobile-menu-search">
              <Search size={18} />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search sections" />
            </label>

            <nav className="mobile-menu-grid" aria-label="All mobile navigation">
              {navItems
                .filter((item) => t(item.key as never).toLowerCase().includes(searchQuery.toLowerCase()) || item.to.includes(searchQuery.toLowerCase()))
                .map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={() => setShowMobileMenu(false)}>
                    <item.icon size={18} />
                    <span>{t(item.key as never)}</span>
                  </NavLink>
                ))}
            </nav>
          </section>
        </div>
      ) : null}
      {showSearch ? (
        <Modal title="Search MasjidPro" description="Jump to a product area by typing a keyword." onClose={() => setShowSearch(false)}>
          <div className="form-grid">
            <label>
              <span>Search</span>
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="donations, reports, prayer..." />
            </label>
            <div className="quick-actions">
              {navItems
                .filter((item) => t(item.key as never).toLowerCase().includes(searchQuery.toLowerCase()) || item.to.includes(searchQuery.toLowerCase()))
                .map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      navigate(item.to);
                      setShowSearch(false);
                    }}
                  >
                    <item.icon size={18} />
                    {t(item.key as never)}
                  </button>
                ))}
            </div>
          </div>
        </Modal>
      ) : null}
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

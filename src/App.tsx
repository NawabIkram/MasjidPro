import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DemoPage } from "./pages/DemoPage";
import { DonationsPage } from "./pages/DonationsPage";
import { DonorPortalPage } from "./pages/DonorPortalPage";
import { DonorsPage } from "./pages/DonorsPage";
import { LoginPage } from "./pages/LoginPage";
import { MarketingPage } from "./pages/MarketingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PrayerTimesPage } from "./pages/PrayerTimesPage";
import { PricingPage } from "./pages/PricingPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ZakatPage } from "./pages/ZakatPage";
import { LanguageProvider } from "./i18n/i18n";

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MarketingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/checkout/:planId" element={<CheckoutPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/prayer-times" element={<PrayerTimesPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/zakat" element={<ZakatPage />} />
              <Route element={<ProtectedRoute role="admin" />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/donations" element={<DonationsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/donors" element={<DonorsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route element={<ProtectedRoute role="donor" />}>
                <Route path="/donor-portal" element={<DonorPortalPage />} />
                <Route path="/donate" element={<DonorPortalPage view="donate" />} />
                <Route path="/my-donations" element={<DonorPortalPage view="donations" />} />
                <Route path="/receipts" element={<DonorPortalPage view="receipts" />} />
                <Route path="/recurring" element={<DonorPortalPage view="recurring" />} />
                <Route path="/profile" element={<DonorPortalPage view="profile" />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}

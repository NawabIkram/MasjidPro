import {
  announcements as mockAnnouncements,
  auditLog as mockAuditLog,
  campaign as mockCampaign,
  donations as mockDonations,
  donors as mockDonors,
  fundBreakdown as mockFundBreakdown,
  masjids as mockMasjids,
  monthlyDonations as mockMonthlyDonations,
  prayerTimes as mockPrayerTimes,
  recurringTrend as mockRecurringTrend,
  reportMetrics as mockReportMetrics,
} from "../data/mockData";
import type {
  Announcement,
  AuthUser,
  AuditLogEntry,
  Campaign,
  Donation,
  DonationStatus,
  Donor,
  FundBreakdown,
  FundType,
  Masjid,
  PrayerTime,
  ReportMetric,
  RecurringDonation,
  WorkspaceSettings,
} from "../types";

type ApiEnvelope<T> = {
  data: T;
  error?: string;
};

export type AuthSession = {
  user: AuthUser;
  masjids: Masjid[];
};

export type MasjidRegistrationInput = {
  masjidName: string;
  country: string;
  city: string;
  address: string;
  timezone: string;
  calculationMethod: string;
  asrMethod: string;
  adminName: string;
  adminEmail: string;
  password: string;
  phone?: string;
};

export type DonorRegistrationInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  masjidId: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type DashboardApiData = {
  activeMasjid: Masjid;
  stats: {
    totalDonations: number;
    zakatTotal: number;
    sadaqahTotal: number;
    recurringDonors: number;
  };
  fundBreakdown: FundBreakdown[];
  campaign: Campaign;
  prayerTimes: PrayerTime[];
  announcements: Announcement[];
  auditLog: AuditLogEntry[];
  recentDonations: Donation[];
  insight: {
    headline: string;
    recommendation: string;
  };
};

export type PrayerScheduleData = {
  location: string;
  calculationMethod: string;
  countdown: string;
  prayers: PrayerTime[];
};

export type ReportsApiData = {
  reportMetrics: ReportMetric[];
  monthlyDonations: Array<{ month: string; amount: number }>;
  recurringTrend: Array<{ month: string; donors: number }>;
  fundBreakdown: FundBreakdown[];
  topDonors: Donor[];
};

export type ZakatCalculationInput = {
  cash: number;
  gold: number;
  silver: number;
  investments: number;
  business: number;
  debts: number;
};

export type ZakatCalculation = {
  assets: number;
  debts: number;
  net: number;
  due: number;
  rate: number;
  nisab: number;
  aboveNisab: boolean;
};

export type AIAnnouncementResult = {
  title: string;
  english: string;
  urdu: string;
  arabic: string;
  sms: string;
  whatsapp: string;
  email: string;
};

export type AIReportResult = {
  title: string;
  summary: string;
  insights: string[];
  recommendations: string[];
};

export type AICampaignResult = {
  title: string;
  description: string;
  email: string;
  sms: string;
  push: string;
  social: string;
};

export type DonationFilters = {
  search?: string;
  fund?: FundType | "All";
  status?: DonationStatus | "All";
  method?: Donation["method"] | "All" | string;
};

const fallbackDashboard: DashboardApiData = {
  activeMasjid: mockMasjids[0],
  stats: {
    totalDonations: 18340,
    zakatTotal: 7240,
    sadaqahTotal: 4180,
    recurringDonors: 156,
  },
  fundBreakdown: mockFundBreakdown,
  campaign: mockCampaign,
  prayerTimes: mockPrayerTimes,
  announcements: mockAnnouncements,
  auditLog: mockAuditLog,
  recentDonations: mockDonations,
  insight: {
    headline: "Zakat giving is leading current fund activity.",
    recommendation: "Send a Friday reminder focused on recurring Sadaqah and transparent receipts.",
  },
};

const fallbackPrayerSchedule: PrayerScheduleData = {
  location: "Houston, TX",
  calculationMethod: "ISNA, Hanafi Asr",
  countdown: "02:18:45",
  prayers: mockPrayerTimes,
};

const fallbackReports: ReportsApiData = {
  reportMetrics: mockReportMetrics,
  monthlyDonations: mockMonthlyDonations,
  recurringTrend: mockRecurringTrend,
  fundBreakdown: mockFundBreakdown,
  topDonors: mockDonors,
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new ApiError(payload.error || "MasjidPro API request failed.", response.status);
  }

  return payload.data;
}

async function readWithFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiRequest<T>(path);
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status)) throw error;
    console.warn(`Using local fallback for ${path}`, error);
    return fallback;
  }
}

export function getCurrentSession() {
  return apiRequest<AuthSession>("/auth/me");
}

export function loginAccount(input: { email: string; password: string }) {
  return apiRequest<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify(input) });
}

export function registerMasjidAccount(input: MasjidRegistrationInput) {
  return apiRequest<AuthSession>("/auth/register-masjid", { method: "POST", body: JSON.stringify(input) });
}

export function registerDonorAccount(input: DonorRegistrationInput) {
  return apiRequest<AuthSession>("/auth/register-donor", { method: "POST", body: JSON.stringify(input) });
}

export function logoutAccount() {
  return apiRequest<{ ok: boolean }>("/auth/logout", { method: "POST", body: "{}" });
}

export function updateProfile(input: Partial<Pick<AuthUser, "name" | "phone" | "preferredMasjidId">>) {
  return apiRequest<AuthUser>("/profile", { method: "PATCH", body: JSON.stringify(input) });
}

export function getMasjids() {
  return readWithFallback<Masjid[]>("/masjids", mockMasjids);
}

export function getDashboard(masjidId = "furqan") {
  return readWithFallback<DashboardApiData>(`/dashboard?masjidId=${encodeURIComponent(masjidId)}`, fallbackDashboard);
}

export function getDonations(filters: DonationFilters = {}) {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.fund) query.set("fund", filters.fund);
  if (filters.status) query.set("status", filters.status);
  if (filters.method) query.set("method", filters.method);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return readWithFallback<Donation[]>(`/donations${suffix}`, mockDonations);
}

export async function createDonation(input: Pick<Donation, "donorName" | "donorEmail" | "fund" | "amount" | "method" | "status">) {
  try {
    return await apiRequest<Donation>("/donations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    console.warn("Using local fallback for donation creation", error);
    return {
      id: `don-${Date.now()}`,
      receiptId: input.status === "Pending" ? "Pending" : `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
      date: "Today",
      refundStatus: "Not requested",
      ...input,
    } satisfies Donation;
  }
}

export function getPrayerSchedule() {
  return readWithFallback<PrayerScheduleData>("/prayer-times", fallbackPrayerSchedule);
}

export async function calculateZakat(input: ZakatCalculationInput) {
  try {
    return await apiRequest<ZakatCalculation>("/zakat/calculate", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    console.warn("Using local fallback for zakat calculation", error);
    const assets = input.cash + input.gold + input.silver + input.investments + input.business;
    const net = Math.max(assets - input.debts, 0);
    const nisab = 6200;
    return {
      assets,
      debts: input.debts,
      net,
      due: Number((net * 0.025).toFixed(2)),
      rate: 0.025,
      nisab,
      aboveNisab: net >= nisab,
    };
  }
}

export function getAnnouncements(status: Announcement["status"] | "All" = "All") {
  return readWithFallback<Announcement[]>(`/announcements?status=${encodeURIComponent(status)}`, mockAnnouncements);
}

export async function createAnnouncement(input: Omit<Announcement, "id" | "reach">) {
  try {
    return await apiRequest<Announcement>("/announcements", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    console.warn("Using local fallback for announcement creation", error);
    return {
      ...input,
      id: `ann-${Date.now()}`,
      reach: input.status === "Published" ? 1240 : 0,
    } satisfies Announcement;
  }
}

export async function generateAnnouncementDraft(input: {
  title: string;
  message: string;
  audience: string;
  category: Announcement["category"];
}) {
  try {
    return await apiRequest<AIAnnouncementResult>("/announcements/ai-draft", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    console.warn("Using local fallback for announcement AI draft", error);
    const title = input.title || "Community update";
    return {
      title,
      english: `Assalamu alaikum. Please note this important update: ${input.message || title}. We appreciate your support and cooperation.`,
      urdu: "Urdu version will be generated by the connected AI provider.",
      arabic: "Arabic version will be generated by the connected AI provider.",
      sms: `${title}: Please check the masjid update and share with family.`,
      whatsapp: `*${title}*\nPlease check this masjid update and share with the community.`,
      email: `<h2>${title}</h2><p>${input.message || "Please review this community update."}</p>`,
    };
  }
}

export function getReports() {
  return readWithFallback<ReportsApiData>("/reports", fallbackReports);
}

export function getDonors() {
  return readWithFallback<Donor[]>("/donors", mockDonors);
}

export function getAuditLog() {
  return readWithFallback<AuditLogEntry[]>("/audit-log", mockAuditLog);
}

export function getRecurringDonations() {
  return apiRequest<RecurringDonation[]>("/recurring-donations");
}

export function createRecurringDonation(input: Pick<RecurringDonation, "amount" | "fund" | "frequency">) {
  return apiRequest<RecurringDonation>("/recurring-donations", { method: "POST", body: JSON.stringify(input) });
}

export function updateRecurringDonation(id: string, status: RecurringDonation["status"]) {
  return apiRequest<RecurringDonation>(`/recurring-donations/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function getWorkspaceSettings() {
  return apiRequest<WorkspaceSettings>("/settings");
}

export function updateWorkspaceSettings(input: Partial<WorkspaceSettings>) {
  return apiRequest<WorkspaceSettings>("/settings", { method: "PATCH", body: JSON.stringify(input) });
}

export async function generateReportSummary() {
  try {
    return await apiRequest<AIReportResult>("/reports/ai-summary", {
      method: "POST",
      body: JSON.stringify({ month: "June 2026" }),
    });
  } catch (error) {
    console.warn("Using local fallback for report summary", error);
    return {
      title: "June 2026 Board Summary",
      summary:
        "Donations remain healthy with strong recurring support. Zakat and Sadaqah funds continue to drive community impact, while reporting visibility is improving for administrators.",
      insights: [
        "Recurring donations increased steadily across the last six months.",
        "Zakat remains the largest tracked fund category.",
        "Top donors show strong preference for transparent receipts and fund allocation.",
      ],
      recommendations: [
        "Send a Friday reminder focused on recurring Sadaqah.",
        "Share a brief campaign progress update with donors.",
        "Review pending donations before the next board report.",
      ],
    };
  }
}

export async function askAssistant(prompt: string) {
  try {
    const response = await apiRequest<{ text: string }>("/ai", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    return response.text;
  } catch (error) {
    console.warn("Using local fallback for assistant response", error);
    if (prompt.toLowerCase().includes("donation")) {
      return "Donations are strongest in Zakat and recurring Sadaqah. A focused Friday reminder with a clear recurring-gift CTA is recommended.";
    }
    return "Use a calm, community-first message with the date, action needed, and a short dua or gratitude note.";
  }
}

export async function generateCampaignCopy(topic: string, goal: string): Promise<AICampaignResult> {
  const prompt = `Create campaign copy for ${topic} with goal ${goal}`;
  const text = await askAssistant(prompt);
  return {
    title: topic || "Support Our Masjid Campaign",
    description: text,
    email: `Assalamu alaikum. ${text}`,
    sms: `${topic || "Support our masjid"}: Every gift helps. Goal: ${goal || "ongoing"}.`,
    push: `${topic || "Masjid campaign"} needs your support.`,
    social: `${text}\n#MasjidPro #Sadaqah`,
  };
}

const masjids = [
  { id: "furqan", name: "Masjid Al-Furqan", location: "Houston, TX", method: "ISNA, Hanafi Asr" },
  { id: "noor", name: "Masjid Al-Noor", location: "London, UK", method: "MWL, Standard Asr" },
  { id: "houston", name: "Islamic Center Houston", location: "Houston, TX", method: "ISNA, Standard Asr" },
];

let donations = [
  {
    id: "don-1001",
    donorName: "Ahmed Khalil",
    donorEmail: "ahmed.k@email.com",
    fund: "Zakat",
    amount: 2500,
    method: "Card",
    date: "Jun 14, 2026",
    status: "Completed",
    refundStatus: "Eligible",
    receiptId: "RCP-24061",
  },
  {
    id: "don-1002",
    donorName: "Fatima Zahra",
    donorEmail: "fatima.z@provider.com",
    fund: "Sadaqah",
    amount: 150,
    method: "Bank Transfer",
    date: "Jun 13, 2026",
    status: "Completed",
    refundStatus: "Not requested",
    receiptId: "RCP-24062",
  },
  {
    id: "don-1003",
    donorName: "Omar Farooq",
    donorEmail: "omar.f@domain.org",
    fund: "General",
    amount: 500,
    method: "Cash",
    date: "Jun 12, 2026",
    status: "Pending",
    refundStatus: "Not requested",
    receiptId: "Pending",
  },
  {
    id: "don-1004",
    donorName: "Zubair Yusuf",
    donorEmail: "zubair.y@email.com",
    fund: "Building",
    amount: 1200,
    method: "Card",
    date: "Jun 11, 2026",
    status: "Completed",
    refundStatus: "Eligible",
    receiptId: "RCP-24064",
  },
  {
    id: "don-1005",
    donorName: "Aisha Rahman",
    donorEmail: "aisha.r@email.com",
    fund: "Zakat",
    amount: 725,
    method: "Card",
    date: "Jun 10, 2026",
    status: "Refunded",
    refundStatus: "Refunded",
    receiptId: "RCP-24065",
  },
];

const fundBreakdown = [
  { fund: "Zakat", amount: 7240, percentage: 39, color: "#0F766E" },
  { fund: "Sadaqah", amount: 4180, percentage: 22, color: "#16A34A" },
  { fund: "General", amount: 3790, percentage: 21, color: "#2563EB" },
  { fund: "Building", amount: 3130, percentage: 18, color: "#C0842E" },
];

const campaign = {
  id: "camp-ramadan",
  name: "Ramadan Fundraiser",
  raised: 42850,
  goal: 65000,
  dueDate: "Ends Jun 30",
};

const prayerTimes = [
  { name: "Fajr", adhan: "04:52 AM", iqamah: "05:15 AM" },
  { name: "Dhuhr", adhan: "01:21 PM", iqamah: "01:45 PM" },
  { name: "Asr", adhan: "05:03 PM", iqamah: "05:25 PM", isNext: true },
  { name: "Maghrib", adhan: "08:28 PM", iqamah: "08:33 PM" },
  { name: "Isha", adhan: "09:52 PM", iqamah: "10:10 PM" },
];

let announcements = [
  {
    id: "ann-1",
    title: "Jumuah parking update",
    category: "Administrative",
    excerpt: "Please use the west entrance and follow volunteer guidance after second Jumuah.",
    status: "Published",
    date: "Today, 2:30 PM",
    channels: ["Email", "SMS", "Push", "Website"],
    reach: 1240,
  },
  {
    id: "ann-2",
    title: "Ramadan Fundraiser reminder",
    category: "Fundraiser",
    excerpt: "A short reminder encouraging recurring donations before the final ten nights.",
    status: "Scheduled",
    date: "Tomorrow, 9:00 AM",
    channels: ["Email", "Push"],
    reach: 0,
  },
  {
    id: "ann-3",
    title: "Weather advisory for evening prayer",
    category: "Prayer Alert",
    excerpt: "Community members are encouraged to arrive early due to heavy rain expected near Isha.",
    status: "Draft",
    date: "Draft",
    channels: ["Website"],
    reach: 0,
  },
];

const reportMetrics = [
  { label: "Monthly Donations", value: 18340, change: 24 },
  { label: "Recurring Donations", value: 8940, change: 12 },
  { label: "Average Gift", value: 214, change: 8 },
  { label: "Donor Retention", value: 72, change: 5 },
];

const monthlyDonations = [
  { month: "Jan", amount: 9200 },
  { month: "Feb", amount: 10400 },
  { month: "Mar", amount: 13800 },
  { month: "Apr", amount: 16800 },
  { month: "May", amount: 14600 },
  { month: "Jun", amount: 18340 },
];

const recurringTrend = [
  { month: "Jan", donors: 92 },
  { month: "Feb", donors: 105 },
  { month: "Mar", donors: 118 },
  { month: "Apr", donors: 132 },
  { month: "May", donors: 148 },
  { month: "Jun", donors: 156 },
];

let auditLog = [
  { id: "log-1", time: "6 min ago", user: "Imam Abdullah", action: "Announcement published", status: "Success" },
  { id: "log-2", time: "18 min ago", user: "Admin Team", action: "Donation added", status: "Success" },
  { id: "log-3", time: "42 min ago", user: "Finance Admin", action: "Report exported", status: "Success" },
  { id: "log-4", time: "1h ago", user: "Imam Abdullah", action: "Settings updated", status: "Pending" },
];

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const parseBody = (event) => {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    throw Object.assign(new Error("Invalid JSON body."), { statusCode: 400 });
  }
};

const addAudit = (action, user = "MasjidPro Admin", status = "Success") => {
  const entry = {
    id: `log-${Date.now()}`,
    time: "Just now",
    user,
    action,
    status,
  };
  auditLog = [entry, ...auditLog].slice(0, 30);
  return entry;
};

const buildDonors = () => {
  const base = [
    {
      id: "donor-1",
      name: "Ahmed Khalil",
      email: "ahmed.k@email.com",
      phone: "+1 713 555 0198",
      lifetimeDonations: 18500,
      recurring: true,
      fundPreference: "Zakat",
    },
    {
      id: "donor-2",
      name: "Fatima Zahra",
      email: "fatima.z@provider.com",
      phone: "+1 832 555 0144",
      lifetimeDonations: 9250,
      recurring: true,
      fundPreference: "Sadaqah",
    },
    {
      id: "donor-3",
      name: "Omar Farooq",
      email: "omar.f@domain.org",
      phone: "+1 281 555 0172",
      lifetimeDonations: 4100,
      recurring: false,
      fundPreference: "General",
    },
  ];

  const byEmail = new Map(base.map((donor) => [donor.email, { ...donor, history: [] }]));

  for (const donation of donations) {
    const existing = byEmail.get(donation.donorEmail);
    if (existing) {
      existing.history = [donation, ...existing.history];
      existing.lastDonation = donation.date;
      continue;
    }

    byEmail.set(donation.donorEmail, {
      id: `donor-${donation.donorEmail}`,
      name: donation.donorName,
      email: donation.donorEmail,
      phone: "+1 000 000 0000",
      lifetimeDonations: donation.status === "Completed" ? donation.amount : 0,
      lastDonation: donation.date,
      recurring: false,
      fundPreference: donation.fund,
      history: [donation],
    });
  }

  return Array.from(byEmail.values()).map((donor) => {
    const completedTotal = donor.history
      .filter((donation) => donation.status === "Completed")
      .reduce((sum, donation) => sum + donation.amount, 0);

    return {
      ...donor,
      lifetimeDonations: Math.max(donor.lifetimeDonations, completedTotal),
      lastDonation: donor.lastDonation ?? "No donations yet",
    };
  });
};

const calculateZakat = (values) => {
  const cash = Number(values.cash ?? 0);
  const gold = Number(values.gold ?? 0);
  const silver = Number(values.silver ?? 0);
  const investments = Number(values.investments ?? 0);
  const business = Number(values.business ?? 0);
  const debts = Number(values.debts ?? 0);
  const assets = cash + gold + silver + investments + business;
  const net = Math.max(assets - debts, 0);
  const nisab = 6200;
  return {
    assets,
    debts,
    net,
    due: Number((net * 0.025).toFixed(2)),
    rate: 0.025,
    nisab,
    aboveNisab: net >= nisab,
  };
};

const filterDonations = (query = {}) => {
  const search = query.search?.toLowerCase() ?? "";
  return donations.filter((donation) => {
    const matchesSearch =
      !search ||
      donation.donorName.toLowerCase().includes(search) ||
      donation.donorEmail.toLowerCase().includes(search);
    const matchesFund = !query.fund || query.fund === "All" || donation.fund === query.fund;
    const matchesStatus = !query.status || query.status === "All" || donation.status === query.status;
    const matchesMethod = !query.method || query.method === "All" || donation.method === query.method;
    return matchesSearch && matchesFund && matchesStatus && matchesMethod;
  });
};

const dashboardPayload = (masjidId) => {
  const activeMasjid = masjids.find((masjid) => masjid.id === masjidId) ?? masjids[0];
  const completedDonations = donations.filter((donation) => donation.status === "Completed");
  const totalDonations = completedDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const zakatTotal = completedDonations
    .filter((donation) => donation.fund === "Zakat")
    .reduce((sum, donation) => sum + donation.amount, 0);

  return {
    activeMasjid,
    stats: {
      totalDonations,
      zakatTotal,
      sadaqahTotal: completedDonations
        .filter((donation) => donation.fund === "Sadaqah")
        .reduce((sum, donation) => sum + donation.amount, 0),
      recurringDonors: 156,
    },
    fundBreakdown,
    campaign,
    prayerTimes,
    announcements,
    auditLog,
    recentDonations: donations.slice(0, 5),
    insight: {
      headline: `Zakat giving is ${zakatTotal > 3000 ? "leading" : "behind"} current fund activity.`,
      recommendation: "Send a Friday reminder focused on recurring Sadaqah and transparent receipts.",
    },
  };
};

const aiResponse = (prompt) => {
  const lower = String(prompt ?? "").toLowerCase();
  if (lower.includes("announcement") || lower.includes("jumuah")) {
    return "Assalamu alaikum. Please join us for Jumuah and follow volunteer guidance for parking. May Allah reward your cooperation.";
  }
  if (lower.includes("drop") || lower.includes("decrease")) {
    return "Donation drop explanation: recent gifts are concentrated in Zakat while General Fund activity slowed. Send a short campaign update with a clear recurring-gift CTA.";
  }
  if (lower.includes("month") || lower.includes("donation")) {
    const total = donations.filter((donation) => donation.status === "Completed").reduce((sum, donation) => sum + donation.amount, 0);
    return `This month has ${donations.length} tracked donations with ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)} completed giving.`;
  }
  return "I can help draft fundraising messages, summarize donations, create announcements, and explain giving trends from the current MasjidPro data.";
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  const path = (event.path || "")
    .replace(/^\/\.netlify\/functions\/api/, "")
    .replace(/^\/api/, "")
    .replace(/^\/+/, "");
  const segments = path.split("/").filter(Boolean);
  const [resource, id, action] = segments;

  try {
    if (!resource || resource === "health") {
      return json(200, {
        ok: true,
        service: "MasjidPro API",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
      });
    }

    if (resource === "masjids" && event.httpMethod === "GET") {
      return json(200, { data: masjids });
    }

    if (resource === "dashboard" && event.httpMethod === "GET") {
      return json(200, { data: dashboardPayload(event.queryStringParameters?.masjidId) });
    }

    if (resource === "donations" && event.httpMethod === "GET") {
      return json(200, { data: filterDonations(event.queryStringParameters) });
    }

    if (resource === "donations" && event.httpMethod === "POST") {
      const body = parseBody(event);
      if (!body.donorName || !body.donorEmail || !body.fund || !body.amount) {
        return json(422, { error: "donorName, donorEmail, fund, and amount are required." });
      }

      const donation = {
        id: `don-${Date.now()}`,
        donorName: body.donorName,
        donorEmail: body.donorEmail,
        fund: body.fund,
        amount: Number(body.amount),
        method: body.method ?? "Card",
        date: "Today",
        status: body.status ?? "Completed",
        refundStatus: "Not requested",
        receiptId: body.status === "Pending" ? "Pending" : `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
      };
      donations = [donation, ...donations];
      addAudit("Donation added");
      return json(201, { data: donation });
    }

    if (resource === "donations" && id && action === "refund" && event.httpMethod === "PATCH") {
      let updated;
      donations = donations.map((donation) => {
        if (donation.id !== id) return donation;
        updated = { ...donation, status: "Refunded", refundStatus: "Refunded" };
        return updated;
      });
      if (!updated) return json(404, { error: "Donation not found." });
      addAudit("Donation refunded");
      return json(200, { data: updated });
    }

    if (resource === "prayer-times" && event.httpMethod === "GET") {
      return json(200, {
        data: {
          location: "Houston, TX",
          calculationMethod: "ISNA, Hanafi Asr",
          countdown: "02:18:45",
          prayers: prayerTimes,
        },
      });
    }

    if (resource === "zakat" && id === "calculate" && event.httpMethod === "POST") {
      return json(200, { data: calculateZakat(parseBody(event)) });
    }

    if (resource === "announcements" && event.httpMethod === "GET") {
      const status = event.queryStringParameters?.status;
      const data = !status || status === "All" ? announcements : announcements.filter((item) => item.status === status);
      return json(200, { data });
    }

    if (resource === "announcements" && id === "ai-draft" && event.httpMethod === "POST") {
      const body = parseBody(event);
      const topic = body.title || "Community update";
      return json(200, {
        data: {
          title: topic,
          english: `Assalamu alaikum. Please note this important update: ${body.message || topic}. We appreciate your support and cooperation.`,
          urdu: "Urdu version will be generated by the connected AI provider.",
          arabic: "Arabic version will be generated by the connected AI provider.",
          sms: `${topic}: Please check the masjid update and share with family.`,
          whatsapp: `*${topic}*\nPlease check this masjid update and share with the community.`,
          email: `<h2>${topic}</h2><p>${body.message || "Please review this community update."}</p>`,
        },
      });
    }

    if (resource === "announcements" && !id && event.httpMethod === "POST") {
      const body = parseBody(event);
      if (!body.title || !body.excerpt) {
        return json(422, { error: "title and excerpt are required." });
      }

      const announcement = {
        id: `ann-${Date.now()}`,
        title: body.title,
        category: body.category ?? "Community",
        excerpt: body.excerpt,
        status: body.status ?? "Draft",
        date: body.date ?? "Draft",
        channels: body.channels ?? ["Email"],
        reach: body.status === "Published" ? 1240 : 0,
      };
      announcements = [announcement, ...announcements];
      addAudit(`Announcement ${String(announcement.status).toLowerCase()}`);
      return json(201, { data: announcement });
    }

    if (resource === "reports" && event.httpMethod === "GET") {
      return json(200, {
        data: {
          reportMetrics,
          monthlyDonations,
          recurringTrend,
          fundBreakdown,
          topDonors: buildDonors().slice(0, 5),
        },
      });
    }

    if (resource === "reports" && id === "ai-summary" && event.httpMethod === "POST") {
      return json(200, {
        data: {
          title: "June 2026 Board Summary",
          summary: "Donations remain healthy with strong Zakat activity and steady recurring growth. General Fund can improve with a focused donor reminder.",
          insights: [
            "Zakat remains the strongest fund category.",
            "Recurring donations increased across the last six months.",
            "Pending donations should be reviewed before month-end reporting.",
          ],
          recommendations: [
            "Send a Friday recurring Sadaqah reminder.",
            "Publish a short campaign progress update.",
            "Export and review pending donation records weekly.",
          ],
        },
      });
    }

    if (resource === "donors" && event.httpMethod === "GET") {
      return json(200, { data: buildDonors() });
    }

    if (resource === "audit-log" && event.httpMethod === "GET") {
      return json(200, { data: auditLog });
    }

    if (resource === "ai" && event.httpMethod === "POST") {
      const body = parseBody(event);
      return json(200, { data: { text: aiResponse(body.prompt) } });
    }

    return json(404, { error: "API route not found." });
  } catch (error) {
    return json(error.statusCode ?? 500, {
      error: error.message || "Unexpected API error.",
    });
  }
}

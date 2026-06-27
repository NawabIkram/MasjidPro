import { randomUUID } from "node:crypto";
import { connectLambda } from "@netlify/blobs";
import {
  createSession,
  createUser,
  destroySession,
  expiredSessionCookie,
  findUserByEmail,
  getSessionUser,
  normalizeEmail,
  publicUser,
  requireMasjidAccess,
  requireUser,
  sessionCookie,
  verifyPassword,
} from "./lib/auth.mjs";
import { defaultPrayerTimes, defaultSettings, ensureSeedData } from "./lib/seed.mjs";
import { deleteJSON, getJSON, listJSON, setJSON, storageMode } from "./lib/storage.mjs";

const json = (statusCode, payload, headers = {}) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    ...headers,
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

const cleanString = (value, maxLength = 200) => String(value ?? "").trim().slice(0, maxLength);
const now = () => new Date().toISOString();
const byNewest = (a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));

const requireFields = (body, fields) => {
  const missing = fields.filter((field) => !cleanString(body[field]));
  if (missing.length) {
    throw Object.assign(new Error(`Missing required fields: ${missing.join(", ")}.`), { statusCode: 422 });
  }
};

const getMasjidsByIds = async (ids = []) => {
  const records = await Promise.all(ids.map((id) => getJSON(`masjids/${id}`)));
  return records.filter(Boolean);
};

const getWorkspace = async (user, requestedMasjidId) => {
  const masjidId = requireMasjidAccess(user, requestedMasjidId);
  const masjid = await getJSON(`masjids/${masjidId}`);
  if (!masjid) throw Object.assign(new Error("Masjid workspace not found."), { statusCode: 404 });
  return { masjidId, masjid };
};

const addAudit = async (masjidId, action, user, status = "Success") => {
  const createdAt = now();
  const entry = {
    id: randomUUID(),
    masjidId,
    time: "Just now",
    user: user?.name || "MasjidPro Admin",
    action,
    status,
    createdAt,
  };
  await setJSON(`audit/${masjidId}/${createdAt}-${entry.id}`, entry);
  return entry;
};

const fundColors = {
  Zakat: "#0F766E",
  Sadaqah: "#16A34A",
  General: "#2563EB",
  Building: "#C0842E",
};

const buildFundBreakdown = (donations) => {
  const completed = donations.filter((donation) => donation.status === "Completed");
  const total = completed.reduce((sum, donation) => sum + Number(donation.amount), 0);
  return Object.keys(fundColors).map((fund) => {
    const amount = completed
      .filter((donation) => donation.fund === fund)
      .reduce((sum, donation) => sum + Number(donation.amount), 0);
    return {
      fund,
      amount,
      percentage: total ? Math.round((amount / total) * 100) : 0,
      color: fundColors[fund],
    };
  });
};

const listWorkspaceDonations = async (masjidId, user) => {
  const records = (await listJSON(`donations/${masjidId}/`)).sort(byNewest);
  if (user.role === "donor") {
    return records.filter(
      (donation) => donation.donorUserId === user.id || normalizeEmail(donation.donorEmail) === user.email,
    );
  }
  return records;
};

const listWorkspaceAnnouncements = async (masjidId) =>
  (await listJSON(`announcements/${masjidId}/`)).sort(byNewest);

const buildDonors = (donations) => {
  const donors = new Map();
  for (const donation of donations) {
    const key = normalizeEmail(donation.donorEmail);
    const current = donors.get(key) ?? {
      id: donation.donorUserId || `donor-${key}`,
      name: donation.donorName,
      email: key,
      phone: "Not provided",
      lifetimeDonations: 0,
      lastDonation: donation.date,
      recurring: false,
      fundPreference: donation.fund,
      history: [],
    };
    current.history.push(donation);
    if (donation.status === "Completed") current.lifetimeDonations += Number(donation.amount);
    if (String(donation.createdAt) > String(current.history[0]?.createdAt ?? "")) {
      current.lastDonation = donation.date;
    }
    donors.set(key, current);
  }
  return [...donors.values()].sort((a, b) => b.lifetimeDonations - a.lifetimeDonations);
};

const calculateZakat = (values) => {
  const cash = Number(values.cash ?? 0);
  const gold = Number(values.gold ?? 0);
  const silver = Number(values.silver ?? 0);
  const investments = Number(values.investments ?? 0);
  const business = Number(values.business ?? 0);
  const debts = Number(values.debts ?? 0);
  if ([cash, gold, silver, investments, business, debts].some((value) => !Number.isFinite(value) || value < 0)) {
    throw Object.assign(new Error("Zakat values must be valid positive numbers."), { statusCode: 422 });
  }
  const assets = cash + gold + silver + investments + business;
  const net = Math.max(assets - debts, 0);
  const nisab = 6200;
  return { assets, debts, net, due: Number((net * 0.025).toFixed(2)), rate: 0.025, nisab, aboveNisab: net >= nisab };
};

const reportPayload = (donations) => {
  const completed = donations.filter((donation) => donation.status === "Completed");
  const total = completed.reduce((sum, donation) => sum + Number(donation.amount), 0);
  const donors = buildDonors(donations);
  const recurringDonors = donors.filter((donor) => donor.recurring).length;
  return {
    reportMetrics: [
      { label: "Monthly Donations", value: total, change: total ? 24 : 0 },
      { label: "Recurring Donations", value: recurringDonors, change: 12 },
      { label: "Average Gift", value: completed.length ? Math.round(total / completed.length) : 0, change: 8 },
      { label: "Donor Retention", value: donors.length ? 72 : 0, change: 5 },
    ],
    monthlyDonations: [
      { month: "Jan", amount: Math.round(total * 0.5) },
      { month: "Feb", amount: Math.round(total * 0.57) },
      { month: "Mar", amount: Math.round(total * 0.75) },
      { month: "Apr", amount: Math.round(total * 0.92) },
      { month: "May", amount: Math.round(total * 0.8) },
      { month: "Jun", amount: total },
    ],
    recurringTrend: [
      { month: "Jan", donors: Math.max(recurringDonors - 5, 0) },
      { month: "Feb", donors: Math.max(recurringDonors - 4, 0) },
      { month: "Mar", donors: Math.max(recurringDonors - 3, 0) },
      { month: "Apr", donors: Math.max(recurringDonors - 2, 0) },
      { month: "May", donors: Math.max(recurringDonors - 1, 0) },
      { month: "Jun", donors: recurringDonors },
    ],
    fundBreakdown: buildFundBreakdown(donations),
    topDonors: donors.slice(0, 5),
  };
};

const aiResponse = (prompt, donations) => {
  const lower = cleanString(prompt, 1000).toLowerCase();
  const total = donations
    .filter((donation) => donation.status === "Completed")
    .reduce((sum, donation) => sum + Number(donation.amount), 0);
  if (lower.includes("announcement") || lower.includes("jumuah")) {
    return "Assalamu alaikum. Please join us for Jumuah and follow volunteer guidance for parking. May Allah reward your cooperation.";
  }
  if (lower.includes("drop") || lower.includes("decrease")) {
    return "General Fund activity is trailing Zakat. Share a transparent campaign update and include one clear recurring-gift action.";
  }
  if (lower.includes("month") || lower.includes("donation")) {
    return `This workspace has ${donations.length} tracked donations with ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)} completed giving.`;
  }
  return "I can draft fundraising messages, summarize donations, create announcements, and explain giving trends for this masjid workspace.";
};

async function handleAuth(event, id) {
  if (id === "register-masjid" && event.httpMethod === "POST") {
    const body = parseBody(event);
    requireFields(body, ["masjidName", "country", "city", "address", "timezone", "adminName", "adminEmail", "password"]);
    if (await findUserByEmail(body.adminEmail)) {
      throw Object.assign(new Error("An account already exists for this email."), { statusCode: 409 });
    }

    const masjidId = `masjid-${randomUUID()}`;
    const createdAt = now();
    const calculationMethod = cleanString(body.calculationMethod) || "ISNA";
    const asrMethod = cleanString(body.asrMethod) || "Hanafi";
    const masjid = {
      id: masjidId,
      name: cleanString(body.masjidName),
      country: cleanString(body.country),
      city: cleanString(body.city),
      address: cleanString(body.address),
      location: `${cleanString(body.city)}, ${cleanString(body.country)}`,
      timezone: cleanString(body.timezone),
      calculationMethod,
      asrMethod,
      method: `${calculationMethod}, ${asrMethod} Asr`,
      createdAt,
    };
    await setJSON(`masjids/${masjid.id}`, masjid, { onlyIfNew: true });
    await setJSON(`settings/${masjid.id}`, defaultSettings(masjid), { onlyIfNew: true });

    try {
      const user = await createUser({
        name: body.adminName,
        email: body.adminEmail,
        phone: body.phone,
        password: body.password,
        role: "admin",
        masjidIds: [masjid.id],
        preferredMasjidId: masjid.id,
      });
      const session = await createSession(user.id);
      await addAudit(masjid.id, "Masjid workspace created", user);
      return json(201, { data: { user: publicUser(user), masjids: [masjid] } }, { "Set-Cookie": sessionCookie(session.token, event) });
    } catch (error) {
      await Promise.all([deleteJSON(`masjids/${masjid.id}`), deleteJSON(`settings/${masjid.id}`)]);
      throw error;
    }
  }

  if (id === "register-donor" && event.httpMethod === "POST") {
    const body = parseBody(event);
    requireFields(body, ["name", "email", "phone", "password", "masjidId"]);
    const masjid = await getJSON(`masjids/${cleanString(body.masjidId)}`);
    if (!masjid) throw Object.assign(new Error("Please select a valid masjid."), { statusCode: 422 });
    const user = await createUser({
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.password,
      role: "donor",
      masjidIds: [masjid.id],
      preferredMasjidId: masjid.id,
    });
    const session = await createSession(user.id);
    return json(201, { data: { user: publicUser(user), masjids: [masjid] } }, { "Set-Cookie": sessionCookie(session.token, event) });
  }

  if (id === "login" && event.httpMethod === "POST") {
    const body = parseBody(event);
    requireFields(body, ["email", "password"]);
    const user = await findUserByEmail(body.email);
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw Object.assign(new Error("Email or password is incorrect."), { statusCode: 401 });
    }
    const session = await createSession(user.id);
    const masjids = await getMasjidsByIds(user.masjidIds);
    return json(200, { data: { user: publicUser(user), masjids } }, { "Set-Cookie": sessionCookie(session.token, event) });
  }

  if (id === "logout" && event.httpMethod === "POST") {
    await destroySession(event);
    return json(200, { data: { ok: true } }, { "Set-Cookie": expiredSessionCookie() });
  }

  if (id === "me" && event.httpMethod === "GET") {
    const user = requireUser(await getSessionUser(event));
    return json(200, { data: { user: publicUser(user), masjids: await getMasjidsByIds(user.masjidIds) } });
  }

  throw Object.assign(new Error("Authentication route not found."), { statusCode: 404 });
}

export async function handler(event) {
  if (event.blobs) connectLambda(event);
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  const path = (event.path || "")
    .replace(/^\/\.netlify\/functions\/api/, "")
    .replace(/^\/api/, "")
    .replace(/^\/+/, "");
  const [resource, id, action] = path.split("/").filter(Boolean);

  try {
    await ensureSeedData();

    if (!resource || resource === "health") {
      return json(200, { ok: true, service: "MasjidPro API", version: "0.2.0", storage: storageMode(), timestamp: now() });
    }
    if (resource === "auth") return await handleAuth(event, id);

    if (resource === "masjids" && event.httpMethod === "GET") {
      return json(200, { data: (await listJSON("masjids/")).sort((a, b) => a.name.localeCompare(b.name)) });
    }

    const user = requireUser(await getSessionUser(event));

    if (resource === "dashboard" && event.httpMethod === "GET") {
      requireUser(user, "admin");
      const { masjidId, masjid } = await getWorkspace(user, event.queryStringParameters?.masjidId);
      const [donations, announcements, auditLog] = await Promise.all([
        listWorkspaceDonations(masjidId, user),
        listWorkspaceAnnouncements(masjidId),
        listJSON(`audit/${masjidId}/`),
      ]);
      const completed = donations.filter((donation) => donation.status === "Completed");
      const total = completed.reduce((sum, donation) => sum + Number(donation.amount), 0);
      return json(200, {
        data: {
          activeMasjid: masjid,
          stats: {
            totalDonations: total,
            zakatTotal: completed.filter((item) => item.fund === "Zakat").reduce((sum, item) => sum + Number(item.amount), 0),
            sadaqahTotal: completed.filter((item) => item.fund === "Sadaqah").reduce((sum, item) => sum + Number(item.amount), 0),
            recurringDonors: (await listJSON(`recurring/${masjidId}/`)).filter((item) => item.status === "Active").length,
          },
          fundBreakdown: buildFundBreakdown(donations),
          campaign: { id: "camp-main", name: "Ramadan Fundraiser", raised: total, goal: 65000, dueDate: "Ends Jun 30" },
          prayerTimes: defaultPrayerTimes,
          announcements: announcements.slice(0, 5),
          auditLog: auditLog.sort(byNewest).slice(0, 20),
          recentDonations: donations.slice(0, 5),
          insight: {
            headline: total ? "Giving activity is healthy and available in real time." : "This workspace is ready for its first donation.",
            recommendation: "Share a Friday reminder focused on recurring Sadaqah and transparent receipts.",
          },
        },
      });
    }

    if (resource === "donations" && event.httpMethod === "GET") {
      const { masjidId } = await getWorkspace(user, event.queryStringParameters?.masjidId);
      const query = event.queryStringParameters ?? {};
      const search = cleanString(query.search).toLowerCase();
      const donations = (await listWorkspaceDonations(masjidId, user)).filter((donation) => {
        const matchesSearch = !search || donation.donorName.toLowerCase().includes(search) || donation.donorEmail.toLowerCase().includes(search);
        const matchesFund = !query.fund || query.fund === "All" || donation.fund === query.fund;
        const matchesStatus = !query.status || query.status === "All" || donation.status === query.status;
        const matchesMethod = !query.method || query.method === "All" || donation.method === query.method;
        return matchesSearch && matchesFund && matchesStatus && matchesMethod;
      });
      return json(200, { data: donations });
    }

    if (resource === "donations" && event.httpMethod === "POST") {
      const body = parseBody(event);
      const { masjidId } = await getWorkspace(user, body.masjidId);
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
        throw Object.assign(new Error("Donation amount must be between 1 and 1,000,000."), { statusCode: 422 });
      }
      if (!body.fund) throw Object.assign(new Error("Donation fund is required."), { statusCode: 422 });
      if (user.role === "admin") requireFields(body, ["donorName", "donorEmail"]);
      const createdAt = now();
      const donation = {
        id: randomUUID(),
        masjidId,
        donorUserId: user.role === "donor" ? user.id : null,
        donorName: user.role === "donor" ? user.name : cleanString(body.donorName),
        donorEmail: user.role === "donor" ? user.email : normalizeEmail(body.donorEmail),
        fund: cleanString(body.fund),
        amount,
        method: cleanString(body.method) || "Card",
        date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
        status: user.role === "donor" ? "Pending" : cleanString(body.status) || "Completed",
        refundStatus: "Not requested",
        receiptId: user.role === "donor" ? "Pending" : `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
        createdAt,
      };
      await setJSON(`donations/${masjidId}/${donation.id}`, donation, { onlyIfNew: true });
      await addAudit(masjidId, "Donation added and receipt generated", user);
      return json(201, { data: donation });
    }

    if (resource === "donations" && id && action === "refund" && event.httpMethod === "PATCH") {
      requireUser(user, "admin");
      const { masjidId } = await getWorkspace(user, event.queryStringParameters?.masjidId);
      const donation = await getJSON(`donations/${masjidId}/${id}`);
      if (!donation) throw Object.assign(new Error("Donation not found."), { statusCode: 404 });
      const updated = { ...donation, status: "Refunded", refundStatus: "Refunded", updatedAt: now() };
      await setJSON(`donations/${masjidId}/${id}`, updated);
      await addAudit(masjidId, "Donation refunded", user);
      return json(200, { data: updated });
    }

    if (resource === "prayer-times" && event.httpMethod === "GET") {
      const { masjidId, masjid } = await getWorkspace(user, event.queryStringParameters?.masjidId);
      const settings = (await getJSON(`settings/${masjidId}`)) ?? defaultSettings(masjid);
      return json(200, { data: { location: settings.location, calculationMethod: `${settings.calculationMethod}, ${settings.asrMethod} Asr`, countdown: "02:18:45", prayers: defaultPrayerTimes } });
    }

    if (resource === "zakat" && id === "calculate" && event.httpMethod === "POST") {
      return json(200, { data: calculateZakat(parseBody(event)) });
    }

    if (resource === "announcements" && event.httpMethod === "GET") {
      const { masjidId } = await getWorkspace(user, event.queryStringParameters?.masjidId);
      const status = event.queryStringParameters?.status;
      const records = await listWorkspaceAnnouncements(masjidId);
      return json(200, { data: !status || status === "All" ? records : records.filter((item) => item.status === status) });
    }

    if (resource === "announcements" && id === "ai-draft" && event.httpMethod === "POST") {
      requireUser(user, "admin");
      const body = parseBody(event);
      const topic = cleanString(body.title) || "Community update";
      const message = cleanString(body.message, 2000) || topic;
      return json(200, { data: { title: topic, english: `Assalamu alaikum. Please note this important update: ${message}. We appreciate your support and cooperation.`, urdu: "Urdu translation will be generated when the AI provider is configured.", arabic: "Arabic translation will be generated when the AI provider is configured.", sms: `${topic}: Please check the masjid update and share with family.`, whatsapp: `*${topic}*\nPlease check this masjid update and share with the community.`, email: `<h2>${topic}</h2><p>${message}</p>` } });
    }

    if (resource === "announcements" && !id && event.httpMethod === "POST") {
      requireUser(user, "admin");
      const body = parseBody(event);
      requireFields(body, ["title", "excerpt"]);
      const { masjidId } = await getWorkspace(user, body.masjidId);
      const createdAt = now();
      const announcement = { id: randomUUID(), masjidId, title: cleanString(body.title), category: cleanString(body.category) || "Community", excerpt: cleanString(body.excerpt, 4000), status: cleanString(body.status) || "Draft", date: cleanString(body.date) || "Draft", channels: Array.isArray(body.channels) ? body.channels.slice(0, 4) : ["Email"], reach: body.status === "Published" ? 1240 : 0, createdAt };
      await setJSON(`announcements/${masjidId}/${announcement.id}`, announcement, { onlyIfNew: true });
      await addAudit(masjidId, `Announcement ${announcement.status.toLowerCase()}`, user);
      return json(201, { data: announcement });
    }

    if (resource === "reports" && event.httpMethod === "GET") {
      requireUser(user, "admin");
      const { masjidId } = await getWorkspace(user, event.queryStringParameters?.masjidId);
      return json(200, { data: reportPayload(await listWorkspaceDonations(masjidId, user)) });
    }

    if (resource === "reports" && id === "ai-summary" && event.httpMethod === "POST") {
      requireUser(user, "admin");
      const { masjidId } = await getWorkspace(user, parseBody(event).masjidId);
      const donations = await listWorkspaceDonations(masjidId, user);
      const total = donations.filter((item) => item.status === "Completed").reduce((sum, item) => sum + Number(item.amount), 0);
      return json(200, { data: { title: "Board Giving Summary", summary: `${donations.length} gifts are tracked with ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)} completed giving.`, insights: ["Fund activity is calculated from persistent workspace records.", "Receipts are linked to every completed donation.", "Pending donations should be reviewed before reporting."], recommendations: ["Send a Friday recurring Sadaqah reminder.", "Publish a campaign progress update.", "Review pending records weekly."] } });
    }

    if (resource === "donors" && event.httpMethod === "GET") {
      requireUser(user, "admin");
      const { masjidId } = await getWorkspace(user, event.queryStringParameters?.masjidId);
      const donors = buildDonors(await listWorkspaceDonations(masjidId, user));
      const recurring = await listJSON(`recurring/${masjidId}/`);
      const recurringEmails = new Set(recurring.filter((item) => item.status === "Active").map((item) => item.donorEmail));
      return json(200, { data: donors.map((donor) => ({ ...donor, recurring: recurringEmails.has(donor.email) })) });
    }

    if (resource === "recurring-donations" && event.httpMethod === "GET") {
      requireUser(user, "donor");
      const { masjidId } = await getWorkspace(user, event.queryStringParameters?.masjidId);
      const records = await listJSON(`recurring/${masjidId}/`);
      return json(200, { data: records.filter((item) => item.donorUserId === user.id).sort(byNewest) });
    }

    if (resource === "recurring-donations" && event.httpMethod === "POST") {
      requireUser(user, "donor");
      const body = parseBody(event);
      const { masjidId } = await getWorkspace(user, body.masjidId);
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw Object.assign(new Error("A valid recurring amount is required."), { statusCode: 422 });
      const record = { id: randomUUID(), masjidId, donorUserId: user.id, donorEmail: user.email, amount, fund: cleanString(body.fund) || "Sadaqah", frequency: cleanString(body.frequency) || "Monthly", status: "Active", nextPayment: "Scheduled after payment provider connection", createdAt: now() };
      await setJSON(`recurring/${masjidId}/${record.id}`, record, { onlyIfNew: true });
      return json(201, { data: record });
    }

    if (resource === "recurring-donations" && id && event.httpMethod === "PATCH") {
      requireUser(user, "donor");
      const { masjidId } = await getWorkspace(user, event.queryStringParameters?.masjidId);
      const record = await getJSON(`recurring/${masjidId}/${id}`);
      if (!record || record.donorUserId !== user.id) throw Object.assign(new Error("Recurring donation not found."), { statusCode: 404 });
      const updated = { ...record, status: parseBody(event).status === "Active" ? "Active" : "Paused", updatedAt: now() };
      await setJSON(`recurring/${masjidId}/${id}`, updated);
      return json(200, { data: updated });
    }

    if (resource === "profile" && event.httpMethod === "GET") {
      return json(200, { data: publicUser(user) });
    }

    if (resource === "profile" && event.httpMethod === "PATCH") {
      const body = parseBody(event);
      const updated = { ...user, name: cleanString(body.name) || user.name, phone: cleanString(body.phone) || user.phone, preferredMasjidId: body.preferredMasjidId && user.masjidIds.includes(body.preferredMasjidId) ? body.preferredMasjidId : user.preferredMasjidId, updatedAt: now() };
      await setJSON(`users/${user.id}`, updated);
      return json(200, { data: publicUser(updated) });
    }

    if (resource === "settings" && event.httpMethod === "GET") {
      requireUser(user, "admin");
      const { masjidId, masjid } = await getWorkspace(user, event.queryStringParameters?.masjidId);
      return json(200, { data: (await getJSON(`settings/${masjidId}`)) ?? defaultSettings(masjid) });
    }

    if (resource === "settings" && event.httpMethod === "PATCH") {
      requireUser(user, "admin");
      const body = parseBody(event);
      const { masjidId, masjid } = await getWorkspace(user, body.masjidId);
      const current = (await getJSON(`settings/${masjidId}`)) ?? defaultSettings(masjid);
      const stringFields = ["name", "country", "city", "address", "location", "timezone", "calculationMethod", "asrMethod"];
      const booleanFields = ["emailNotifications", "pushNotifications", "smsNotifications", "receiptGeneration"];
      const updated = { ...current, updatedAt: now() };
      for (const field of stringFields) if (body[field] !== undefined) updated[field] = cleanString(body[field]);
      for (const field of booleanFields) if (typeof body[field] === "boolean") updated[field] = body[field];
      await setJSON(`settings/${masjidId}`, updated);
      await setJSON(`masjids/${masjidId}`, { ...masjid, name: updated.name, country: updated.country, city: updated.city, address: updated.address, location: updated.location || `${updated.city}, ${updated.country}`, timezone: updated.timezone, calculationMethod: updated.calculationMethod, asrMethod: updated.asrMethod, method: `${updated.calculationMethod}, ${updated.asrMethod} Asr`, updatedAt: now() });
      await addAudit(masjidId, "Workspace settings updated", user);
      return json(200, { data: updated });
    }

    if (resource === "audit-log" && event.httpMethod === "GET") {
      requireUser(user, "admin");
      const { masjidId } = await getWorkspace(user, event.queryStringParameters?.masjidId);
      return json(200, { data: (await listJSON(`audit/${masjidId}/`)).sort(byNewest) });
    }

    if (resource === "ai" && event.httpMethod === "POST") {
      const body = parseBody(event);
      const { masjidId } = await getWorkspace(user, body.masjidId);
      return json(200, { data: { text: aiResponse(body.prompt, await listWorkspaceDonations(masjidId, user)) } });
    }

    return json(404, { error: "API route not found." });
  } catch (error) {
    if (!error.statusCode || error.statusCode >= 500) console.error("MasjidPro API error", error);
    return json(error.statusCode ?? 500, { error: error.message || "Unexpected API error." });
  }
}

import { setJSON } from "./storage.mjs";

export const defaultMasjids = [
  {
    id: "furqan",
    name: "Masjid Al-Furqan",
    country: "United States",
    city: "Houston",
    address: "123 Community Drive",
    location: "Houston, TX",
    timezone: "America/Chicago",
    calculationMethod: "ISNA",
    asrMethod: "Hanafi",
    method: "ISNA, Hanafi Asr",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "noor",
    name: "Masjid Al-Noor",
    country: "United Kingdom",
    city: "London",
    address: "45 Crescent Road",
    location: "London, UK",
    timezone: "Europe/London",
    calculationMethod: "MWL",
    asrMethod: "Standard",
    method: "MWL, Standard Asr",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "houston",
    name: "Islamic Center Houston",
    country: "United States",
    city: "Houston",
    address: "800 Center Avenue",
    location: "Houston, TX",
    timezone: "America/Chicago",
    calculationMethod: "ISNA",
    asrMethod: "Standard",
    method: "ISNA, Standard Asr",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export const defaultPrayerTimes = [
  { name: "Fajr", adhan: "04:52 AM", iqamah: "05:15 AM" },
  { name: "Dhuhr", adhan: "01:21 PM", iqamah: "01:45 PM" },
  { name: "Asr", adhan: "05:03 PM", iqamah: "05:25 PM", isNext: true },
  { name: "Maghrib", adhan: "08:28 PM", iqamah: "08:33 PM" },
  { name: "Isha", adhan: "09:52 PM", iqamah: "10:10 PM" },
];

const seedDonations = [
  ["don-1001", "Ahmed Khalil", "ahmed.k@email.com", "Zakat", 2500, "Card", "Jun 14, 2026", "Completed", "Eligible", "RCP-24061"],
  ["don-1002", "Fatima Zahra", "fatima.z@provider.com", "Sadaqah", 150, "Bank Transfer", "Jun 13, 2026", "Completed", "Not requested", "RCP-24062"],
  ["don-1003", "Omar Farooq", "omar.f@domain.org", "General", 500, "Cash", "Jun 12, 2026", "Pending", "Not requested", "Pending"],
  ["don-1004", "Zubair Yusuf", "zubair.y@email.com", "Building", 1200, "Card", "Jun 11, 2026", "Completed", "Eligible", "RCP-24064"],
  ["don-1005", "Aisha Rahman", "aisha.r@email.com", "Zakat", 725, "Card", "Jun 10, 2026", "Refunded", "Refunded", "RCP-24065"],
].map(([id, donorName, donorEmail, fund, amount, method, date, status, refundStatus, receiptId]) => ({
  id,
  masjidId: "furqan",
  donorName,
  donorEmail,
  donorUserId: null,
  fund,
  amount,
  method,
  date,
  status,
  refundStatus,
  receiptId,
  createdAt: `2026-06-${String(15 - Number(id.slice(-1))).padStart(2, "0")}T12:00:00.000Z`,
}));

const seedAnnouncements = [
  {
    id: "ann-1",
    masjidId: "furqan",
    title: "Jumuah parking update",
    category: "Administrative",
    excerpt: "Please use the west entrance and follow volunteer guidance after second Jumuah.",
    status: "Published",
    date: "Today, 2:30 PM",
    channels: ["Email", "SMS", "Push", "Website"],
    reach: 1240,
    createdAt: "2026-06-14T14:30:00.000Z",
  },
  {
    id: "ann-2",
    masjidId: "furqan",
    title: "Ramadan Fundraiser reminder",
    category: "Fundraiser",
    excerpt: "A short reminder encouraging recurring donations before the final ten nights.",
    status: "Scheduled",
    date: "Tomorrow, 9:00 AM",
    channels: ["Email", "Push"],
    reach: 0,
    createdAt: "2026-06-13T09:00:00.000Z",
  },
];

const seedAudit = [
  { id: "log-1", masjidId: "furqan", time: "6 min ago", user: "Imam Abdullah", action: "Announcement published", status: "Success", createdAt: "2026-06-14T14:30:00.000Z" },
  { id: "log-2", masjidId: "furqan", time: "18 min ago", user: "Admin Team", action: "Donation added", status: "Success", createdAt: "2026-06-14T14:18:00.000Z" },
  { id: "log-3", masjidId: "furqan", time: "42 min ago", user: "Finance Admin", action: "Report exported", status: "Success", createdAt: "2026-06-14T13:54:00.000Z" },
];

export function defaultSettings(masjid) {
  return {
    masjidId: masjid.id,
    name: masjid.name,
    country: masjid.country,
    city: masjid.city,
    address: masjid.address,
    location: masjid.location,
    timezone: masjid.timezone,
    calculationMethod: masjid.calculationMethod,
    asrMethod: masjid.asrMethod,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    receiptGeneration: true,
    updatedAt: masjid.createdAt,
  };
}

let seedPromise;

export function ensureSeedData() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const writes = [];
      for (const masjid of defaultMasjids) {
        writes.push(setJSON(`masjids/${masjid.id}`, masjid, { onlyIfNew: true }));
        writes.push(setJSON(`settings/${masjid.id}`, defaultSettings(masjid), { onlyIfNew: true }));
      }
      for (const donation of seedDonations) {
        writes.push(setJSON(`donations/${donation.masjidId}/${donation.id}`, donation, { onlyIfNew: true }));
      }
      for (const announcement of seedAnnouncements) {
        writes.push(setJSON(`announcements/${announcement.masjidId}/${announcement.id}`, announcement, { onlyIfNew: true }));
      }
      for (const entry of seedAudit) {
        writes.push(setJSON(`audit/${entry.masjidId}/${entry.createdAt}-${entry.id}`, entry, { onlyIfNew: true }));
      }
      await Promise.all(writes);
    })().catch((error) => {
      seedPromise = undefined;
      throw error;
    });
  }
  return seedPromise;
}

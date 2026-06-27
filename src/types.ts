export type Masjid = {
  id: string;
  name: string;
  location: string;
  method: string;
  country?: string;
  city?: string;
  address?: string;
  timezone?: string;
  calculationMethod?: string;
  asrMethod?: string;
};

export type UserRole = "admin" | "donor";
export type Language = "en" | "ar";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  masjidIds: string[];
  preferredMasjidId: string;
  createdAt: string;
  updatedAt?: string;
};

export type DonationStatus = "Completed" | "Pending" | "Refunded";
export type FundType = "Zakat" | "Sadaqah" | "General" | "Building";

export type Donation = {
  id: string;
  donorName: string;
  donorEmail: string;
  fund: FundType;
  amount: number;
  method: "Card" | "Bank Transfer" | "Cash";
  date: string;
  status: DonationStatus;
  refundStatus: "Not requested" | "Eligible" | "Refunded";
  receiptId: string;
};

export type FundBreakdown = {
  fund: FundType;
  amount: number;
  percentage: number;
  color: string;
};

export type Campaign = {
  id: string;
  name: string;
  raised: number;
  goal: number;
  dueDate: string;
};

export type PrayerTime = {
  name: "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
  adhan: string;
  iqamah: string;
  isNext?: boolean;
};

export type AnnouncementStatus = "Draft" | "Scheduled" | "Published";

export type Announcement = {
  id: string;
  title: string;
  category: "Community" | "Fundraiser" | "Prayer Alert" | "Administrative";
  excerpt: string;
  status: AnnouncementStatus;
  date: string;
  channels: Array<"Email" | "SMS" | "Push" | "Website">;
  reach: number;
};

export type Donor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lifetimeDonations: number;
  lastDonation: string;
  recurring: boolean;
  fundPreference: FundType;
  history: Donation[];
};

export type ReportMetric = {
  label: string;
  value: number;
  change: number;
};

export type AuditLogEntry = {
  id: string;
  time: string;
  user: string;
  action: string;
  status: "Success" | "Pending" | "Failed";
};

export type RecurringDonation = {
  id: string;
  masjidId: string;
  donorUserId: string;
  donorEmail: string;
  amount: number;
  fund: FundType;
  frequency: "Weekly" | "Monthly";
  status: "Active" | "Paused";
  nextPayment: string;
  createdAt: string;
};

export type WorkspaceSettings = {
  masjidId: string;
  name: string;
  country: string;
  city: string;
  address: string;
  location: string;
  timezone: string;
  calculationMethod: string;
  asrMethod: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  receiptGeneration: boolean;
  updatedAt: string;
};

export type PricingPlan = {
  id: "starter" | "growth" | "pro";
  name: string;
  price: number;
  description: string;
  bestFor: string;
  features: string[];
  highlighted?: boolean;
};

export type DemoScenario = {
  id: string;
  title: string;
  audience: string;
  outcome: string;
  steps: string[];
};

export type StaffDepartment =
  | "Imam & Religious"
  | "Administration"
  | "Finance"
  | "Volunteers"
  | "Security"
  | "Maintenance";

export type StaffStatus = "Active" | "On Leave" | "Inactive";
export type AttendanceStatus = "Present" | "Late" | "Absent" | "Day Off";

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  department: StaffDepartment;
  email: string;
  phone: string;
  joinDate: string;
  status: StaffStatus;
  salary: number;
  avatarInitials: string;
};

export type AttendanceRecord = {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
};

export type EventCategory =
  | "Religious"
  | "Educational"
  | "Social"
  | "Fundraiser"
  | "Youth"
  | "Administrative";

export type EventStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
export type BookingStatus = "Pending" | "Confirmed" | "Rejected";

export type MasjidEvent = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  capacity: number;
  rsvpCount: number;
  organizer: string;
  status: EventStatus;
  isRecurring: boolean;
};

export type Venue = {
  id: string;
  name: string;
  capacity: number;
  amenities: string[];
  available: boolean;
};

export type RoomBooking = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: BookingStatus;
};

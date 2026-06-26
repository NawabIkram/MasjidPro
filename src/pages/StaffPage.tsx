import { useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  Download,
  Mail,
  Phone,
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
  Wallet,
  X,
  Clock,
} from "lucide-react";
import { staffMembers, attendanceRecords } from "../data/mockData";
import type { StaffDepartment, StaffMember, StaffStatus } from "../types";
import { Badge, Card, SectionHeader, StatCard, Toast } from "../components/ui";
import { currency } from "../utils/format";
import { useLanguage } from "../i18n/i18n";
import { downloadTextFile } from "../utils/downloads";

// Helpers

const DEPARTMENTS: StaffDepartment[] = [
  "Imam & Religious",
  "Administration",
  "Finance",
  "Volunteers",
  "Security",
  "Maintenance",
];

const DEPT_COLORS: Record<StaffDepartment, string> = {
  "Imam & Religious": "#0f766e",
  Administration: "#2563eb",
  Finance: "#c0842e",
  Volunteers: "#16a34a",
  Security: "#9333ea",
  Maintenance: "#64748b",
};

function attendanceTone(status: string): "green" | "gold" | "red" | "neutral" {
  if (status === "Present") return "green";
  if (status === "Late") return "gold";
  if (status === "Absent") return "red";
  return "neutral";
}

function statusTone(status: StaffStatus): "green" | "gold" | "neutral" {
  if (status === "Active") return "green";
  if (status === "On Leave") return "gold";
  return "neutral";
}

// Add staff modal

function AddStaffModal({ onClose, onAdd }: { onClose: () => void; onAdd: (staff: StaffMember) => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState("New Staff Member");
  const [role, setRole] = useState("Administrator");
  const [department, setDepartment] = useState<StaffDepartment>("Administration");
  const [salary, setSalary] = useState(2400);
  const [email, setEmail] = useState("staff@masjid.org");
  const [phone, setPhone] = useState("+1 713 555 0100");

  function handleAdd() {
    onAdd({
      id: `staff-${Date.now()}`,
      name,
      role,
      department,
      email,
      phone,
      joinDate: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
      status: "Active",
      salary,
      avatarInitials: name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={t("staff_addStaff")}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">{t("staff_directory")}</span>
            <h2>{t("staff_addStaff")}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("close")}>
            <X size={20} />
          </button>
        </div>
        <div className="form-grid two">
          <label>
            <span>{t("staff_name")}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
          </label>
          <label>
            <span>{t("staff_role")}</span>
            <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Imam, Administrator" />
          </label>
          <label>
            <span>{t("staff_department")}</span>
            <select value={department} onChange={(event) => setDepartment(event.target.value as StaffDepartment)}>
              {DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>{t("staff_salary")}</span>
            <input type="number" value={salary} onChange={(event) => setSalary(Number(event.target.value))} placeholder="Monthly salary (USD)" />
          </label>
          <label>
            <span>{t("staff_email")}</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="work@masjid.org" />
          </label>
          <label>
            <span>{t("staff_phone")}</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 713 555 0100" />
          </label>
        </div>
        <div className="button-row end">
          <button className="secondary-button" type="button" onClick={onClose}>{t("cancel")}</button>
          <button className="primary-button" type="button" onClick={handleAdd}>{t("confirm")}</button>
        </div>
      </div>
    </div>
  );
}

// Page

export function StaffPage() {
  const { t } = useLanguage();
  const [records, setRecords] = useState(staffMembers);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<StaffDepartment | "All">("All");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"directory" | "attendance" | "payroll">("directory");
  const [toast, setToast] = useState("");

  const totalPayroll = records.reduce((sum, s) => sum + s.salary, 0);
  const activeCount = records.filter((s) => s.status === "Active").length;
  const onLeaveCount = records.filter((s) => s.status === "On Leave").length;
  const presentToday = attendanceRecords.filter((r) => r.status === "Present").length;

  const filtered = useMemo(
    () =>
      records.filter((s) => {
        const matchDept = deptFilter === "All" || s.department === deptFilter;
        const matchSearch =
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.role.toLowerCase().includes(search.toLowerCase());
        return matchDept && matchSearch;
      }),
    [records, search, deptFilter],
  );

  const deptStats = useMemo(
    () =>
      DEPARTMENTS.map((d) => ({
        dept: d,
        count: records.filter((s) => s.department === d).length,
        cost: records.filter((s) => s.department === d).reduce((sum, s) => sum + s.salary, 0),
        color: DEPT_COLORS[d],
      })),
    [records],
  );

  function handleExport() {
    const rows = [
      "Name,Role,Department,Status,Salary,Email,Phone,Join Date",
      ...records.map(
        (s) => `${s.name},${s.role},${s.department},${s.status},${s.salary},${s.email},${s.phone},${s.joinDate}`,
      ),
    ];
    downloadTextFile("masjidpro-staff-report.csv", rows.join("\n"));
    setToast("Staff report exported.");
  }

  function addStaff(staff: StaffMember) {
    setRecords((current) => [staff, ...current]);
    setToast("Staff member added.");
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <div className="page-title-row">
        <div>
          <span className="eyebrow">{t("nav_staff")}</span>
          <h1>{t("staff_subtitle")}</h1>
        </div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={handleExport}>
            <Download size={16} />
            {t("staff_exportReport")}
          </button>
          <button className="primary-button" type="button" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t("staff_addStaff")}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid four">
        <StatCard title={t("staff_totalStaff")} value={String(records.length)} change={`${activeCount} active`} icon={Users} />
        <StatCard title={t("staff_activeToday")} value={String(presentToday)} change={`of ${records.length} staff`} icon={UserCheck} tone="blue" />
        <StatCard title={t("staff_onLeave")} value={String(onLeaveCount)} change="currently away" icon={UserX} tone="gold" />
        <StatCard title={t("staff_totalPayroll")} value={currency(totalPayroll)} change="per month" icon={Wallet} />
      </div>

      {/* Tab Nav */}
      <div className="tab-nav">
        <button
          className={activeTab === "directory" ? "tab-btn active" : "tab-btn"}
          type="button"
          onClick={() => setActiveTab("directory")}
        >
          <Users size={16} />
          {t("staff_directory")}
        </button>
        <button
          className={activeTab === "attendance" ? "tab-btn active" : "tab-btn"}
          type="button"
          onClick={() => setActiveTab("attendance")}
        >
          <Clock size={16} />
          {t("staff_attendance")}
        </button>
        <button
          className={activeTab === "payroll" ? "tab-btn active" : "tab-btn"}
          type="button"
          onClick={() => setActiveTab("payroll")}
        >
          <Wallet size={16} />
          {t("staff_payroll")}
        </button>
      </div>

      {/* Directory Tab */}
      {activeTab === "directory" && (
        <Card>
          <SectionHeader title={t("staff_directory")} eyebrow={t("nav_staff")} />
          {/* Filters */}
          <div className="filter-row">
            <div className="search-field">
              <Search size={16} />
              <input
                placeholder={t("staff_searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-chips">
              <button
                type="button"
                className={deptFilter === "All" ? "filter-chip active" : "filter-chip"}
                onClick={() => setDeptFilter("All")}
              >
                {t("staff_allDepartments")}
              </button>
              {DEPARTMENTS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={deptFilter === d ? "filter-chip active" : "filter-chip"}
                  onClick={() => setDeptFilter(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          {/* Staff Cards Grid */}
          <div className="staff-grid">
            {filtered.map((staff) => (
              <article className="staff-card" key={staff.id}>
                <div className="staff-card-header">
                  <div className="staff-avatar" style={{ background: DEPT_COLORS[staff.department] }}>
                    {staff.avatarInitials}
                  </div>
                  <div className="staff-card-info">
                    <strong>{staff.name}</strong>
                    <span>{staff.role}</span>
                  </div>
                  <Badge tone={statusTone(staff.status)}>{staff.status}</Badge>
                </div>
                <div className="staff-card-meta">
                  <div>
                    <Building2 size={14} />
                    <span
                      className="dept-badge"
                      style={{
                        background: DEPT_COLORS[staff.department] + "22",
                        color: DEPT_COLORS[staff.department],
                      }}
                    >
                      {staff.department}
                    </span>
                  </div>
                  <div>
                    <Briefcase size={14} />
                    <span>{currency(staff.salary)}/mo</span>
                  </div>
                  <div>
                    <Mail size={14} />
                    <span>{staff.email}</span>
                  </div>
                  <div>
                    <Phone size={14} />
                    <span>{staff.phone}</span>
                  </div>
                  <div className="staff-join">
                    <span>Joined: {staff.joinDate}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <Card>
          <SectionHeader title={t("staff_attendance")} eyebrow={t("staff_attendanceLog")} />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("staff_name")}</th>
                  <th>{t("staff_checkIn")}</th>
                  <th>{t("staff_checkOut")}</th>
                  <th>{t("staff_status")}</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="cell-with-avatar">
                        <div
                          className="mini-avatar"
                          style={{
                            background:
                              DEPT_COLORS[records.find((s) => s.id === record.staffId)?.department ?? "Administration"],
                          }}
                        >
                          {record.staffName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        {record.staffName}
                      </div>
                    </td>
                    <td>{record.checkIn}</td>
                    <td>{record.checkOut}</td>
                    <td>
                      <Badge tone={attendanceTone(record.status)}>{record.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-list">
            {attendanceRecords.map((record) => (
              <div className="mobile-record" key={record.id}>
                <div>
                  <strong>{record.staffName}</strong>
                  <span>{record.checkIn} - {record.checkOut}</span>
                </div>
                <Badge tone={attendanceTone(record.status)}>{record.status}</Badge>
                <dl>
                  <div><dt>{t("staff_checkIn")}</dt><dd>{record.checkIn}</dd></div>
                  <div><dt>{t("staff_checkOut")}</dt><dd>{record.checkOut}</dd></div>
                  <div><dt>{t("staff_status")}</dt><dd>{record.status}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payroll Tab */}
      {activeTab === "payroll" && (
        <div className="dashboard-grid">
          <Card>
            <SectionHeader title={t("staff_payroll")} eyebrow={t("staff_monthlyCost")} />
            <div className="payroll-summary">
              <div className="payroll-total">
                <span>Monthly Total</span>
                <strong>{currency(totalPayroll)}</strong>
              </div>
            </div>
            <div className="payroll-list">
              {records.map((s) => (
                <div className="payroll-row" key={s.id}>
                  <div className="cell-with-avatar">
                    <div className="mini-avatar" style={{ background: DEPT_COLORS[s.department] }}>
                      {s.avatarInitials}
                    </div>
                    <div>
                      <strong>{s.name}</strong>
                      <span>{s.role}</span>
                    </div>
                  </div>
                  <div className="payroll-row-right">
                    <span
                      className="dept-badge"
                      style={{
                        background: DEPT_COLORS[s.department] + "22",
                        color: DEPT_COLORS[s.department],
                      }}
                    >
                      {s.department}
                    </span>
                    <strong>{currency(s.salary)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionHeader title="Department Cost" eyebrow="Budget allocation" />
            <div className="dept-cost-list">
              {deptStats.filter((d) => d.count > 0).map((d) => (
                <div className="dept-cost-row" key={d.dept}>
                  <div className="dept-cost-label">
                    <span className="dept-dot" style={{ background: d.color }} />
                    <span>{d.dept}</span>
                    <span className="dept-count">({d.count})</span>
                  </div>
                  <div className="dept-cost-bar-wrap">
                    <div
                      className="dept-cost-bar"
                      style={{
                        width: `${Math.round((d.cost / totalPayroll) * 100)}%`,
                        background: d.color,
                      }}
                    />
                  </div>
                  <strong>{currency(d.cost)}</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {showModal && <AddStaffModal onClose={() => setShowModal(false)} onAdd={addStaff} />}
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

import { useMemo, useState } from "react";
import { Eye, Megaphone, Send, Sparkles } from "lucide-react";
import { announcements } from "../data/mockData";
import { Badge, Card, ConfirmDialog, EmptyState, LoadingSkeleton, SectionHeader, Toast } from "../components/ui";
import type { AnnouncementStatus } from "../types";

function tone(status: AnnouncementStatus): "green" | "blue" | "neutral" {
  if (status === "Published") return "green";
  if (status === "Scheduled") return "blue";
  return "neutral";
}

export function AnnouncementsPage() {
  const [title, setTitle] = useState("Ramadan Fundraiser Reminder");
  const [message, setMessage] = useState(
    "Help us complete the Ramadan Fundraiser by setting up a recurring Sadaqah gift before Jumuah.",
  );
  const [audience, setAudience] = useState("Everyone");
  const [schedule, setSchedule] = useState("Jun 21, 2026 09:00 AM");
  const [draftStatus, setDraftStatus] = useState<AnnouncementStatus>("Draft");
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState("");
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "All">("All");
  const filtered = useMemo(
    () => announcements.filter((announcement) => statusFilter === "All" || announcement.status === statusFilter),
    [statusFilter],
  );

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Announcements</span>
          <h1>Draft, preview, schedule, and broadcast community updates.</h1>
        </div>
        <button className="primary-button" type="button">
          <Megaphone size={18} />
          Create Announcement
        </button>
      </div>

      <div className="announce-layout">
        <Card>
          <SectionHeader title="AI Announcement Writer" eyebrow="Draft assistant" />
          <div className="form-grid">
            <label>
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <div className="form-grid two">
              <label>
                <span>Category</span>
                <select defaultValue="Fundraiser">
                  <option>Community</option>
                  <option>Fundraiser</option>
                  <option>Prayer Alert</option>
                  <option>Administrative</option>
                </select>
              </label>
              <label>
                <span>Audience</span>
                <select value={audience} onChange={(event) => setAudience(event.target.value)}>
                  <option>Everyone</option>
                  <option>Members Only</option>
                  <option>Donors</option>
                  <option>Staff & Volunteers</option>
                </select>
              </label>
            </div>
            <label>
              <span>Message Content</span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={7} />
            </label>
            <div className="form-grid two">
              <label>
                <span>Schedule date/time</span>
                <input value={schedule} onChange={(event) => setSchedule(event.target.value)} />
              </label>
              <label>
                <span>Status</span>
                <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as AnnouncementStatus)}>
                  <option>Draft</option>
                  <option>Scheduled</option>
                  <option>Published</option>
                </select>
              </label>
            </div>
            <div className="channel-grid">
              {["Email", "Push Notification", "SMS", "Website Banner"].map((channel) => (
                <label key={channel}><input type="checkbox" defaultChecked={channel !== "SMS"} /> {channel}</label>
              ))}
            </div>
          </div>
          <div className="button-row">
            <button className="secondary-button" type="button">
              <Sparkles size={18} />
              Improve with AI
            </button>
            <button className="secondary-button" type="button">
              <Eye size={18} />
              Preview
            </button>
            <button className="secondary-button" type="button" onClick={() => setToast("Announcement saved as draft.")}>
              Save Draft
            </button>
            <button className="primary-button" type="button" onClick={() => setShowConfirm(true)}>
              <Send size={18} />
              Publish
            </button>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Preview" eyebrow="Before publishing" action={<Eye size={18} />} />
          <div className="announcement-preview">
            <Badge tone="gold">Fundraiser</Badge>
            <h3>{title}</h3>
            <p>{message}</p>
            <span>Audience: {audience} | Schedule: {schedule}</span>
            <span>Channels: Email, Push Notification, Website Banner</span>
          </div>
          <div className="checklist">
            <span>AI tone analysis: Serene and informative</span>
            <span>Character count within limits</span>
            <span>Arabic/Urdu translation pending</span>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="History & Management"
          action={
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AnnouncementStatus | "All")}>
              <option>All</option>
              <option>Draft</option>
              <option>Scheduled</option>
              <option>Published</option>
            </select>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState title="No announcements yet" description="Create or schedule an announcement to see it here." />
        ) : (
          <div className="announcement-list">
            {filtered.map((announcement) => (
              <div className="announcement-item detailed" key={announcement.id}>
                <div>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.excerpt}</p>
                  <span>{announcement.channels.join(", ")} | Reach: {announcement.reach}</span>
                </div>
                <Badge tone={tone(announcement.status)}>{announcement.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader title="Loading State" eyebrow="System feedback" />
        <LoadingSkeleton rows={3} />
      </Card>

      {showConfirm ? (
        <ConfirmDialog
          title="Publish announcement?"
          message="This will send the announcement to selected channels and update the history table."
          confirmLabel="Publish"
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            setDraftStatus("Published");
            setToast("Announcement published successfully.");
          }}
        />
      ) : null}

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

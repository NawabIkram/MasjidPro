import { Eye, Megaphone, Send, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Card, ConfirmDialog, EmptyState, LoadingSkeleton, SectionHeader, Toast } from "../components/ui";
import { announcements } from "../data/mockData";
import type { Announcement, AnnouncementStatus } from "../types";
import { useLanguage } from "../i18n/i18n";
import { createAnnouncement, generateAnnouncementDraft, getAnnouncements, type AIAnnouncementResult } from "../services/api";

export function AnnouncementsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState(announcements);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<Announcement["category"]>("Community");
  const [audience, setAudience] = useState("Everyone");
  const [channels, setChannels] = useState<Announcement["channels"]>(["Email", "Push"]);
  const [schedule, setSchedule] = useState("Today, 2:00 PM");
  const [draftStatus, setDraftStatus] = useState<AnnouncementStatus>("Draft");
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "All">("All");

  const [toast, setToast] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<AIAnnouncementResult | null>(null);
  const [previewTab, setPreviewTab] = useState<keyof AIAnnouncementResult>("english");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getAnnouncements()
      .then((data) => {
        if (mounted) {
          setItems(data);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  function tone(status: AnnouncementStatus) {
    if (status === "Published") return "green";
    if (status === "Scheduled") return "blue";
    return "neutral";
  }

  const filtered = useMemo(
    () => (statusFilter === "All" ? items : items.filter((item) => item.status === statusFilter)),
    [items, statusFilter],
  );

  function toggleChannel(channel: Announcement["channels"][number]) {
    setChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel],
    );
  }

  async function saveAnnouncement(status: AnnouncementStatus) {
    const nextAnnouncement = await createAnnouncement({
      title: title || "Community update",
      category,
      excerpt: generatedContent ? generatedContent.english : message,
      status,
      date: status === "Draft" ? "Draft" : schedule,
      channels,
    });

    setItems((current) => [nextAnnouncement, ...current]);
    setDraftStatus(status);
    setToast(status === "Published" ? "Announcement published successfully." : "Announcement saved as draft.");
  }

  async function handleAIGenerate() {
    if (!title && !message) {
      setToast("Please enter a rough title or message first.");
      return;
    }

    setIsGenerating(true);
    setToast("AI is crafting the announcement in multiple languages...");

    try {
      const result = await generateAnnouncementDraft({ title, message, audience, category });
      setGeneratedContent(result);
      setTitle(result.title);
      setToast("AI announcement generated successfully!");
    } catch (error: any) {
      setToast(error.message || "Failed to generate AI content.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Announcements</span>
          <h1>Draft, preview, schedule, and broadcast community updates.</h1>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setTitle("");
            setMessage("");
            setGeneratedContent(null);
            setDraftStatus("Draft");
            setToast("New announcement draft started.");
          }}
        >
          <Megaphone size={18} />
          Create Announcement
        </button>
      </div>

      <div className="announce-layout">
        <Card>
          <SectionHeader title="Live AI Announcement Writer" eyebrow="Draft assistant" />
          <div className="form-grid">
            <label>
              <span>Topic / Draft Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Jumuah parking reminder" />
            </label>
            <div className="form-grid two">
              <label>
                <span>Category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value as Announcement["category"])}>
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
              <span>Rough Notes (Optional)</span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder="e.g. Please remind everyone not to park in the neighbor's driveway on Friday..." />
            </label>

            <button
              className="primary-button"
              type="button"
              onClick={handleAIGenerate}
              disabled={isGenerating}
              style={{ width: "100%", justifyContent: "center", background: "linear-gradient(to right, #0f766e, #0369a1)" }}
            >
              {isGenerating ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
              {isGenerating ? "Generating..." : "Generate with AI"}
            </button>

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
              {[
                { label: "Email", value: "Email" },
                { label: "Push Notification", value: "Push" },
                { label: "SMS", value: "SMS" },
                { label: "Website Banner", value: "Website" },
              ].map((channel) => (
                <label key={channel.value}>
                  <input
                    type="checkbox"
                    checked={channels.includes(channel.value as Announcement["channels"][number])}
                    onChange={() => toggleChannel(channel.value as Announcement["channels"][number])}
                  />{" "}
                  {channel.label}
                </label>
              ))}
            </div>
          </div>
          <div className="button-row" style={{marginTop: '2rem'}}>
            <button className="secondary-button" type="button" onClick={() => saveAnnouncement("Draft")}>
              Save Draft
            </button>
            <button className="primary-button" type="button" onClick={() => setShowConfirm(true)}>
              <Send size={18} />
              Publish
            </button>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Live Preview" eyebrow="AI Output" action={<Eye size={18} />} />

          {generatedContent ? (
            <div className="ai-preview-container">
              <div className="tab-nav" style={{marginBottom: '1rem', flexWrap: 'wrap'}}>
                {(Object.keys(generatedContent).filter(k => k !== 'title') as Array<keyof AIAnnouncementResult>).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`tab-btn ${previewTab === key ? 'active' : ''}`}
                    onClick={() => setPreviewTab(key)}
                    style={{textTransform: 'capitalize', padding: '0.5rem'}}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="announcement-preview" style={{ direction: (previewTab === "arabic" || previewTab === "urdu") ? "rtl" : "ltr" }}>
                <Badge tone="gold">{category}</Badge>
                <h3 style={{marginTop: '0.5rem'}}>{generatedContent.title}</h3>
                <div style={{ whiteSpace: "pre-wrap", color: "#334155", lineHeight: "1.6" }}>
                  {generatedContent[previewTab]}
                </div>
              </div>
              <div className="checklist" style={{marginTop: '1.5rem'}}>
                <span><Sparkles size={14} style={{display:'inline', marginRight:'4px', color:'#0f766e'}}/> AI translation completed</span>
                <span>Channels: {channels.join(", ") || "No channels selected"}</span>
              </div>
            </div>
          ) : (
             <EmptyState title="No AI output yet" description="Enter a topic and click Generate with AI to preview all formats." />
          )}
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
        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : filtered.length === 0 ? (
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

      {showConfirm ? (
        <ConfirmDialog
          title="Publish announcement?"
          message="This will send the announcement to selected channels and update the history table."
          confirmLabel="Publish"
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            saveAnnouncement("Published");
          }}
        />
      ) : null}

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

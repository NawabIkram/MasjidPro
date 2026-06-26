import { useState } from "react";
import { BellRing, Clock3, MapPin, Moon, Settings2 } from "lucide-react";
import { Card, ProgressBar, SectionHeader, Toast } from "../components/ui";
import { prayerTimes } from "../data/mockData";

export function PrayerTimesPage() {
  const [toast, setToast] = useState("");
  const nextPrayer = prayerTimes.find((prayer) => prayer.isNext) ?? prayerTimes[0];

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Prayer Times</span>
          <h1>Daily salah schedule with next prayer highlight and congregation alerts.</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => setToast("Prayer schedule updated for today.")}>
          <Settings2 size={18} />
          Update Schedule
        </button>
      </div>

      <div className="prayer-layout">
        <Card className="next-prayer-large">
          <SectionHeader title="Next Prayer" eyebrow="Countdown" />
          <Moon size={30} />
          <span>{nextPrayer.name}</span>
          <strong>02:18:45</strong>
          <p>Adhan {nextPrayer.adhan} | Iqamah {nextPrayer.iqamah}</p>
          <ProgressBar value={62} />
        </Card>

        <Card>
          <SectionHeader title="Today's Prayer List" eyebrow="Full schedule" />
          <div className="prayer-table">
            {prayerTimes.map((prayer) => (
              <div className={prayer.isNext ? "prayer-row highlighted" : "prayer-row"} key={prayer.name}>
                <div>
                  <strong>{prayer.name}</strong>
                  {prayer.isNext ? <span>Next prayer</span> : null}
                </div>
                <span>{prayer.adhan}</span>
                <span>{prayer.iqamah}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="dashboard-grid three">
        <Card>
          <SectionHeader title="Location" eyebrow="Masjid setting" />
          <div className="meta-line"><MapPin size={18} /> Houston, TX</div>
          <div className="meta-line"><Clock3 size={18} /> Calculation method: ISNA</div>
        </Card>
        <Card>
          <SectionHeader title="Notification Settings" eyebrow="Community alerts" />
          <div className="toggle-list">
            <label><input type="checkbox" defaultChecked onChange={() => setToast("Prayer notification setting updated.")} /> Notify before prayer</label>
            <label><input type="checkbox" defaultChecked onChange={() => setToast("Jumuah notification setting updated.")} /> Notify before Jumuah</label>
            <label><input type="checkbox" onChange={() => setToast("Iftar notification setting updated.")} /> Notify before Iftar</label>
          </div>
        </Card>
        <Card>
          <SectionHeader title="Community Alert" eyebrow="Scheduled" />
          <div className="info-box">
            <BellRing size={20} />
            <p>Evening reminder will send 20 minutes before Maghrib to all app subscribers.</p>
          </div>
        </Card>
      </div>
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

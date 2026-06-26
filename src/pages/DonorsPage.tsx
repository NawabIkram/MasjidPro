import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Repeat2, UserRound } from "lucide-react";
import { Badge, Card, EmptyState, LoadingSkeleton, Modal, SectionHeader, Toast } from "../components/ui";
import { donors } from "../data/mockData";
import type { Donor, FundType } from "../types";
import { currency } from "../utils/format";
import { getDonors } from "../services/api";

export function DonorsPage() {
  const [records, setRecords] = useState<Donor[]>(donors);
  const [activeDonorId, setActiveDonorId] = useState(donors[0].id);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState("");
  const [newDonor, setNewDonor] = useState({
    name: "New Donor",
    email: "new.donor@email.com",
    phone: "+1 713 555 0100",
    fundPreference: "General" as FundType,
  });
  const activeDonor = useMemo(
    () => records.find((donor) => donor.id === activeDonorId) ?? records[0],
    [activeDonorId, records],
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getDonors()
      .then((data) => {
        if (mounted) {
          setRecords(data);
          setActiveDonorId(data[0]?.id ?? donors[0].id);
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

  function addDonor() {
    const donor: Donor = {
      id: `donor-${Date.now()}`,
      name: newDonor.name,
      email: newDonor.email,
      phone: newDonor.phone,
      lifetimeDonations: 0,
      lastDonation: "No donations yet",
      recurring: false,
      fundPreference: newDonor.fundPreference,
      history: [],
    };
    setRecords((current) => [donor, ...current]);
    setActiveDonorId(donor.id);
    setShowAddModal(false);
    setToast("Donor profile created.");
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Donor CRM</span>
          <h1>Understand giving patterns and keep donor relationships organized.</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowAddModal(true)}>
          <UserRound size={18} />
          Add Donor
        </button>
      </div>

      <div className="donor-layout">
        <Card>
          <SectionHeader title="Donor Profiles" eyebrow="Community CRM" />
          <div className="donor-list">
            {loading ? <LoadingSkeleton rows={4} /> : null}
            {records.map((donor) => (
              <button className={donor.id === activeDonor.id ? "donor-row active" : "donor-row"} key={donor.id} type="button" onClick={() => setActiveDonorId(donor.id)}>
                <div className="avatar small">{donor.name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <strong>{donor.name}</strong>
                  <span>{donor.email}</span>
                </div>
                {donor.recurring ? <Badge tone="green">Recurring</Badge> : <Badge>One-time</Badge>}
              </button>
            ))}
          </div>
        </Card>

        <Card className="donor-profile">
          <SectionHeader title={activeDonor.name} eyebrow="Profile card" />
          <div className="profile-grid">
            <div><span>Lifetime donations</span><strong>{currency(activeDonor.lifetimeDonations)}</strong></div>
            <div><span>Last donation</span><strong>{activeDonor.lastDonation}</strong></div>
            <div><span>Fund preference</span><strong>{activeDonor.fundPreference}</strong></div>
            <div><span>Recurring status</span><strong>{activeDonor.recurring ? "Active" : "Inactive"}</strong></div>
          </div>
          <div className="contact-list">
            <span><Mail size={16} /> {activeDonor.email}</span>
            <span><Phone size={16} /> {activeDonor.phone}</span>
            <span><Repeat2 size={16} /> Monthly recurring donor</span>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Donation History" eyebrow="Selected donor" />
        {activeDonor.history.length === 0 ? (
          <EmptyState title="No donations yet" description="This donor has not made a recorded donation." />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Donation ID</th>
                    <th>Fund</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDonor.history.map((donation) => (
                    <tr key={donation.id}>
                      <td>{donation.id}</td>
                      <td>{donation.fund}</td>
                      <td>{currency(donation.amount)}</td>
                      <td>{donation.date}</td>
                      <td><Badge tone="green">{donation.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-list">
              {activeDonor.history.map((donation) => (
                <div className="mobile-record" key={donation.id}>
                  <div>
                    <strong>{donation.id}</strong>
                    <span>{donation.date}</span>
                  </div>
                  <Badge tone="green">{donation.status}</Badge>
                  <dl>
                    <div><dt>Fund</dt><dd>{donation.fund}</dd></div>
                    <div><dt>Amount</dt><dd>{currency(donation.amount)}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
      {showAddModal ? (
        <Modal title="Add Donor" description="Create a lightweight donor CRM profile." onClose={() => setShowAddModal(false)}>
          <div className="form-grid two">
            <label><span>Name</span><input value={newDonor.name} onChange={(event) => setNewDonor((current) => ({ ...current, name: event.target.value }))} /></label>
            <label><span>Email</span><input value={newDonor.email} onChange={(event) => setNewDonor((current) => ({ ...current, email: event.target.value }))} /></label>
            <label><span>Phone</span><input value={newDonor.phone} onChange={(event) => setNewDonor((current) => ({ ...current, phone: event.target.value }))} /></label>
            <label><span>Fund preference</span><select value={newDonor.fundPreference} onChange={(event) => setNewDonor((current) => ({ ...current, fundPreference: event.target.value as FundType }))}><option>Zakat</option><option>Sadaqah</option><option>General</option><option>Building</option></select></label>
          </div>
          <div className="button-row end">
            <button className="secondary-button" type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="primary-button" type="button" onClick={addDonor}>Create Donor</button>
          </div>
        </Modal>
      ) : null}
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

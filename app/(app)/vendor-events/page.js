"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { listVendorEvents, createVendorEvent, deleteVendorEvent } from "@/lib/api/vendor-events";
import Modal from "@/components/Modal";
import VendorEventForm from "@/components/forms/VendorEventForm";
import Icon from "@/components/Icons";

const ATTENDANCE_LABELS = { ATTENDED: "Attended", VIRTUAL_MEETING: "Virtual meeting" };

export default function VendorEventsPage() {
  const { hasFullAccess } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setEvents(await listVendorEvents());
    } catch (err) {
      setError(err.message || "Failed to load vendor events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleCreate(payload) {
    await createVendorEvent(payload);
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    await deleteVendorEvent(id);
    load();
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">Vendor events</h1>
          <p className="mt-1 text-sm text-slate-500">Product briefings, training and launch events the team has attended.</p>
        </div>
        {hasFullAccess && (
          <button onClick={() => setShowForm(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
            <Icon name="plus" size={16}/> Log event
          </button>
        )}
      </header>

      {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400 shadow-sm">Loading vendor events…</div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No vendor events logged yet.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Product</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Attendance</th>
                  <th className="px-5 py-4 font-semibold">Logged by</th>
                  {hasFullAccess && <th className="px-5 py-4 text-right font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-medium text-slate-800">{event.productName}</td>
                    <td className="px-5 py-4 text-slate-600">{event.eventDate ? new Date(event.eventDate).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{ATTENDANCE_LABELS[event.attendance] ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{event.createdBy?.name ?? "—"}</td>
                    {hasFullAccess && <td className="px-5 py-4 text-right"><button type="button" onClick={() => handleDelete(event.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <Modal title="Log vendor event" onClose={() => setShowForm(false)}>
          <VendorEventForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}

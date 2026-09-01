"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { changePassword, logoutAll } from "@/lib/api/auth";
import { getEmailSettings, updateEmailSettings } from "@/lib/api/settings";
import { ROLES } from "@/lib/constants";

const parseEmails = (value) =>
  value.split(",").map((email) => email.trim()).filter(Boolean);

function EmailSettingsSection() {
  const [ccEmails, setCcEmails] = useState("");
  const [bccEmails, setBccEmails] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await getEmailSettings();
      setCcEmails((data.ccEmails ?? []).join(", "));
      setBccEmails((data.bccEmails ?? []).join(", "));
    } catch (err) { setError(err.message || "Failed to load email settings"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    setError(""); setMessage(""); setSaving(true);
    try {
      await updateEmailSettings({ ccEmails: parseEmails(ccEmails), bccEmails: parseEmails(bccEmails) });
      setMessage("Saved.");
    } catch (err) { setError(err.message || "Could not save email settings"); }
    finally { setSaving(false); }
  }

  const input = "mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100";

  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-soft)]">
    <h2 className="font-semibold text-slate-900">Email CC/BCC defaults</h2>
    <p className="mt-1 text-sm text-slate-500">These addresses are automatically added to every email a salesperson sends to a lead, on top of anything they add themselves.</p>
    {loading ? <p className="mt-4 text-sm text-slate-400">Loading…</p> : <form onSubmit={submit} className="mt-5 space-y-4">
      <label className="block text-sm font-medium text-slate-700">CC (comma-separated)
        <input className={input} value={ccEmails} onChange={(e) => setCcEmails(e.target.value)} placeholder="manager@company.com" />
      </label>
      <label className="block text-sm font-medium text-slate-700">BCC (comma-separated)
        <input className={input} value={bccEmails} onChange={(e) => setBccEmails(e.target.value)} placeholder="oversight@company.com" />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      <button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
    </form>}
  </section>;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e) { e.preventDefault(); setError(""); setMessage(""); if (form.newPassword.length < 12) return setError("New password must be at least 12 characters."); if (form.newPassword !== form.confirm) return setError("New passwords do not match."); setBusy(true); try { await changePassword(form.currentPassword, form.newPassword); setMessage("Password changed. Please sign in again."); window.dispatchEvent(new Event("lms:unauthorized")); setTimeout(() => router.replace("/login"), 800); } catch (err) { setError(err.message || "Could not change password"); } finally { setBusy(false); } }
  async function endAllSessions() { setBusy(true); setError(""); try { await logoutAll(); window.dispatchEvent(new Event("lms:unauthorized")); router.replace("/login"); } catch (err) { setError(err.message || "Could not sign out all devices"); setBusy(false); } }
  const input = "mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100";
  return <div className="max-w-2xl space-y-5"><header><h1 className="text-2xl font-semibold tracking-tight text-slate-950">Security settings</h1><p className="mt-1 text-sm text-slate-500">Manage your password and active sessions.</p></header><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-soft)]"><h2 className="font-semibold text-slate-900">Change password</h2><form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-sm font-medium text-slate-700">Current password<input required type="password" value={form.currentPassword} onChange={(e) => setForm({...form,currentPassword:e.target.value})} className={input}/></label><label className="block text-sm font-medium text-slate-700">New password<input required minLength={12} type="password" value={form.newPassword} onChange={(e) => setForm({...form,newPassword:e.target.value})} className={input}/></label><label className="block text-sm font-medium text-slate-700">Confirm new password<input required minLength={12} type="password" value={form.confirm} onChange={(e) => setForm({...form,confirm:e.target.value})} className={input}/></label>{error && <p className="text-sm text-red-600">{error}</p>}{message && <p className="text-sm text-emerald-600">{message}</p>}<button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">Update password</button></form></section><section className="rounded-xl border border-red-200 bg-white p-6"><h2 className="font-semibold text-slate-900">Sign out everywhere</h2><p className="mt-1 text-sm text-slate-500">Revoke refresh tokens on every device, including this one.</p><button disabled={busy} onClick={endAllSessions} className="mt-4 rounded-lg border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">Logout all devices</button></section>{user?.role === ROLES.SUPER_ADMIN && <EmailSettingsSection />}</div>;
}

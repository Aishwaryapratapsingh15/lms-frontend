"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { listUsers, createUser, dismissUser } from "@/lib/api/users";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import Modal from "@/components/Modal";
import UserForm from "@/components/forms/UserForm";
import Icon from "@/components/Icons";

export default function UsersPage() {
  const { hasFullAccess, user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [userToDismiss, setUserToDismiss] = useState(null);
  const [dismissing, setDismissing] = useState(false);
  const [dismissError, setDismissError] = useState("");

  useEffect(() => {
    if (!hasFullAccess) router.replace("/dashboard");
  }, [hasFullAccess, router]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Team data is fetched asynchronously after access has been confirmed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hasFullAccess) load();
  }, [hasFullAccess]);

  async function handleCreate(payload) {
    await createUser(payload);
    setShowForm(false);
    load();
  }

  function canDismiss(target) {
    if (!user || target.id === user.id || target.role === ROLES.SUPER_ADMIN) return false;
    if (user.role === ROLES.SUPER_ADMIN) return [ROLES.ADMIN, ROLES.SALES].includes(target.role);
    return user.role === ROLES.ADMIN && target.role === ROLES.SALES;
  }

  function openDismissConfirmation(target) {
    setSuccess("");
    setDismissError("");
    setUserToDismiss(target);
  }

  async function confirmDismiss() {
    if (!userToDismiss || !canDismiss(userToDismiss)) return;
    setDismissing(true);
    setDismissError("");
    try {
      const result = await dismissUser(userToDismiss.id);
      const response = result?.data ?? result ?? {};
      const unassignedCount = Number(response.unassignedLeadsCount ?? response.unassignedLeads ?? response.unassignedLeadCount ?? response.unassignedCount ?? response.leadsUnassigned ?? 0);
      setUserToDismiss(null);
      setSuccess(`User dismissed successfully. ${unassignedCount} leads were unassigned.`);
      await load();
      window.dispatchEvent(new Event("lms:data-invalidated"));
      router.refresh();
    } catch (err) {
      setDismissError(err.message || "Could not dismiss this user");
    } finally {
      setDismissing(false);
    }
  }

  if (!hasFullAccess) return null;

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">Team members</h1>
            <p className="mt-1 text-sm text-slate-500">Manage access, roles and lead assignments across your team.</p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Icon name="plus" size={16}/> Add member
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">{[["Team size",users.length,"users","bg-blue-50 text-blue-600"],["Administrators",users.filter(u=>u.role !== "SALES").length,"target","bg-violet-50 text-violet-600"],["Sales members",users.filter(u=>u.role === "SALES").length,"leads","bg-emerald-50 text-emerald-600"]].map(([label,value,icon,tone])=><div key={label} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-soft)]"><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon name={icon} size={18}/></div><div><p className="text-xl font-semibold text-slate-900">{value}</p><p className="text-[11px] text-slate-500">{label}</p></div></div>)}</div>

      {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</p>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400 shadow-sm">
          Loading users…
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Name</th>
                  <th className="px-5 py-4 font-semibold">Email</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-600">{u.name?.slice(0,1)?.toUpperCase()}</div><span className="font-medium text-slate-800">{u.name}</span></div></td>
                    <td className="px-5 py-4 text-slate-600">{u.email}</td>
                    <td className="px-5 py-4 text-slate-600">
                      <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">{canDismiss(u) && <button type="button" onClick={() => openDismissConfirmation(u)} className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline">Dismiss</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <Modal title="New user" onClose={() => setShowForm(false)}>
          <UserForm allowedRoles={user?.role === ROLES.SUPER_ADMIN ? Object.values(ROLES) : [ROLES.SALES]} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
      {userToDismiss && (
        <Modal title="Dismiss user" description="This action cannot be undone." onClose={() => { if (!dismissing) setUserToDismiss(null); }}>
          <p className="text-sm leading-6 text-slate-700">Are you sure you want to dismiss this user? Their access will be revoked immediately and their assigned leads will become unassigned.</p>
          <p className="mt-3 text-sm font-semibold text-slate-900">{userToDismiss.name} <span className="font-normal text-slate-500">({userToDismiss.email})</span></p>
          {dismissError && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{dismissError}</p>}
          <div className="mt-6 flex justify-end gap-2"><button type="button" disabled={dismissing} onClick={() => setUserToDismiss(null)} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="button" disabled={dismissing} onClick={confirmDismiss} className="h-10 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">{dismissing ? "Dismissing…" : "Dismiss user"}</button></div>
        </Modal>
      )}
    </div>
  );
}

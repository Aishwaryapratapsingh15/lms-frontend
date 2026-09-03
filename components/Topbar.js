"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { listReminders } from "@/lib/api/leads";
import { ROLE_LABELS } from "@/lib/constants";
import { LINKS } from "@/components/Sidebar";
import Icon from "@/components/Icons";

const reminderDate = (item) => item.nextFollowUpAt ?? item.reminderAt;

export default function Topbar() {
  const { user, logout, hasFullAccess } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const notificationsRef = useRef(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const data = await listReminders("all", 6);
      setNotifications(Array.isArray(data) ? data : data?.data ?? data?.reminders ?? []);
    } catch (error) {
      setNotificationsError(error.message || "Could not load notifications");
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    function closeOnOutsideClick(event) {
      if (!notificationsRef.current?.contains(event.target)) setNotificationsOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  async function toggleNotifications() {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (nextOpen) await loadNotifications();
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return <><header className="sticky top-0 z-30 h-[72px] border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md md:px-7"><div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4">
    <div className="flex items-center gap-3 lg:hidden"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">EI</div><div className="hidden sm:block"><p className="text-sm font-semibold text-slate-900">EICE LeadFlow</p><p className="text-[10px] text-slate-500">Sales workspace</p></div></div>
    <div className="relative hidden w-full max-w-md lg:block"><Icon name="search" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-14 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100" placeholder="Search leads, companies or team members" /><kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">⌘ K</kbd></div>
    <div className="flex items-center gap-2">
      <div ref={notificationsRef} className="relative">
        <button type="button" onClick={toggleNotifications} aria-label="Notifications" aria-expanded={notificationsOpen} aria-controls="notifications-panel" className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition ${notificationsOpen ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}><Icon name="bell" size={18} />{notifications.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">{notifications.length > 9 ? "9+" : notifications.length}</span>}</button>
        {notificationsOpen && <div id="notifications-panel" className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="text-sm font-semibold text-slate-900">Notifications</p><p className="text-[11px] text-slate-500">Your follow-up reminders</p></div><button type="button" onClick={loadNotifications} disabled={notificationsLoading} className="text-[11px] font-semibold text-blue-600 disabled:opacity-50">Refresh</button></div>
          <div className="max-h-80 overflow-y-auto">
            {notificationsLoading ? <p className="px-4 py-8 text-center text-xs text-slate-400">Loading notifications…</p> : notificationsError ? <div className="px-4 py-6 text-center"><p className="text-xs text-red-600">{notificationsError}</p><button type="button" onClick={loadNotifications} className="mt-2 text-xs font-semibold text-blue-600">Try again</button></div> : notifications.length === 0 ? <p className="px-4 py-8 text-center text-xs text-slate-500">You have no pending reminders.</p> : <ul className="divide-y divide-slate-100">{notifications.map((item) => { const lead = item.lead ?? {}; const due = reminderDate(item); return <li key={item.id}><Link href={`/leads/${lead.id ?? item.leadId}`} onClick={() => setNotificationsOpen(false)} className="block px-4 py-3 transition hover:bg-blue-50/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{lead.fullName ?? item.leadName ?? "Lead follow-up"}</p><p className="mt-1 truncate text-[11px] text-slate-500">{String(item.type ?? "Reminder").replaceAll("_", " ")}{item.notes ? ` · ${item.notes}` : ""}</p></div>{due && <time dateTime={due} className="shrink-0 text-[10px] text-slate-400">{new Date(due).toLocaleDateString([], { day: "2-digit", month: "short" })}</time>}</div></Link></li>; })}</ul>}
          </div>
          <Link href="/reminders" onClick={() => setNotificationsOpen(false)} className="block border-t border-slate-100 px-4 py-3 text-center text-xs font-semibold text-blue-600 hover:bg-slate-50">View all reminders →</Link>
        </div>}
      </div>
      <div className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />{user && <div className="flex items-center gap-2.5 px-1.5 py-1"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-semibold text-white">{String(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}</div><div className="hidden text-left md:block"><p className="max-w-32 truncate text-xs font-semibold text-slate-800">{user.name ?? user.email}</p><p className="text-[10px] text-slate-500">{ROLE_LABELS[user.role] ?? user.role}</p></div></div>}<button onClick={handleLogout} aria-label="Log out" title="Log out" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Icon name="logout" size={17} /></button>
    </div>
  </div></header><nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">{LINKS.filter((link) => !link.fullAccessOnly || hasFullAccess).map((link) => { const active = pathname.startsWith(link.href); return <Link key={link.href} href={link.href} className={`flex min-w-20 flex-col items-center gap-1 py-2 text-[10px] font-medium ${active ? "text-blue-600" : "text-slate-500"}`}><Icon name={link.icon} size={19} />{link.label}</Link>; })}</nav></>;
}

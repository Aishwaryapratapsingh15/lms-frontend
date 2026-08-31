"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Icon from "@/components/Icons";

export const LINKS = [
  { href: "/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/leads", label: "Leads", icon: "leads" },
  { href: "/reminders", label: "Reminders", icon: "calendar" },
  { href: "/calendar", label: "Team calendar", icon: "calendar" },
  { href: "/form-submissions", label: "General enquiries", icon: "mail", fullAccessOnly: true },
  { href: "/users", label: "Team members", icon: "users", fullAccessOnly: true },
  { href: "/settings", label: "Security", icon: "target" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { hasFullAccess } = useAuth();
  return <aside className="hidden w-[248px] shrink-0 border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
    <div className="flex h-[72px] items-center gap-3 border-b border-slate-100 px-6"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-200">EI</div><div><h2 className="text-[15px] font-semibold tracking-tight text-slate-900">EICE LeadFlow</h2><p className="text-[11px] text-slate-500">Sales workspace</p></div></div>
    <div className="px-4 pt-6"><p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p></div>
    <nav className="flex flex-1 flex-col gap-1 px-3 py-3">{LINKS.filter((link) => !link.fullAccessOnly || hasFullAccess).map((link) => { const active = pathname.startsWith(link.href); return <Link key={link.href} href={link.href} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><Icon name={link.icon} size={18} className={active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"} />{link.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />}</Link>; })}</nav>
    <div className="border-t border-slate-100 p-4"><div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4"><div className="flex items-center gap-2 text-blue-700"><Icon name="target" size={16} /><p className="text-xs font-semibold">Pipeline health</p></div><div className="mt-3 flex items-end justify-between"><p className="text-2xl font-semibold tracking-tight text-slate-900">92%</p><span className="text-[11px] font-medium text-emerald-600">Healthy</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full w-[92%] rounded-full bg-blue-600" /></div></div><p className="mt-4 px-1 text-[10px] text-slate-400">EICE CRM · v1.0</p></div>
  </aside>;
}

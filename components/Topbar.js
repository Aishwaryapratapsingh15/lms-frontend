"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ROLE_LABELS } from "@/lib/constants";
import { LINKS } from "@/components/Sidebar";
import Icon from "@/components/Icons";

export default function Topbar() {
  const { user, logout, hasFullAccess } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  function handleLogout() { logout(); router.replace("/login"); }
  return <><header className="sticky top-0 z-30 h-[72px] border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md md:px-7"><div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4">
    <div className="flex items-center gap-3 lg:hidden"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">EI</div><div className="hidden sm:block"><p className="text-sm font-semibold text-slate-900">EICE LeadFlow</p><p className="text-[10px] text-slate-500">Sales workspace</p></div></div>
    <div className="relative hidden w-full max-w-md lg:block"><Icon name="search" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-14 text-[13px] text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100" placeholder="Search leads, companies or team members" /><kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">⌘ K</kbd></div>
    <div className="flex items-center gap-2"><button aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><Icon name="bell" size={18} /><span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-white" /></button><div className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />{user && <div className="flex items-center gap-2.5 px-1.5 py-1"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-semibold text-white">{String(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}</div><div className="hidden text-left md:block"><p className="max-w-32 truncate text-xs font-semibold text-slate-800">{user.name ?? user.email}</p><p className="text-[10px] text-slate-500">{ROLE_LABELS[user.role] ?? user.role}</p></div></div>}<button onClick={handleLogout} aria-label="Log out" title="Log out" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Icon name="logout" size={17} /></button></div>
  </div></header><nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">{LINKS.filter((link) => !link.fullAccessOnly || hasFullAccess).map((link) => { const active = pathname.startsWith(link.href); return <Link key={link.href} href={link.href} className={`flex min-w-20 flex-col items-center gap-1 py-2 text-[10px] font-medium ${active ? "text-blue-600" : "text-slate-500"}`}><Icon name={link.icon} size={19} />{link.label}</Link>; })}</nav></>;
}

"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ROLE_LABELS } from "@/lib/constants";

export default function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 py-3">
      {user && (
        <span className="text-sm text-slate-600">
          {user.name ?? user.email}{" "}
          <span className="text-slate-400">— {ROLE_LABELS[user.role] ?? user.role}</span>
        </span>
      )}
      <button
        onClick={handleLogout}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Log out
      </button>
    </header>
  );
}

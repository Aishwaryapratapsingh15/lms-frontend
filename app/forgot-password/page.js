"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e) { e.preventDefault(); setBusy(true); setError(""); try { await forgotPassword(email); setMessage("If an account exists for that email, password reset instructions have been sent."); } catch (err) { if (err.status === 429) setError(`Too many requests. Try again ${err.retryAfter ? `after ${err.retryAfter} seconds` : "later"}.`); else setError(err.message || "Unable to submit request"); } finally { setBusy(false); } }
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-[var(--shadow-soft)]"><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Account recovery</p><h1 className="mt-2 text-2xl font-semibold text-slate-950">Forgot your password?</h1><p className="mt-2 text-sm text-slate-500">Enter your email and we’ll send reset instructions if an account matches.</p>{message ? <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : <form onSubmit={submit} className="mt-6 space-y-4"><div><label className="mb-1 block text-sm font-medium">Email</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100"/></div>{error && <p className="text-sm text-red-600">{error}</p>}<button disabled={busy} className="h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Sending…" : "Send reset instructions"}</button></form>}<Link href="/login" className="mt-6 inline-block text-sm font-semibold text-blue-600">← Back to sign in</Link></div></main>;
}

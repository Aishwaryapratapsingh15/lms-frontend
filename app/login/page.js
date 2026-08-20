"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Icon from "@/components/Icons";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(e) { e.preventDefault(); setError(""); setSubmitting(true); try { await login(email, password); router.replace("/dashboard"); } catch (err) { setError(err.message || "Login failed. Check your credentials."); } finally { setSubmitting(false); } }

  return <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_560px]">
    <section className="relative hidden overflow-hidden bg-[#f3f6fb] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[64px] border-blue-100/70"/><div className="absolute -bottom-52 left-1/3 h-[500px] w-[500px] rounded-full border-[80px] border-slate-200/60"/>
      <div className="relative flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-200">EI</div><div><p className="text-[15px] font-semibold text-slate-900">EICE LeadFlow</p><p className="text-[11px] text-slate-500">Sales workspace</p></div></div>
      <div className="relative max-w-xl"><span className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700"><span className="h-1.5 w-1.5 rounded-full bg-blue-500"/>Lead operations</span><h1 className="mt-6 text-4xl font-semibold leading-[1.18] tracking-tight text-slate-950 xl:text-5xl">One workspace to turn more leads into revenue.</h1><p className="mt-5 max-w-lg text-base leading-7 text-slate-600">Qualify opportunities, coordinate your team and keep every follow-up moving—without losing sight of the pipeline.</p>
        <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">{[["1.2k","Qualified leads"],["92%","Pipeline health"],["+18%","Conversion lift"]].map(([value,label])=><div key={label} className="border-l-2 border-blue-500 pl-4"><p className="text-2xl font-semibold text-slate-900">{value}</p><p className="mt-1 text-[11px] text-slate-500">{label}</p></div>)}</div>
      </div>
      <p className="relative text-[11px] text-slate-400">© 2026 EICE. Secure sales operations platform.</p>
    </section>
    <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">EI</div><p className="font-semibold text-slate-900">EICE LeadFlow</p></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Welcome back</p><h2 className="mt-2 text-[30px] font-semibold tracking-tight text-slate-950">Sign in to your account</h2><p className="mt-2 text-sm text-slate-500">Enter your credentials to access your workspace.</p></div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div><label htmlFor="email" className="mb-2 block text-xs font-semibold text-slate-700">Email address</label><div className="relative"><Icon name="mail" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100" placeholder="you@company.com"/></div></div>
          <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</label><button type="button" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">Forgot password?</button></div><input id="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100" placeholder="Enter your password"/></div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
          <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-blue-600"/>Remember me on this device</label>
          <button type="submit" disabled={submitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">{submitting ? "Signing in…" : "Sign in"}{!submitting && <Icon name="arrowRight" size={16}/>}</button>
        </form>
        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-400"><span>Protected with enterprise-grade security</span></div>
      </div>
    </section>
  </main>;
}

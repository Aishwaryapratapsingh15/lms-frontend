"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icons";
import { useAuth } from "@/lib/AuthContext";
import { listFormSubmissions } from "@/lib/api/formSubmissions";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function FormSubmissionsPage() {
  const { hasFullAccess } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasFullAccess) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    let active = true;
    listFormSubmissions()
      .then((data) => {
        if (active) setSubmissions(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load general enquiries");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasFullAccess]);

  const visibleSubmissions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return submissions;
    return submissions.filter((submission) =>
      [submission.name, submission.email, submission.contact, submission.service, submission.message]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query, submissions]);

  if (!hasFullAccess) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        This page is available to Admin and Super Admin users only.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">
            General enquiries
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Messages submitted through the OTP-verified general contact form.
          </p>
        </div>
        <span className="inline-flex self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          {visibleSubmissions.length} records
        </span>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-[var(--shadow-soft)]">
        <div className="relative w-full sm:max-w-sm">
          <Icon
            name="search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search enquiries..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400 shadow-sm">
          Loading general enquiries...
        </div>
      ) : visibleSubmissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          No general enquiries found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Visitor</th>
                  <th className="px-5 py-3.5 font-semibold">Contact</th>
                  <th className="px-5 py-3.5 font-semibold">Product / service</th>
                  <th className="min-w-[280px] px-5 py-3.5 font-semibold">Message</th>
                  <th className="whitespace-nowrap px-5 py-3.5 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleSubmissions.map((submission) => (
                  <tr key={submission.id} className="align-top transition hover:bg-blue-50/30">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{submission.name || "Website visitor"}</p>
                      <a className="mt-1 block text-[11px] text-blue-600 hover:underline" href={`mailto:${submission.email}`}>
                        {submission.email}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{submission.contact || "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{submission.service || "—"}</td>
                    <td className="px-5 py-4 text-sm leading-6 text-slate-600">
                      <p className="max-w-xl whitespace-pre-wrap break-words">{submission.message || "—"}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {dateFormatter.format(new Date(submission.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import RichTextEditor from "./RichTextEditor";

const FIELD_CLASS =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100";

const parseEmails = (value) =>
  value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "png", "jpg", "jpeg", "gif", "webp"];
const ACCEPT_ATTR = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const extensionOf = (filename) => filename.split(".").pop()?.toLowerCase() ?? "";

export default function EmailForm({ defaultToEmail, onSubmit }) {
  const [toEmail, setToEmail] = useState(defaultToEmail || "");
  const [ccEmails, setCcEmails] = useState("");
  const [bccEmails, setBccEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const editorRef = useRef(null);

  function handleAttachmentChange(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setError("");
    setAttachments((current) => {
      const merged = [...current, ...files];
      if (merged.length > MAX_ATTACHMENTS) {
        setError(`You can attach up to ${MAX_ATTACHMENTS} files`);
        return current;
      }
      const unsupported = files.find((file) => !ALLOWED_EXTENSIONS.includes(extensionOf(file.name)));
      if (unsupported) {
        setError(`"${unsupported.name}" is not a supported file type (PDF, Word, Excel, PowerPoint, PNG, JPG, GIF, WEBP only)`);
        return current;
      }
      const tooLarge = files.find((file) => file.size > MAX_ATTACHMENT_SIZE);
      if (tooLarge) {
        setError(`"${tooLarge.name}" exceeds the 10 MB attachment limit`);
        return current;
      }
      return merged;
    });
  }

  function removeAttachment(index) {
    setAttachments((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (editorRef.current?.isEmpty()) {
      setError("Message is required");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        toEmail,
        ccEmails: parseEmails(ccEmails),
        bccEmails: parseEmails(bccEmails),
        subject,
        body,
        attachments,
      });
      setSubject("");
      setBody("");
      editorRef.current?.clear();
      setCcEmails("");
      setBccEmails("");
      setAttachments([]);
    } catch (err) {
      setError(err.message || "Failed to send email");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">To *</label>
        <input
          required
          type="email"
          className={FIELD_CLASS}
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">CC</label>
          <input
            type="text"
            placeholder="comma-separated emails"
            className={FIELD_CLASS}
            value={ccEmails}
            onChange={(e) => setCcEmails(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">BCC</label>
          <input
            type="text"
            placeholder="comma-separated emails"
            className={FIELD_CLASS}
            value={bccEmails}
            onChange={(e) => setBccEmails(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Subject *</label>
        <input
          required
          className={FIELD_CLASS}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Message *</label>
        <RichTextEditor ref={editorRef} onChange={setBody} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Attachments</label>
        {attachments.length > 0 && (
          <ul className="mb-2 space-y-1">
            {attachments.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
              >
                <span className="truncate">{file.name} · {formatSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="ml-2 shrink-0 font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {attachments.length < MAX_ATTACHMENTS && (
          <input
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            onChange={handleAttachmentChange}
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
          />
        )}
        <p className="mt-1 text-[11px] text-slate-400">Up to {MAX_ATTACHMENTS} files, 10 MB each. PDF, Word, Excel, PowerPoint, PNG, JPG, GIF, WEBP only.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send email"}
      </button>
    </form>
  );
}

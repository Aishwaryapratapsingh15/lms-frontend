import Icon from "@/components/Icons";

export default function Modal({ title, description = "Enter the details below to continue.", onClose, children }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-[2px]">
    <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4"><div><h2 className="text-base font-semibold text-slate-900">{title}</h2>{description && <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>}</div><button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><Icon name="close" size={17}/></button></div>
      <div className="p-6">{children}</div>
    </div>
  </div>;
}

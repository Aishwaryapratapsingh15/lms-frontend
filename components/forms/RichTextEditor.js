"use client";

import { forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const TOOLBAR_BTN =
  "rounded px-2 py-1 text-xs font-semibold transition disabled:opacity-30";

const RichTextEditor = forwardRef(function RichTextEditor(
  { onChange, placeholder },
  ref,
) {
  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] px-3 py-2.5 text-sm outline-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:my-1",
        "data-placeholder": placeholder || "",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  useImperativeHandle(ref, () => ({
    clear: () => editor?.commands.clearContent(),
    isEmpty: () => editor?.isEmpty ?? true,
  }));

  if (!editor) return null;

  const toolbarBtnClass = (active) =>
    `${TOOLBAR_BTN} ${active ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-200"}`;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-3 focus-within:ring-blue-100">
      <div className="flex gap-1 border-b border-slate-200 p-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={toolbarBtnClass(editor.isActive("bold"))}
          aria-label="Bold"
          aria-pressed={editor.isActive("bold")}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={toolbarBtnClass(editor.isActive("italic"))}
          aria-label="Italic"
          aria-pressed={editor.isActive("italic")}
        >
          <i>I</i>
        </button>
        <span className="mx-1 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toolbarBtnClass(editor.isActive("bulletList"))}
          aria-label="Bullet list"
          aria-pressed={editor.isActive("bulletList")}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toolbarBtnClass(editor.isActive("orderedList"))}
          aria-label="Numbered list"
          aria-pressed={editor.isActive("orderedList")}
        >
          1. List
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichTextEditor;

"use client";

import { type Editor, useEditorState } from "@tiptap/react";

type BlockType = "paragraph" | "h1" | "h2" | "h3";

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep focus (and the text selection) inside the editor when clicking a button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-8 min-w-8 rounded px-2 text-sm transition-colors disabled:opacity-40 ${
        active ? "bg-blue-100 text-blue-700" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-6 w-px bg-slate-200" />;

const ArrowIcon = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mx-auto h-4 w-4"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

export function Toolbar({ editor }: { editor: Editor }) {
  // Re-render the toolbar only when these values change.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockType: (editor.isActive("heading", { level: 1 })
        ? "h1"
        : editor.isActive("heading", { level: 2 })
          ? "h2"
          : editor.isActive("heading", { level: 3 })
            ? "h3"
            : "paragraph") as BlockType,
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  function setBlockType(type: BlockType) {
    const chain = editor.chain().focus();
    if (type === "paragraph") chain.setParagraph().run();
    else chain.setHeading({ level: Number(type[1]) as 1 | 2 | 3 }).run();
  }

  return (
    <div className="border-t border-slate-100 bg-white">
      <div
        role="toolbar"
        aria-label="Formatting"
        className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-2"
      >
        <ToolbarButton label="Undo" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <ArrowIcon d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <ArrowIcon d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
        </ToolbarButton>
        <Divider />

        <select
          aria-label="Text style"
          value={state.blockType}
          onChange={(e) => setBlockType(e.target.value as BlockType)}
          className="h-8 rounded border border-slate-200 bg-white px-2 text-sm"
        >
          <option value="paragraph">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <Divider />

        <ToolbarButton label="Bold" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton label="Italic" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={state.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <Divider />

        <ToolbarButton
          label="Bulleted list"
          active={state.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={state.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
      </div>
    </div>
  );
}

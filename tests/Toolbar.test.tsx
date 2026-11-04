import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { Toolbar } from "@/components/editor/Toolbar";
import { editorExtensions } from "@/lib/editor";

/** A real Tiptap editor with our toolbar, the same way the document page uses it. */
function TestEditor({ onReady }: { onReady: (editor: Editor) => void }) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: "<p>Hello world</p>",
    immediatelyRender: true,
  });

  useEffect(() => {
    if (editor) onReady(editor);
  }, [editor, onReady]);

  if (!editor) return null;
  return (
    <>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
}

async function setup() {
  let editor: Editor | null = null;
  render(<TestEditor onReady={(e) => (editor = e)} />);
  await waitFor(() => expect(editor).not.toBeNull());

  // Select the words "Hello world" (positions 1 to 12), like a user dragging over the text.
  act(() => {
    editor!.commands.setTextSelection({ from: 1, to: 12 });
  });
  return { user: userEvent.setup(), editor: editor! };
}

describe("Toolbar", () => {
  it("toggles bold, italic and underline on the selected text", async () => {
    const { user, editor } = await setup();

    await user.click(screen.getByRole("button", { name: "Bold" }));
    await user.click(screen.getByRole("button", { name: "Italic" }));
    await user.click(screen.getByRole("button", { name: "Underline" }));

    expect(editor.getHTML()).toBe("<p><strong><em><u>Hello world</u></em></strong></p>");
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(editor.isActive("bold")).toBe(false);
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "false");
  });

  // StarterKit adds an empty trailing paragraph after block nodes, so we check how the HTML starts.
  it("switches between headings and normal text", async () => {
    const { user, editor } = await setup();
    const select = screen.getByRole("combobox", { name: "Text style" });

    await user.selectOptions(select, "h2");
    expect(editor.getHTML()).toMatch(/^<h2>Hello world<\/h2>/);
    expect(select).toHaveValue("h2");

    await user.selectOptions(select, "paragraph");
    expect(editor.getHTML()).toMatch(/^<p>Hello world<\/p>/);
    expect(select).toHaveValue("paragraph");
  });

  it("creates bulleted and numbered lists", async () => {
    const { user, editor } = await setup();

    await user.click(screen.getByRole("button", { name: "Bulleted list" }));
    expect(editor.getHTML()).toMatch(/^<ul><li><p>Hello world<\/p><\/li><\/ul>/);
    expect(screen.getByRole("button", { name: "Bulleted list" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Numbered list" }));
    expect(editor.getHTML()).toMatch(/^<ol><li><p>Hello world<\/p><\/li><\/ol>/);
  });

  it("enables undo after a change and undoes it", async () => {
    const { user, editor } = await setup();
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Bold" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(editor.getHTML()).toBe("<p>Hello world</p>");
  });
});

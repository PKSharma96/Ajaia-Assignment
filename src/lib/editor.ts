import StarterKit from "@tiptap/starter-kit";

/**
 * StarterKit gives us bold, italic, underline, headings, lists, links, undo/redo and more.
 * The backend converts imported files with the same StarterKit, so both sides share one schema.
 */
export const editorExtensions = [StarterKit.configure({ link: { openOnClick: false } })];

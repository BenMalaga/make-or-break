/**
 * `<Notes />` in lesson MDX. Notes now live in the always-on-screen FloatingNotes
 * panel (mounted at the lesson-page level), so the inline block at the bottom of
 * the lesson renders nothing. Kept as a no-op so existing `<Notes />` tags in
 * every lesson file need no edit.
 */
export function LessonNotes() {
  return null;
}

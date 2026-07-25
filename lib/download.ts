/**
 * Save a string to the user's computer as a file. Client-only (uses a Blob URL
 * and a synthetic anchor click). Used by the Build IDE and the challenge editor
 * to export code as a real .py / .js / .c / ... file.
 */
export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

import { createHash } from "node:crypto";

/**
 * Canonicalize + SHA-256 a flag string. Used both by the seed (to store
 * Flag.hash) and by the submit action (to validate). Never store plaintext.
 *
 * Canonicalization: trim + lowercase, so casing/whitespace slips don't
 * frustrate a correct capture. Keep flag values case-insensitive when authoring.
 */
export function hashFlag(raw: string, salt = ""): string {
  const canonical = raw.trim().toLowerCase();
  return createHash("sha256").update(salt + canonical).digest("hex");
}

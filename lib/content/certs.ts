import fs from "node:fs";
import path from "node:path";

/**
 * Loads certification definitions + question banks from content/certs/.
 * SERVER ONLY. cert.json holds metadata + domains; questions/*.json hold the
 * question arrays. The seed upserts these into the DB.
 */

const CERTS_DIR = path.join(process.cwd(), "content", "certs");

export interface CertDomainDef {
  number: number;
  name: string;
  weight: number;
}

export interface CertDef {
  slug: string;
  code: string;
  name: string;
  vendor: string;
  description: string;
  passScore: number;
  examMinutes: number;
  questionCount: number;
  icon?: string;
  order?: number;
  domains: CertDomainDef[];
}

export interface QuestionDef {
  domain: number;
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
}

export interface LoadedCert {
  cert: CertDef;
  questions: QuestionDef[];
}

export function listCerts(): LoadedCert[] {
  if (!fs.existsSync(CERTS_DIR)) return [];
  const out: LoadedCert[] = [];
  for (const entry of fs.readdirSync(CERTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const certJson = path.join(CERTS_DIR, entry.name, "cert.json");
    if (!fs.existsSync(certJson)) continue;

    const cert = JSON.parse(fs.readFileSync(certJson, "utf8")) as CertDef;

    const questions: QuestionDef[] = [];
    const qDir = path.join(CERTS_DIR, entry.name, "questions");
    if (fs.existsSync(qDir)) {
      for (const f of fs.readdirSync(qDir)) {
        if (!f.endsWith(".json")) continue;
        try {
          const arr = JSON.parse(fs.readFileSync(path.join(qDir, f), "utf8"));
          if (Array.isArray(arr)) questions.push(...arr);
        } catch {
          console.warn(`  ! bad question JSON: ${entry.name}/questions/${f}`);
        }
      }
    }
    out.push({ cert, questions });
  }
  return out;
}

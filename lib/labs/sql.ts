/**
 * A tiny, safe evaluator for a SQL WHERE clause. It exists so a SQL injection
 * lab can be genuinely vulnerable: the classic payloads actually work because
 * the logic is really evaluated, not string-matched. It is NOT a real database
 * and never touches one. Everything runs in the browser against fixed rows.
 *
 * Supported, on purpose, is exactly enough to demonstrate auth bypass:
 * string and number literals, column names, `=`, AND, OR (with AND binding
 * tighter), parentheses, and `--` line comments.
 */

export type Row = Record<string, string | number>;

type Tok =
  | { t: "str"; v: string }
  | { t: "num"; v: string }
  | { t: "ident"; v: string }
  | { t: "op"; v: string }
  | { t: "kw"; v: "AND" | "OR" }
  | { t: "lparen" }
  | { t: "rparen" };

function tokenize(input: string): Tok[] {
  // A `--` comment removes the rest of the line, just like SQL. This is what
  // makes `admin' --` work.
  const commentAt = input.indexOf("--");
  const s = commentAt >= 0 ? input.slice(0, commentAt) : input;

  const toks: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t" || c === "\n") {
      i++;
    } else if (c === "'") {
      let j = i + 1;
      let val = "";
      while (j < s.length && s[j] !== "'") {
        val += s[j];
        j++;
      }
      toks.push({ t: "str", v: val });
      i = j + 1; // skip closing quote (or end of input if unterminated)
    } else if (c === "(") {
      toks.push({ t: "lparen" });
      i++;
    } else if (c === ")") {
      toks.push({ t: "rparen" });
      i++;
    } else if (c === "=") {
      toks.push({ t: "op", v: "=" });
      i++;
    } else if (/[0-9]/.test(c)) {
      let j = i;
      let val = "";
      while (j < s.length && /[0-9.]/.test(s[j])) {
        val += s[j];
        j++;
      }
      toks.push({ t: "num", v: val });
      i = j;
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i;
      let val = "";
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) {
        val += s[j];
        j++;
      }
      const up = val.toUpperCase();
      if (up === "AND" || up === "OR") toks.push({ t: "kw", v: up });
      else toks.push({ t: "ident", v: val });
      i = j;
    } else {
      i++; // ignore anything else, so odd input degrades instead of crashing
    }
  }
  return toks;
}

class WhereEval {
  private pos = 0;
  constructor(private toks: Tok[], private row: Row) {}

  private peek(): Tok | undefined {
    return this.toks[this.pos];
  }
  private take(): Tok | undefined {
    return this.toks[this.pos++];
  }

  eval(): boolean {
    if (this.toks.length === 0) return true; // empty WHERE matches everything
    return this.parseOr();
  }

  private parseOr(): boolean {
    let left = this.parseAnd();
    while (this.peek()?.t === "kw" && (this.peek() as { v: string }).v === "OR") {
      this.take();
      const right = this.parseAnd();
      left = left || right;
    }
    return left;
  }

  private parseAnd(): boolean {
    let left = this.parseCmp();
    while (this.peek()?.t === "kw" && (this.peek() as { v: string }).v === "AND") {
      this.take();
      const right = this.parseCmp();
      left = left && right;
    }
    return left;
  }

  private parseCmp(): boolean {
    if (this.peek()?.t === "lparen") {
      this.take();
      const v = this.parseOr();
      if (this.peek()?.t === "rparen") this.take();
      return v;
    }
    const left = this.parseOperand();
    if (this.peek()?.t === "op") {
      this.take();
      const right = this.parseOperand();
      return String(left) === String(right);
    }
    return false; // a bare operand is not a valid condition here
  }

  private parseOperand(): string | number | undefined {
    const t = this.peek();
    if (!t) return undefined;
    if (t.t === "str") {
      this.take();
      return t.v;
    }
    if (t.t === "num") {
      this.take();
      return t.v;
    }
    if (t.t === "ident") {
      this.take();
      return this.row[t.v.toLowerCase()] ?? this.row[t.v];
    }
    return undefined;
  }
}

export interface QueryResult {
  query: string;
  matched: Row | null;
  error: string | null;
}

/**
 * Run a vulnerable login query built by naive string concatenation, exactly the
 * bug the lab teaches. Returns the query text (to show the learner), the first
 * matching row, and any error.
 */
export function runLogin(rows: Row[], username: string, password: string): QueryResult {
  const where = `username = '${username}' AND password = '${password}'`;
  const query = `SELECT * FROM users WHERE ${where}`;
  try {
    const toks = tokenize(where);
    for (const row of rows) {
      const norm: Row = {};
      for (const [k, v] of Object.entries(row)) norm[k.toLowerCase()] = v;
      if (new WhereEval(toks, norm).eval()) return { query, matched: row, error: null };
    }
    return { query, matched: null, error: null };
  } catch {
    return { query, matched: null, error: "SQL syntax error" };
  }
}

// A small, browser-based PowerShell interpreter for the Build IDE. It runs a
// common, teachable subset of PowerShell 7 entirely client-side, with no network
// and no real system access: variables, arithmetic, string interpolation,
// comparison and logical operators, arrays, ranges, indexing, if/elseif/else,
// for/foreach/while, functions, and pipelines with the workhorse cmdlets
// (ForEach-Object, Where-Object, Select-Object, Sort-Object, Measure-Object)
// plus a handful of read-only cmdlets against a fixed virtual filesystem and a
// fixed fake process list. It is a practice environment, not a Windows install;
// anything outside the subset returns a clear "not supported here" message.

import type { RunOutput } from "./run";

// ---- Values ---------------------------------------------------------------

type PSObject = { __ps: true; type: string; props: Record<string, unknown> };
type Value = number | string | boolean | null | Value[] | PSObject;

function isPSObject(v: unknown): v is PSObject {
  return typeof v === "object" && v !== null && (v as PSObject).__ps === true;
}
function psObject(type: string, props: Record<string, unknown>): PSObject {
  return { __ps: true, type, props };
}

// ---- Tokenizer ------------------------------------------------------------

type Tok = { t: string; v: string };
const OPERATORS = new Set([
  "eq", "ne", "gt", "lt", "ge", "le", "like", "notlike", "match", "contains", "in", "notin",
]);
const LOGICALS = new Set(["and", "or", "not", "xor"]);

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const n = src.length;
  const isWordStart = (c: string) => /[A-Za-z_]/.test(c);
  const isWord = (c: string) => /[A-Za-z0-9_]/.test(c);

  while (i < n) {
    const c = src[i];
    if (c === "#") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "`" && src[i + 1] === "\n") { i += 2; continue; } // line continuation
    if (c === "\n" || c === ";") {
      if (toks.length && toks[toks.length - 1].t !== "nl") toks.push({ t: "nl", v: "\n" });
      i++;
      continue;
    }
    if (c === " " || c === "\t" || c === "\r") { i++; continue; }

    // strings
    if (c === '"' || c === "'") {
      const quote = c;
      let s = "";
      i++;
      while (i < n && src[i] !== quote) {
        if (src[i] === "`" && quote === '"') { s += src[i] + src[i + 1]; i += 2; continue; }
        s += src[i++];
      }
      i++; // closing quote
      toks.push({ t: quote === '"' ? "dstr" : "sstr", v: s });
      continue;
    }

    // variables
    if (c === "$") {
      if (src[i + 1] === "(") { toks.push({ t: "subexpr", v: "$(" }); i += 2; continue; }
      let name = "";
      i++;
      if (src[i] === "_") { name = "_"; i++; }
      else while (i < n && isWord(src[i])) name += src[i++];
      toks.push({ t: "var", v: name });
      continue;
    }

    // numbers (stop before a range ..)
    if (/[0-9]/.test(c)) {
      let num = "";
      while (i < n && /[0-9]/.test(src[i])) num += src[i++];
      if (src[i] === "." && src[i + 1] !== ".") {
        num += src[i++];
        while (i < n && /[0-9]/.test(src[i])) num += src[i++];
      }
      toks.push({ t: "num", v: num });
      continue;
    }

    // range
    if (c === "." && src[i + 1] === ".") { toks.push({ t: "range", v: ".." }); i += 2; continue; }

    // dash-words: operators, logicals, or parameters
    if (c === "-") {
      if (isWordStart(src[i + 1])) {
        let w = "";
        i++;
        while (i < n && isWord(src[i])) w += src[i++];
        const lw = w.toLowerCase();
        if (OPERATORS.has(lw)) toks.push({ t: "cmp", v: lw });
        else if (LOGICALS.has(lw)) toks.push({ t: "logic", v: lw });
        else toks.push({ t: "param", v: w });
        continue;
      }
      // otherwise a minus (subtraction / negation)
      toks.push({ t: "op", v: "-" });
      i++;
      continue;
    }

    // barewords: cmdlet names (allow internal hyphen between letters) and keywords
    if (isWordStart(c)) {
      let w = "";
      while (i < n && (isWord(src[i]) || (src[i] === "-" && isWordStart(src[i + 1])))) w += src[i++];
      toks.push({ t: "word", v: w });
      continue;
    }

    if ("+*/%".includes(c)) { toks.push({ t: "op", v: c }); i++; continue; }
    if (c === "=") { toks.push({ t: "assign", v: "=" }); i++; continue; }
    if (c === "|") { toks.push({ t: "pipe", v: "|" }); i++; continue; }
    if (c === ",") { toks.push({ t: "comma", v: "," }); i++; continue; }
    if (c === ".") { toks.push({ t: "dot", v: "." }); i++; continue; }
    if (c === "(") { toks.push({ t: "lparen", v: "(" }); i++; continue; }
    if (c === ")") { toks.push({ t: "rparen", v: ")" }); i++; continue; }
    if (c === "{") { toks.push({ t: "lbrace", v: "{" }); i++; continue; }
    if (c === "}") { toks.push({ t: "rbrace", v: "}" }); i++; continue; }
    if (c === "[") { toks.push({ t: "lbracket", v: "[" }); i++; continue; }
    if (c === "]") { toks.push({ t: "rbracket", v: "]" }); i++; continue; }
    if (c === "@" && src[i + 1] === "(") { toks.push({ t: "arropen", v: "@(" }); i += 2; continue; }
    if (c === "@" && src[i + 1] === "{") { toks.push({ t: "hashopen", v: "@{" }); i += 2; continue; }

    throw new Error(`Unexpected character '${c}'`);
  }
  toks.push({ t: "eof", v: "" });
  return toks;
}

// ---- Parser ---------------------------------------------------------------
// Produces a light AST of plain objects. Kept intentionally small.

class Parser {
  toks: Tok[];
  p = 0;
  constructor(toks: Tok[]) { this.toks = toks; }
  peek(o = 0) { return this.toks[this.p + o]; }
  next() { return this.toks[this.p++]; }
  at(t: string) { return this.peek().t === t; }
  atWord(w: string) { return this.at("word") && this.peek().v.toLowerCase() === w; }
  eat(t: string) {
    if (!this.at(t)) throw new Error(`Expected ${t} but found '${this.peek().v || this.peek().t}'`);
    return this.next();
  }
  skipNl() { while (this.at("nl")) this.next(); }

  parseProgram(): any[] {
    const stmts: any[] = [];
    this.skipNl();
    while (!this.at("eof")) {
      stmts.push(this.parseStatement());
      this.skipNl();
    }
    return stmts;
  }

  parseBlock(): any[] {
    this.eat("lbrace");
    const stmts: any[] = [];
    this.skipNl();
    while (!this.at("rbrace") && !this.at("eof")) {
      stmts.push(this.parseStatement());
      this.skipNl();
    }
    this.eat("rbrace");
    return stmts;
  }

  parseStatement(): any {
    if (this.atWord("if")) return this.parseIf();
    if (this.atWord("for")) return this.parseFor();
    if (this.atWord("foreach")) return this.parseForeach();
    if (this.atWord("while")) return this.parseWhile();
    if (this.atWord("function")) return this.parseFunction();
    if (this.atWord("param")) return this.parseParam();
    if (this.atWord("return")) { this.next(); const e = this.at("nl") || this.at("rbrace") || this.at("eof") ? null : this.parsePipeline(); return { k: "return", e }; }
    if (this.atWord("break")) { this.next(); return { k: "break" }; }
    if (this.atWord("continue")) { this.next(); return { k: "continue" }; }
    // assignment and increment on a variable or one of its elements/members
    if (this.at("var")) {
      const save = this.p;
      const name = this.next().v;
      const isPlusAssign = () => this.at("op") && this.peek().v === "+" && this.peek(1)?.t === "assign";
      const isMinusAssign = () => this.at("op") && this.peek().v === "-" && this.peek(1)?.t === "assign";
      const isIncr = () => this.at("op") && this.peek().v === "+" && this.peek(1)?.t === "op" && this.peek(1)?.v === "+";
      const isDecr = () => this.at("op") && this.peek().v === "-" && this.peek(1)?.t === "op" && this.peek(1)?.v === "-";
      if (this.at("assign")) { this.next(); return { k: "assign", name, e: this.parsePipeline() }; }
      if (isPlusAssign()) { this.next(); this.next(); return { k: "assign", name, e: { k: "bin", op: "+", l: { k: "var", name }, r: this.parsePipeline() } }; }
      if (isMinusAssign()) { this.next(); this.next(); return { k: "assign", name, e: { k: "bin", op: "-", l: { k: "var", name }, r: this.parsePipeline() } }; }
      if (isIncr()) { this.next(); this.next(); return { k: "assign", name, e: { k: "bin", op: "+", l: { k: "var", name }, r: { k: "num", v: 1 } } }; }
      if (isDecr()) { this.next(); this.next(); return { k: "assign", name, e: { k: "bin", op: "-", l: { k: "var", name }, r: { k: "num", v: 1 } } }; }
      if (this.at("lbracket") || this.at("dot")) {
        let target: any = { k: "var", name };
        while (this.at("lbracket") || this.at("dot")) {
          if (this.at("lbracket")) { this.next(); const idx = this.parseExpr(); this.eat("rbracket"); target = { k: "index", e: target, idx }; }
          else { this.next(); const nm = this.eat("word").v; target = { k: "member", target, name: nm }; }
        }
        if (this.at("assign")) { this.next(); return { k: "assignTo", target, e: this.parsePipeline() }; }
        if (this.at("op") && (this.peek().v === "+" || this.peek().v === "-") && this.peek(1)?.t === "assign") {
          const op = this.next().v; this.next();
          return { k: "assignTo", target, e: { k: "bin", op, l: target, r: this.parsePipeline() } };
        }
      }
      this.p = save;
    }
    return { k: "expr", e: this.parsePipeline() };
  }

  parseIf(): any {
    this.next(); // if
    this.eat("lparen");
    const cond = this.parseExpr();
    this.eat("rparen");
    this.skipNl();
    const body = this.parseBlock();
    const clauses = [{ cond, body }];
    let elseBody: any[] | null = null;
    this.skipNl();
    while (this.atWord("elseif")) {
      this.next(); this.eat("lparen");
      const c = this.parseExpr(); this.eat("rparen"); this.skipNl();
      clauses.push({ cond: c, body: this.parseBlock() });
      this.skipNl();
    }
    if (this.atWord("else")) { this.next(); this.skipNl(); elseBody = this.parseBlock(); }
    return { k: "if", clauses, elseBody };
  }

  parseFor(): any {
    this.next(); this.eat("lparen");
    const init = this.at("var") ? this.parseStatement() : null;
    this.eat("nl");
    const cond = this.parseExpr();
    this.eat("nl");
    const step = this.parseStatement();
    this.eat("rparen"); this.skipNl();
    const body = this.parseBlock();
    return { k: "for", init, cond, step, body };
  }

  parseForeach(): any {
    this.next(); this.eat("lparen");
    const varName = this.eat("var").v;
    if (!this.atWord("in")) throw new Error("Expected 'in' in foreach");
    this.next();
    const coll = this.parseExpr();
    this.eat("rparen"); this.skipNl();
    const body = this.parseBlock();
    return { k: "foreach", varName, coll, body };
  }

  parseWhile(): any {
    this.next(); this.eat("lparen");
    const cond = this.parseExpr(); this.eat("rparen"); this.skipNl();
    return { k: "while", cond, body: this.parseBlock() };
  }

  parseParam(): any {
    this.next(); // param
    this.eat("lparen");
    const names: string[] = [];
    while (!this.at("rparen") && !this.at("eof")) {
      if (this.at("lbracket")) { this.next(); if (this.at("word")) this.next(); this.eat("rbracket"); } // skip a type like [int]
      if (this.at("var")) names.push(this.next().v);
      else if (!this.at("comma") && !this.at("rparen")) this.next(); // skip a default value
      if (this.at("comma")) this.next();
    }
    this.eat("rparen");
    return { k: "param", names };
  }

  parseFunction(): any {
    this.next();
    const name = this.eat("word").v;
    let params: string[] = [];
    this.skipNl();
    // optional param(...) right after the name
    if (this.at("lparen")) {
      this.next();
      while (!this.at("rparen")) { if (this.at("var")) params.push(this.next().v); else this.next(); }
      this.eat("rparen");
    }
    this.skipNl();
    const body = this.parseBlock();
    // support: function f { param($a,$b) ... }
    if (body[0] && body[0].k === "param") { params = body[0].names; body.shift(); }
    return { k: "func", name, params, body };
  }

  // a pipeline is one or more stages separated by |
  parsePipeline(): any {
    const stages = [this.parseStage()];
    while (this.at("pipe")) { this.next(); this.skipNl(); stages.push(this.parseStage()); }
    if (stages.length === 1) return stages[0];
    return { k: "pipeline", stages };
  }

  // a stage is either a command (bareword in command position) or an expression
  parseStage(): any {
    if (this.at("word") && !this.isKeyword(this.peek().v)) return this.parseCommand();
    return this.parseCommaExpr();
  }

  isKeyword(w: string) {
    return ["if", "elseif", "else", "for", "foreach", "while", "function", "in", "return", "break", "continue"].includes(w.toLowerCase());
  }

  parseCommand(): any {
    const name = this.next().v;
    const args: any[] = [];
    while (!this.at("nl") && !this.at("pipe") && !this.at("rbrace") && !this.at("eof") && !this.at("rparen")) {
      if (this.at("param")) {
        const pname = this.next().v;
        // a switch param (no value) if next is another param/pipe/nl
        if (this.at("nl") || this.at("pipe") || this.at("param") || this.at("rbrace") || this.at("eof") || this.at("rparen")) {
          args.push({ k: "switch", name: pname });
        } else {
          args.push({ k: "namedarg", name: pname, value: this.parseUnary() });
        }
      } else if (this.at("lbrace")) {
        args.push({ k: "block", body: this.parseBlock() });
      } else if (this.at("dot") || this.at("range")) {
        // a lone . or .. is a path argument (current / parent directory)
        args.push({ k: "posarg", value: { k: "str", v: this.next().t === "range" ? ".." : ".", interp: false } });
      } else if (this.at("word")) {
        // a bareword in argument position is a string (a property name or literal),
        // not a nested command (so `Sort-Object CPU` sorts by the CPU property)
        args.push({ k: "posarg", value: { k: "str", v: this.next().v, interp: false } });
      } else {
        args.push({ k: "posarg", value: this.parseUnary() });
      }
    }
    return { k: "command", name, args };
  }

  // comma builds an array: 1, 2, 3
  parseCommaExpr(): any {
    const first = this.parseExpr();
    if (!this.at("comma")) return first;
    const items = [first];
    while (this.at("comma")) { this.next(); this.skipNl(); items.push(this.parseExpr()); }
    return { k: "array", items };
  }

  // precedence: logical < comparison < range < additive < multiplicative < unary < postfix < primary
  parseExpr(): any { return this.parseLogic(); }
  parseLogic(): any {
    let l = this.parseCompare();
    while (this.at("logic") && this.peek().v !== "not") {
      const op = this.next().v;
      l = { k: "logic", op, l, r: this.parseCompare() };
    }
    return l;
  }
  parseCompare(): any {
    let l = this.parseRange();
    while (this.at("cmp")) { const op = this.next().v; l = { k: "cmp", op, l, r: this.parseRange() }; }
    return l;
  }
  parseRange(): any {
    let l = this.parseAdd();
    if (this.at("range")) { this.next(); return { k: "range", l, r: this.parseAdd() }; }
    return l;
  }
  parseAdd(): any {
    let l = this.parseMul();
    while (this.at("op") && (this.peek().v === "+" || this.peek().v === "-")) {
      const op = this.next().v; l = { k: "bin", op, l, r: this.parseMul() };
    }
    return l;
  }
  parseMul(): any {
    let l = this.parseUnary();
    while (this.at("op") && ["*", "/", "%"].includes(this.peek().v)) {
      const op = this.next().v; l = { k: "bin", op, l, r: this.parseUnary() };
    }
    return l;
  }
  parseUnary(): any {
    if (this.at("op") && this.peek().v === "-") { this.next(); return { k: "neg", e: this.parseUnary() }; }
    if (this.at("logic") && this.peek().v === "not") { this.next(); return { k: "not", e: this.parseUnary() }; }
    return this.parsePostfix();
  }
  parsePostfix(): any {
    let e = this.parsePrimary();
    for (;;) {
      if (this.at("lbracket")) { this.next(); const idx = this.parseExpr(); this.eat("rbracket"); e = { k: "index", e, idx }; }
      else if (this.at("dot")) {
        this.next();
        const name = this.at("word") ? this.next().v : this.eat("word").v;
        if (this.at("lparen")) {
          this.next(); const cargs: any[] = [];
          while (!this.at("rparen")) { cargs.push(this.parseExpr()); if (this.at("comma")) this.next(); }
          this.eat("rparen");
          e = { k: "method", target: e, name, args: cargs };
        } else e = { k: "member", target: e, name };
      } else break;
    }
    return e;
  }
  parsePrimary(): any {
    const tk = this.peek();
    if (tk.t === "num") { this.next(); return { k: "num", v: parseFloat(tk.v) }; }
    if (tk.t === "sstr") { this.next(); return { k: "str", v: tk.v, interp: false }; }
    if (tk.t === "dstr") { this.next(); return { k: "str", v: tk.v, interp: true }; }
    if (tk.t === "var") { this.next(); return { k: "var", name: tk.v }; }
    if (tk.t === "subexpr") { this.next(); const e = this.parsePipeline(); this.eat("rparen"); return e; }
    if (tk.t === "lparen") { this.next(); const e = this.parseCommaExpr(); this.eat("rparen"); return e; }
    if (tk.t === "arropen") {
      this.next(); this.skipNl();
      const items: any[] = [];
      while (!this.at("rparen") && !this.at("eof")) {
        items.push(this.parseExpr());
        if (this.at("comma") || this.at("nl")) this.next();
        this.skipNl();
      }
      this.eat("rparen");
      return { k: "array", items };
    }
    if (tk.t === "hashopen") {
      this.next(); this.skipNl();
      const pairs: any[] = [];
      while (!this.at("rbrace") && !this.at("eof")) {
        const key = this.at("word") ? this.next().v : this.at("sstr") || this.at("dstr") ? this.next().v : this.eat("word").v;
        this.eat("assign");
        pairs.push({ key, value: this.parseExpr() });
        if (this.at("nl") || this.at("comma")) this.next();
        this.skipNl();
      }
      this.eat("rbrace");
      return { k: "hash", pairs };
    }
    if (tk.t === "lbrace") { return { k: "block", body: this.parseBlock() }; }
    // a bareword used as a value (e.g. a cmdlet with no pipeline input, or a bare string)
    if (tk.t === "word") { return this.parseCommand(); }
    if (tk.t === "lbracket") {
      // a type literal like [math]::Sqrt(...) -> support [math] and [Math]
      this.next(); const name = this.eat("word").v; this.eat("rbracket");
      return { k: "type", name };
    }
    throw new Error(`Unexpected '${tk.v || tk.t}'`);
  }
}

// ---- Interpreter ----------------------------------------------------------

class BreakSignal { }
class ContinueSignal { }
class ReturnSignal { constructor(public value: Value) { } }

const VFS = [
  { Name: "notes.txt", Length: 84, Type: "File" },
  { Name: "budget.csv", Length: 512, Type: "File" },
  { Name: "readme.md", Length: 240, Type: "File" },
  { Name: "photos", Length: 0, Type: "Directory" },
  { Name: "scripts", Length: 0, Type: "Directory" },
];
const FILE_CONTENT: Record<string, string> = {
  "notes.txt": "buy milk\ncall Dana\nship the order",
  "readme.md": "# Project\nA sample folder for practice.",
};
const PROCS = [
  { Name: "pwsh", Id: 1042, CPU: 12.5 },
  { Name: "code", Id: 2210, CPU: 88.2 },
  { Name: "chrome", Id: 3391, CPU: 143.7 },
  { Name: "node", Id: 4102, CPU: 5.1 },
  { Name: "explorer", Id: 900, CPU: 22.0 },
];

class Interp {
  out: string[] = [];
  vars: Record<string, Value> = {};
  funcs: Record<string, { params: string[]; body: any[] }> = {};

  run(stmts: any[]) {
    for (const s of stmts) this.exec(s);
  }

  emit(v: Value) {
    for (const line of formatValue(v)) this.out.push(line);
  }

  exec(s: any): void {
    switch (s.k) {
      case "assign": this.vars[s.name] = this.eval(s.e); return;
      case "assignTo": this.assignTo(s.target, this.eval(s.e)); return;
      case "expr": {
        const v = this.eval(s.e);
        if (v !== undefined && v !== null && !(s.e.k === "assign")) this.emit(v);
        return;
      }
      case "if": {
        for (const c of s.clauses) if (truthy(this.eval(c.cond))) return this.run(c.body);
        if (s.elseBody) this.run(s.elseBody);
        return;
      }
      case "for": {
        if (s.init) this.exec(s.init);
        let guard = 0;
        while (truthy(this.eval(s.cond))) {
          if (guard++ > 100000) throw new Error("loop ran too long (over 100000 iterations)");
          try { this.run(s.body); } catch (e) { if (e instanceof BreakSignal) break; if (!(e instanceof ContinueSignal)) throw e; }
          this.exec(s.step);
        }
        return;
      }
      case "foreach": {
        const coll = toArray(this.eval(s.coll));
        for (const item of coll) {
          this.vars[s.varName] = item;
          try { this.run(s.body); } catch (e) { if (e instanceof BreakSignal) break; if (!(e instanceof ContinueSignal)) throw e; }
        }
        return;
      }
      case "while": {
        let guard = 0;
        while (truthy(this.eval(s.cond))) {
          if (guard++ > 100000) throw new Error("loop ran too long (over 100000 iterations)");
          try { this.run(s.body); } catch (e) { if (e instanceof BreakSignal) break; if (!(e instanceof ContinueSignal)) throw e; }
        }
        return;
      }
      case "func": this.funcs[s.name.toLowerCase()] = { params: s.params, body: s.body }; return;
      case "param": return; // parameter declaration is a no-op at run time
      case "return": throw new ReturnSignal(s.e ? this.eval(s.e) : null);
      case "break": throw new BreakSignal();
      case "continue": throw new ContinueSignal();
      default: { const v = this.eval(s); if (v !== undefined && v !== null) this.emit(v); }
    }
  }

  assignTo(target: any, value: Value): void {
    if (target.k === "var") { this.vars[target.name] = value; return; }
    if (target.k === "index") {
      const base = this.eval(target.e);
      const idx = this.eval(target.idx);
      if (Array.isArray(base)) { const j = num(idx) < 0 ? base.length + num(idx) : num(idx); base[j] = value; return; }
      if (isPSObject(base)) { base.props[toStr(idx)] = value; return; }
      return;
    }
    if (target.k === "member") {
      const base = this.eval(target.target);
      if (isPSObject(base)) {
        const key = Object.keys(base.props).find((k) => k.toLowerCase() === target.name.toLowerCase()) ?? target.name;
        base.props[key] = value;
      }
      return;
    }
  }

  eval(node: any): Value {
    switch (node.k) {
      case "num": return node.v;
      case "str": return node.interp ? this.interpolate(node.v) : node.v;
      case "var": {
        const nm = node.name;
        if (nm === "true") return true;
        if (nm === "false") return false;
        if (nm === "null") return null;
        return this.vars[nm] ?? null;
      }
      case "array": return node.items.map((it: any) => this.eval(it));
      case "hash": {
        const o: Record<string, unknown> = {};
        for (const p of node.pairs) o[p.key] = this.eval(p.value);
        return psObject("Hashtable", o);
      }
      case "range": {
        const a = Math.trunc(num(this.eval(node.l)));
        const b = Math.trunc(num(this.eval(node.r)));
        const arr: number[] = [];
        if (a <= b) for (let x = a; x <= b; x++) arr.push(x);
        else for (let x = a; x >= b; x--) arr.push(x);
        return arr;
      }
      case "neg": return -num(this.eval(node.e));
      case "not": return !truthy(this.eval(node.e));
      case "bin": return this.binop(node.op, this.eval(node.l), this.eval(node.r));
      case "cmp": return compare(node.op, this.eval(node.l), this.eval(node.r));
      case "logic": {
        const l = truthy(this.eval(node.l));
        if (node.op === "and") return l && truthy(this.eval(node.r));
        if (node.op === "or") return l || truthy(this.eval(node.r));
        if (node.op === "xor") return l !== truthy(this.eval(node.r));
        return l;
      }
      case "index": {
        const base = this.eval(node.e);
        const idx = num(this.eval(node.idx));
        const arr = toArray(base);
        const j = idx < 0 ? arr.length + idx : idx;
        return arr[j] ?? null;
      }
      case "member": return this.member(this.eval(node.target), node.name);
      case "method": return this.method(this.eval(node.target), node.name, node.args.map((a: any) => this.eval(a)));
      case "pipeline": return this.pipeline(node.stages);
      case "command": return this.command(node, null);
      case "block": return psObject("ScriptBlock", { body: node.body });
      case "type": return psObject("Type", { name: node.name });
      case "assign": this.vars[node.name] = this.eval(node.e); return null;
      default: throw new Error(`Cannot evaluate ${node.k}`);
    }
  }

  interpolate(s: string): string {
    // handle `n, `t escapes and $var / $(expr) substitution in double-quoted strings
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "`") { const nx = s[i + 1]; out += nx === "n" ? "\n" : nx === "t" ? "\t" : nx; i++; continue; }
      if (c === "$" && s[i + 1] === "(") {
        let depth = 1, j = i + 2, expr = "";
        while (j < s.length && depth > 0) { if (s[j] === "(") depth++; else if (s[j] === ")") depth--; if (depth > 0) expr += s[j]; j++; }
        try { out += toStr(new Parser(tokenize(expr)).parseProgram().map((st) => this.evalTop(st)).pop() ?? ""); } catch { out += ""; }
        i = j - 1; continue;
      }
      if (c === "$") {
        let j = i + 1, name = "";
        while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) name += s[j++];
        if (name) { out += toStr(this.vars[name] ?? ""); i = j - 1; continue; }
      }
      out += c;
    }
    return out;
  }
  evalTop(st: any): Value { return st.k && ["assign", "if", "for", "foreach", "while", "func", "expr"].includes(st.k) ? (st.k === "expr" ? this.eval(st.e) : (this.exec(st), null)) : this.eval(st); }

  binop(op: string, l: Value, r: Value): Value {
    if (op === "+") {
      if (typeof l === "string" || typeof r === "string") return toStr(l) + toStr(r);
      if (Array.isArray(l)) return [...l, ...(Array.isArray(r) ? r : [r])];
      return num(l) + num(r);
    }
    if (op === "-") return num(l) - num(r);
    if (op === "*") {
      if (typeof l === "string") return l.repeat(Math.max(0, Math.trunc(num(r))));
      return num(l) * num(r);
    }
    if (op === "/") return num(l) / num(r);
    if (op === "%") return num(l) % num(r);
    throw new Error(`Unknown operator ${op}`);
  }

  member(target: Value, name: string): Value {
    const lname = name.toLowerCase();
    if (Array.isArray(target)) {
      if (lname === "count" || lname === "length") return target.length;
    }
    if (typeof target === "string") { if (lname === "length") return target.length; }
    if (isPSObject(target)) {
      const key = Object.keys(target.props).find((k) => k.toLowerCase() === lname);
      if (key) return target.props[key] as Value;
    }
    return null;
  }

  method(target: Value, name: string, args: Value[]): Value {
    const m = name.toLowerCase();
    if (m === "gettype") {
      let tn = "Object";
      if (typeof target === "number") tn = Number.isInteger(target) ? "Int32" : "Double";
      else if (typeof target === "string") tn = "String";
      else if (typeof target === "boolean") tn = "Boolean";
      else if (Array.isArray(target)) tn = "Object[]";
      else if (isPSObject(target) && target.type === "Hashtable") tn = "Hashtable";
      return psObject("RuntimeType", { Name: tn });
    }
    if (m === "tostring") return toStr(target);
    if (isPSObject(target) && target.type === "Type" && String(target.props.name).toLowerCase() === "math") {
      const a = num(args[0] ?? 0);
      if (m === "sqrt") return Math.sqrt(a);
      if (m === "pow") return Math.pow(a, num(args[1] ?? 0));
      if (m === "abs") return Math.abs(a);
      if (m === "round") return Math.round(a);
      if (m === "max") return Math.max(...args.map(num));
      if (m === "min") return Math.min(...args.map(num));
    }
    if (typeof target === "string") {
      if (m === "toupper") return target.toUpperCase();
      if (m === "tolower") return target.toLowerCase();
      if (m === "trim") return target.trim();
      if (m === "split") return target.split(toStr(args[0] ?? " "));
      if (m === "replace") return target.split(toStr(args[0])).join(toStr(args[1]));
      if (m === "substring") return target.substring(num(args[0]), args[1] !== undefined ? num(args[0]) + num(args[1]) : undefined);
      if (m === "contains") return target.includes(toStr(args[0]));
      if (m === "startswith") return target.startsWith(toStr(args[0]));
      if (m === "length") return target.length;
    }
    if (Array.isArray(target)) {
      if (m === "count" || m === "length") return target.length;
      if (m === "contains") return target.includes(args[0]);
    }
    throw new Error(`Method .${name}() is not supported here`);
  }

  pipeline(stages: any[]): Value {
    let input: Value[] = [];
    let first = true;
    for (const stage of stages) {
      if (stage.k === "command") {
        input = toArray(this.command(stage, first ? null : input));
      } else {
        const v = this.eval(stage);
        input = toArray(v);
      }
      first = false;
    }
    return input.length === 1 ? input[0] : input;
  }

  callFunc(fn: { params: string[]; body: any[] }, args: Value[]): Value {
    const saved = { ...this.vars };
    fn.params.forEach((p, i) => { this.vars[p] = args[i] ?? null; });
    const before = this.out.length;
    try { this.run(fn.body); }
    catch (e) { if (e instanceof ReturnSignal) { this.vars = saved; return e.value; } throw e; }
    const produced = this.out.splice(before); // captured output becomes the return value
    this.vars = saved;
    if (produced.length === 0) return null;
    if (produced.length === 1) return produced[0];
    return produced;
  }

  command(node: any, pipeInput: Value[] | null): Value {
    const name = node.name.toLowerCase();
    const args: any[] = node.args;
    const posArgs = args.filter((a) => a.k === "posarg").map((a) => this.eval(a.value));
    const named: Record<string, Value | true> = {};
    for (const a of args) {
      if (a.k === "namedarg") named[a.name.toLowerCase()] = this.eval(a.value);
      if (a.k === "switch") named[a.name.toLowerCase()] = true;
    }
    const block = args.find((a) => a.k === "block");
    const input = pipeInput ?? [];

    // user functions
    if (this.funcs[name]) return this.callFunc(this.funcs[name], posArgs);

    switch (name) {
      case "write-output": case "write-host": case "echo": case "write-verbose":
        return posArgs.length ? (posArgs.length === 1 ? posArgs[0] : posArgs) : (input.length ? input : null);
      case "get-date": {
        const d = new Date();
        const fmt = named["format"];
        if (typeof fmt === "string") return formatDate(d, fmt);
        return d.toString().replace(/\s\(.*\)$/, "");
      }
      case "get-location": case "pwd": return psObject("PathInfo", { Path: "/home/practice" });
      case "get-childitem": case "ls": case "dir": case "gci":
        return VFS.map((f) => psObject("FileSystemInfo", { ...f }));
      case "get-content": case "cat": case "type": {
        const file = toStr(posArgs[0] ?? named["path"] ?? "");
        const base = file.split("/").pop() || file;
        const content = FILE_CONTENT[base];
        if (content === undefined) throw new Error(`Get-Content: cannot find '${file}' in the practice filesystem`);
        return content.split("\n");
      }
      case "get-process": case "ps":
        return PROCS.map((p) => psObject("Process", { ...p }));
      case "measure-object": case "measure": {
        const items = input.length ? input : posArgs;
        const prop = typeof named["property"] === "string" ? (named["property"] as string) : (typeof posArgs[0] === "string" ? posArgs[0] : null);
        const nums = items.map((it) => (prop ? num(this.member(it, prop)) : num(it))).filter((x) => !isNaN(x));
        const sum = nums.reduce((a, b) => a + b, 0);
        const res: Record<string, unknown> = { Count: items.length };
        if (named["sum"]) res.Sum = sum;
        if (named["average"] || named["avg"]) res.Average = nums.length ? sum / nums.length : 0;
        if (named["maximum"] || named["max"]) res.Maximum = nums.length ? Math.max(...nums) : 0;
        if (named["minimum"] || named["min"]) res.Minimum = nums.length ? Math.min(...nums) : 0;
        if (Object.keys(res).length === 1) res.Sum = sum; // default useful summary
        return psObject("Measure", res);
      }
      case "sort-object": case "sort": {
        const items = [...(input.length ? input : posArgs)];
        const prop = typeof posArgs[0] === "string" ? posArgs[0] : (typeof named["property"] === "string" ? (named["property"] as string) : null);
        const desc = named["descending"] === true;
        items.sort((a, b) => {
          const av = prop ? this.member(a, prop) : a;
          const bv = prop ? this.member(b, prop) : b;
          const c = av! < bv! ? -1 : av! > bv! ? 1 : 0;
          return desc ? -c : c;
        });
        return items;
      }
      case "select-object": case "select": {
        let items = [...input];
        if (named["first"] !== undefined) items = items.slice(0, num(named["first"]));
        if (named["last"] !== undefined) items = items.slice(-num(named["last"]));
        const prop = typeof posArgs[0] === "string" ? posArgs[0] : (typeof named["property"] === "string" ? (named["property"] as string) : null);
        if (prop) return items.map((it) => this.member(it, prop));
        return items;
      }
      case "where-object": case "where": case "?": {
        if (!block) throw new Error("Where-Object needs a { condition } block");
        return input.filter((it) => { this.vars["_"] = it; return truthy(this.evalBlock(block.body)); });
      }
      case "foreach-object": case "foreach": case "%": {
        if (!block) throw new Error("ForEach-Object needs a { ... } block");
        const results: Value[] = [];
        for (const it of input) { this.vars["_"] = it; const before = this.out.length; const v = this.evalBlock(block.body); const captured = this.out.splice(before); if (captured.length) results.push(...captured); else if (v !== null && v !== undefined) results.push(v); }
        return results;
      }
      case "param": return null; // handled in function parsing
      default:
        throw new Error(`The cmdlet '${node.name}' is not available in this browser practice PowerShell.`);
    }
  }

  evalBlock(body: any[]): Value {
    let last: Value = null;
    for (const st of body) {
      if (st.k === "expr") last = this.eval(st.e);
      else this.exec(st);
    }
    return last;
  }
}

// ---- Helpers --------------------------------------------------------------

function num(v: Value): number {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") { const n = parseFloat(v); return isNaN(n) ? NaN : n; }
  return NaN;
}
function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "True" : "False";
  if (Array.isArray(v)) return v.map(toStr).join(" ");
  if (isPSObject(v)) return formatValue(v).join("\n");
  return String(v);
}
function truthy(v: Value): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return v !== null;
}
function toArray(v: Value): Value[] { return Array.isArray(v) ? v : v === null ? [] : [v]; }
function compare(op: string, l: Value, r: Value): boolean {
  const a = typeof l === "number" || typeof r === "number" ? num(l) : l;
  const b = typeof l === "number" || typeof r === "number" ? num(r) : r;
  switch (op) {
    case "eq": return a == b;
    case "ne": return a != b;
    case "gt": return (a as number) > (b as number);
    case "lt": return (a as number) < (b as number);
    case "ge": return (a as number) >= (b as number);
    case "le": return (a as number) <= (b as number);
    case "like": { const re = new RegExp("^" + toStr(r).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i"); return re.test(toStr(l)); }
    case "match": try { return new RegExp(toStr(r), "i").test(toStr(l)); } catch { return false; }
    case "contains": return toArray(l).includes(r);
    case "in": return toArray(r).includes(l);
    case "notin": return !toArray(r).includes(l);
    case "notlike": return !compare("like", l, r);
    default: return false;
  }
}
function formatValue(v: Value): string[] {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) return v.flatMap(formatValue);
  if (isPSObject(v)) {
    const entries = Object.entries(v.props);
    // key : value list, aligned
    const w = Math.max(...entries.map(([k]) => k.length), 0);
    return entries.map(([k, val]) => `${k.padEnd(w)} : ${toStr(val as Value)}`);
  }
  return [toStr(v)];
}
function formatDate(d: Date, fmt: string): string {
  const p2 = (x: number) => String(x).padStart(2, "0");
  return fmt
    .replace(/yyyy/g, String(d.getFullYear()))
    .replace(/MM/g, p2(d.getMonth() + 1))
    .replace(/dd/g, p2(d.getDate()))
    .replace(/HH/g, p2(d.getHours()))
    .replace(/mm/g, p2(d.getMinutes()))
    .replace(/ss/g, p2(d.getSeconds()));
}

// ---- Entry point ----------------------------------------------------------

export function runPowerShell(code: string): Promise<RunOutput> {
  return new Promise((resolve) => {
    const interp = new Interp();
    try {
      const stmts = new Parser(tokenize(code)).parseProgram();
      interp.run(stmts);
      resolve({ output: interp.out.join("\n") || "(no output)", ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const partial = interp.out.length ? interp.out.join("\n") + "\n" : "";
      resolve({ output: partial + "PowerShell error: " + msg, ok: false });
    }
  });
}

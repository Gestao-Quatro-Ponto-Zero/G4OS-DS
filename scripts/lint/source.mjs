// Leitura leve de código-fonte (JS/TS/JSX/HTML/CSS) sem parser completo: o suficiente
// para o audit achar strings de classe, tags JSX e atributos com posição exata.
// Usado pelo CLI (g4os-ds audit), pelo plugin ESLint e pela tool `audit` do MCP.

/** Índices de início de cada linha, para converter offset → linha/coluna. */
export function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return {
    starts,
    /** offset → { line, col } (1-based) */
    pos(offset) {
      let lo = 0;
      let hi = starts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= offset) lo = mid;
        else hi = mid - 1;
      }
      return { line: lo + 1, col: offset - starts[lo] + 1 };
    },
    lineText(line) {
      const s = starts[line - 1] ?? 0;
      const e = starts[line] ?? text.length + 1;
      return text.slice(s, e - 1);
    },
  };
}

const isIdent = (c) => /[\w$]/.test(c ?? "");

/**
 * Varre JS/TS/JSX uma vez e devolve:
 * - code: o texto com comentários trocados por espaço (linhas preservadas)
 * - strings: literais "…", '…' e partes estáticas de `…` (com offset do conteúdo)
 * - comments: { start, end, text }
 * Regex literal e texto JSX são tratados por heurística (bom o bastante para lint).
 */
export function scanJs(text) {
  const strings = [];
  const comments = [];
  const out = text.split("");
  const blank = (s, e) => {
    for (let k = s; k < e; k++) if (out[k] !== "\n") out[k] = " ";
  };
  // pilha de contextos: "code" | "tpl" (dentro de `…`) ; para ${ } contamos chaves
  const braceStack = [];
  let i = 0;
  const n = text.length;
  let lastSig = ""; // último caractere significativo de código (para distinguir regex de divisão)
  let jsxText = false; // depois de ">" de uma tag JSX, texto até "<" ou "{"
  const readTemplate = (from) => {
    // from aponta para o caractere depois do ` (ou depois de } que fecha ${)
    let j = from;
    let segStart = j;
    while (j < n) {
      const c = text[j];
      if (c === "\\") {
        j += 2;
        continue;
      }
      if (c === "`") {
        strings.push({ start: segStart, end: j, value: text.slice(segStart, j), quote: "`" });
        return { end: j + 1, open: false };
      }
      if (c === "$" && text[j + 1] === "{") {
        strings.push({ start: segStart, end: j, value: text.slice(segStart, j), quote: "`" });
        return { end: j + 2, open: true };
      }
      j++;
    }
    strings.push({ start: segStart, end: n, value: text.slice(segStart, n), quote: "`" });
    return { end: n, open: false };
  };

  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (jsxText) {
      // texto JSX: apóstrofos aqui não abrem string
      if (c === "<" || c === "{") jsxText = false;
      else {
        i++;
        continue;
      }
    }
    if (c === "/" && d === "/") {
      const e = text.indexOf("\n", i);
      const end = e < 0 ? n : e;
      comments.push({ start: i, end, text: text.slice(i, end) });
      blank(i, end);
      i = end;
      continue;
    }
    if (c === "/" && d === "*") {
      const e = text.indexOf("*/", i + 2);
      const end = e < 0 ? n : e + 2;
      comments.push({ start: i, end, text: text.slice(i, end) });
      blank(i, end);
      i = end;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && text[j] !== c && text[j] !== "\n") j += text[j] === "\\" ? 2 : 1;
      strings.push({ start: i + 1, end: j, value: text.slice(i + 1, j), quote: c });
      i = j + 1;
      lastSig = c;
      continue;
    }
    if (c === "`") {
      const r = readTemplate(i + 1);
      if (r.open) braceStack.push("tpl");
      i = r.end;
      lastSig = r.open ? "{" : "`";
      continue;
    }
    if (c === "{") {
      braceStack.push("code");
      i++;
      lastSig = c;
      continue;
    }
    if (c === "}") {
      const top = braceStack.pop();
      if (top === "tpl") {
        const r = readTemplate(i + 1);
        if (r.open) braceStack.push("tpl");
        i = r.end;
        lastSig = r.open ? "{" : "`";
        continue;
      }
      i++;
      lastSig = c;
      continue;
    }
    if (c === "/" && (lastSig === "" || /[(,=:[!&|?{};+\-*%<>~^]/.test(lastSig) || /\b(return|typeof|case|in|of)\s*$/.test(text.slice(Math.max(0, i - 8), i)))) {
      // regex literal
      let j = i + 1;
      let cls = false;
      while (j < n && text[j] !== "\n") {
        if (text[j] === "\\") {
          j += 2;
          continue;
        }
        if (text[j] === "[") cls = true;
        else if (text[j] === "]") cls = false;
        else if (text[j] === "/" && !cls) break;
        j++;
      }
      if (text[j] === "/") {
        while (isIdent(text[j + 1])) j++;
        i = j + 1;
        lastSig = "/";
        continue;
      }
    }
    if (c === ">" && looksLikeJsxTagEnd(text, i)) {
      jsxText = true;
      i++;
      lastSig = ">";
      continue;
    }
    if (!/\s/.test(c)) lastSig = c;
    i++;
  }
  return { code: out.join(""), strings, comments };
}

/**
 * ">" que fecha uma tag JSX de ABERTURA (não autofechada, não </x>, não operador
 * nem genérico TS). Depois dele vem texto JSX, onde apóstrofo não abre string.
 */
function looksLikeJsxTagEnd(text, i) {
  if (text[i - 1] === "=" || text[i + 1] === "=" || text[i - 1] === "-" || text[i - 1] === "/") return false;
  let depth = 0;
  for (let j = i - 1; j >= 0 && i - j < 4000; j--) {
    const c = text[j];
    if (c === "}") depth++;
    else if (c === "{") depth--;
    if (depth < 0) return false;
    if (depth > 0) continue;
    if (c === ";" || c === ">") return false;
    if (c === "<") {
      const nx = text[j + 1];
      if (nx === ">") return true; // fragmento <>
      return /[A-Za-z]/.test(nx ?? "") && !isIdent(text[j - 1]);
    }
  }
  return false;
}

/**
 * Tags JSX/HTML de abertura com atributos. Cada atributo: { name, value (texto cru,
 * sem aspas/chaves), raw, kind: "string"|"expr"|"bool", start, end, valueStart }.
 * `code` deve ser o texto com comentários apagados (scanJs().code).
 */
export function scanTags(code) {
  const tags = [];
  const re = /<([A-Za-z][\w.:-]*)(?=[\s/>])/g;
  let m;
  while ((m = re.exec(code))) {
    const start = m.index;
    const prev = code.slice(Math.max(0, start - 1), start);
    // identificador colado antes = genérico TS (Array<string>), não JSX
    if (isIdent(prev)) continue;
    const name = m[1];
    let i = re.lastIndex;
    const attrs = [];
    let spread = false;
    let selfClosing = false;
    let ok = false;
    const n = code.length;
    while (i < n) {
      while (i < n && /\s/.test(code[i])) i++;
      if (code[i] === "/" && code[i + 1] === ">") {
        selfClosing = true;
        i += 2;
        ok = true;
        break;
      }
      if (code[i] === ">") {
        i++;
        ok = true;
        break;
      }
      if (code[i] === "{") {
        const e = matchBrace(code, i);
        if (e < 0) break;
        if (/^\{\s*\.\.\./.test(code.slice(i, i + 8))) spread = true;
        i = e + 1;
        continue;
      }
      const am = /^[\w:.@-]+/.exec(code.slice(i, i + 80));
      if (!am) break;
      const aStart = i;
      const aname = am[0];
      i += aname.length;
      if (code[i] === "=") {
        i++;
        const q = code[i];
        if (q === '"' || q === "'") {
          const e = code.indexOf(q, i + 1);
          if (e < 0) break;
          attrs.push({ name: aname, kind: "string", value: code.slice(i + 1, e), start: aStart, end: e + 1, valueStart: i + 1 });
          i = e + 1;
        } else if (q === "{") {
          const e = matchBrace(code, i);
          if (e < 0) break;
          attrs.push({ name: aname, kind: "expr", value: code.slice(i + 1, e), start: aStart, end: e + 1, valueStart: i + 1 });
          i = e + 1;
        } else {
          const vm = /^[^\s>]+/.exec(code.slice(i));
          if (!vm) break;
          attrs.push({ name: aname, kind: "string", value: vm[0], start: aStart, end: i + vm[0].length, valueStart: i });
          i += vm[0].length;
        }
      } else attrs.push({ name: aname, kind: "bool", value: "", start: aStart, end: i, valueStart: i });
    }
    if (!ok) continue;
    const tag = { name, start, end: i, attrs, spread, selfClosing };
    tag.attr = (k) => attrs.find((a) => a.name === k);
    tag.has = (...ks) => ks.some((k) => attrs.some((a) => a.name === k));
    tags.push(tag);
  }
  return tags;
}

/** Fim da chave que casa com a de `from` (respeita strings e templates). -1 se não fecha. */
export function matchBrace(code, from) {
  let depth = 0;
  for (let i = from; i < code.length; i++) {
    const c = code[i];
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < code.length && code[j] !== c) {
        if (code[j] === "\\") j++;
        else if (c === "`" && code[j] === "$" && code[j + 1] === "{") {
          const e = matchBrace(code, j + 1);
          if (e < 0) return -1;
          j = e;
        }
        j++;
      }
      i = j;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Conteúdo entre <tag …> e </tag> (mesmo nome, com aninhamento simples). */
export function tagBody(code, tag) {
  if (tag.selfClosing) return "";
  const open = new RegExp(`<${tag.name.replace(/[.]/g, "\\.")}(?=[\\s/>])`, "g");
  const close = `</${tag.name}>`;
  let depth = 1;
  let i = tag.end;
  while (i < code.length) {
    const c = code.indexOf(close, i);
    if (c < 0) return null;
    open.lastIndex = i;
    let o;
    while ((o = open.exec(code)) && o.index < c) depth++;
    depth--;
    if (depth <= 0) return code.slice(tag.end, c);
    i = c + close.length;
  }
  return null;
}

/** CSS: comentários viram espaço (linhas preservadas). */
export function stripCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
}

/** Divide uma string de classes em tokens com offset relativo. */
export function classTokens(value) {
  const out = [];
  for (const m of value.matchAll(/[^\s"'`]+/g)) out.push({ token: m[0], index: m.index });
  return out;
}

/** "md:hover:!bg-white/50" → { variants: ["md","hover"], base: "bg-white/50", important } */
export function splitVariants(token) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of token) {
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    if (ch === ":" && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  let base = cur;
  let important = false;
  if (base.startsWith("!")) {
    important = true;
    base = base.slice(1);
  } else if (base.endsWith("!")) {
    important = true;
    base = base.slice(0, -1);
  }
  return { variants: parts, base, important };
}

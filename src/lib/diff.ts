/**
 * Diff unificado (um PR revisado, um texto reescrito, uma configuração que mudaria) lido em
 * arquivos, trechos e linhas numeradas. Uma linha removida seguida de uma adicionada forma um par,
 * e as palavras que mudaram entre as duas ficam marcadas.
 */
export type DiffWord = { text: string; changed: boolean };
export type DiffLine =
  | { kind: "hunk"; text: string }
  | { kind: "add" | "del" | "ctx"; text: string; old?: number; new?: number; words?: DiffWord[] };
type TextLine = Exclude<DiffLine, { kind: "hunk" }>;
export type DiffFile = { name?: string; lines: DiffLine[]; added: number; removed: number };

const MAX_LINES = 3000;
/** Acima deste tamanho a linha aparece inteira: comparar as palavras custa mais do que mostra. */
const WORDS_UP_TO = 400;
const META =
  /^(index |new file mode|deleted file mode|old mode|new mode|similarity index|rename from|rename to|Binary files)/;

const fileName = (line: string) => {
  const path = line.slice(4).trim().replace(/\t.*$/, "");
  return path === "/dev/null" ? undefined : path.replace(/^[ab]\//, "");
};

/** Os arquivos de um diff, ou `null` quando o texto não tem linha adicionada nem removida. */
export function parseDiff(source: string): DiffFile[] | null {
  const files: DiffFile[] = [];
  let file: DiffFile | undefined;
  let old = 0;
  let neu = 0;
  let numbered = false;
  const open = (name?: string) => {
    file = { ...(name ? { name } : {}), lines: [], added: 0, removed: 0 };
    files.push(file);
  };
  const lines = source.replace(/\r\n/g, "\n").split("\n").slice(0, MAX_LINES);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith("diff --git ")) {
      open(/ b\/(.+)$/.exec(line)?.[1]);
      continue;
    }
    if (line.startsWith("--- ") && lines[i + 1]?.startsWith("+++ ")) {
      const name = fileName(lines[i + 1]!) ?? fileName(line);
      if (!file || file.lines.length) open(name);
      else if (name) file.name = name;
      i++;
      continue;
    }
    if (META.test(line) || line.startsWith("\\ ")) continue;
    if (!file) open();
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/.exec(line);
    if (hunk) {
      old = Number(hunk[1]);
      neu = Number(hunk[2]);
      numbered = true;
      file!.lines.push({ kind: "hunk", text: hunk[3]!.trim() });
      continue;
    }
    const sign = line[0];
    const text = sign === "+" || sign === "-" || sign === " " ? line.slice(1) : line;
    if (sign === "+") {
      file!.lines.push({ kind: "add", text, ...(numbered ? { new: neu++ } : {}) });
      file!.added++;
    } else if (sign === "-") {
      file!.lines.push({ kind: "del", text, ...(numbered ? { old: old++ } : {}) });
      file!.removed++;
    } else file!.lines.push({ kind: "ctx", text, ...(numbered ? { old: old++, new: neu++ } : {}) });
  }
  const shown = files.filter((f) => f.added || f.removed);
  if (!shown.length) return null;
  for (const f of shown) markWords(f.lines);
  return shown;
}

const tokens = (text: string) => text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? [];

/** As palavras de `a` e `b` que não estão na maior sequência comum entre as duas. */
export function wordDiff(a: string, b: string): [DiffWord[], DiffWord[]] {
  const x = tokens(a);
  const y = tokens(b);
  const table = Array.from({ length: x.length + 1 }, () => new Uint16Array(y.length + 1));
  for (let i = x.length - 1; i >= 0; i--)
    for (let j = y.length - 1; j >= 0; j--)
      table[i]![j] =
        x[i] === y[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
  const left: DiffWord[] = [];
  const right: DiffWord[] = [];
  const push = (list: DiffWord[], text: string, changed: boolean) => {
    const last = list.at(-1);
    if (last && last.changed === changed) last.text += text;
    else list.push({ text, changed });
  };
  let i = 0;
  let j = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) {
      push(left, x[i]!, false);
      push(right, y[j]!, false);
      i++;
      j++;
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) push(left, x[i++]!, true);
    else push(right, y[j++]!, true);
  }
  while (i < x.length) push(left, x[i++]!, true);
  while (j < y.length) push(right, y[j++]!, true);
  return [left, right];
}

/** Quanto de `a` sobrevive em `b`, de 0 a 1, contando só palavras. */
function likeness(left: DiffWord[], a: string) {
  const kept = left.filter((w) => !w.changed).reduce((n, w) => n + w.text.trim().length, 0);
  return kept / Math.max(1, a.replace(/\s+/g, "").length);
}

/**
 * Em cada sequência de linhas removidas seguida de adicionadas, casa cada removida com a adicionada
 * mais parecida ainda livre, em ordem, e marca as palavras que mudaram. Um par com menos da metade
 * do texto em comum lê melhor inteiro do que como um mosaico de marcas.
 */
function markWords(lines: DiffLine[]) {
  for (let i = 0; i < lines.length;) {
    if (lines[i]!.kind !== "del") {
      i++;
      continue;
    }
    let dels = i;
    while (dels < lines.length && lines[dels]!.kind === "del") dels++;
    let adds = dels;
    while (adds < lines.length && lines[adds]!.kind === "add") adds++;
    let from = dels;
    for (let d = i; d < dels; d++) {
      const del = lines[d] as TextLine;
      if (del.text.length > WORDS_UP_TO) continue;
      let best: { at: number; left: DiffWord[]; right: DiffWord[]; score: number } | undefined;
      for (let a = from; a < adds; a++) {
        const add = lines[a] as TextLine;
        if (add.text.length > WORDS_UP_TO || add.text === del.text) continue;
        const [left, right] = wordDiff(del.text, add.text);
        const score = likeness(left, del.text);
        if (score >= 0.5 && (!best || score > best.score)) best = { at: a, left, right, score };
      }
      if (!best) continue;
      del.words = best.left;
      (lines[best.at] as TextLine).words = best.right;
      from = best.at + 1;
    }
    i = adds;
  }
}

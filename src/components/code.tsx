"use client";

import { FileDiff } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useIsomorphicLayoutEffect } from "../lib/layout-effect";
import { parseDiff, type DiffFile, type DiffLine } from "../lib/diff";
import { CopyButton } from "./interactive";
import { Button, toneText } from "./primitives";

/* ------------------------------------------------------------------ */
/* CodeBlock                                                           */
/* ------------------------------------------------------------------ */

/** Linguagens com nome legível. Texto e Markdown quebram linha; código mantém as linhas e rola de lado. */
const languages: Record<string, { label: string; prose?: true; plain?: true }> = {
  "": { label: "Texto", prose: true },
  text: { label: "Texto", prose: true },
  txt: { label: "Texto", prose: true },
  plain: { label: "Texto", prose: true },
  plaintext: { label: "Texto", prose: true },
  md: { label: "Markdown", prose: true },
  markdown: { label: "Markdown", prose: true },
  json: { label: "JSON" },
  sql: { label: "SQL" },
  csv: { label: "CSV", plain: true },
  yaml: { label: "YAML" },
  yml: { label: "YAML" },
  html: { label: "HTML" },
  css: { label: "CSS" },
  js: { label: "JavaScript" },
  jsx: { label: "JavaScript" },
  javascript: { label: "JavaScript" },
  ts: { label: "TypeScript" },
  tsx: { label: "TypeScript" },
  typescript: { label: "TypeScript" },
  py: { label: "Python" },
  python: { label: "Python" },
  sh: { label: "Terminal" },
  bash: { label: "Terminal" },
  shell: { label: "Terminal" },
  diff: { label: "Diff", plain: true },
};

const keywords =
  "import|from|export|default|function|return|const|let|var|type|interface|class|extends|if|else|for|while|of|in|new|as|await|async|try|catch|throw|true|false|null|undefined|def|lambda|None|True|False|SELECT|FROM|WHERE|JOIN|LEFT|INNER|ON|GROUP|ORDER|BY|LIMIT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|AND|OR|NOT|AS";
const tokenRe = new RegExp(
  `((?<![:\\w])\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/|(?<![\\w&])#[^\\n{]*$|--[^\\n]*)|("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|\\b(${keywords})\\b|\\b(\\d+(?:\\.\\d+)?)\\b`,
  "gm",
);

/**
 * Realce mínimo e sem dependência: comentário, texto entre aspas, palavra-chave e número. Serve a
 * maior parte do que aparece numa resposta ou numa documentação; para realce completo por
 * gramática, passe o resultado do seu realçador em `children`.
 */
function tokens(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of code.matchAll(tokenRe)) {
    const at = m.index ?? 0;
    if (at > last) out.push(code.slice(last, at));
    const [whole, comment, string, keyword] = m;
    const cls = comment ? "italic text-muted" : string ? "text-ok" : keyword ? "text-clay" : "text-accent-deep";
    out.push(
      <span key={k++} className={cls}>
        {whole}
      </span>,
    );
    last = at + whole.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

/** Recolhe um corpo alto e devolve o que o rodapé "Mostrar tudo" precisa. Mede de novo a cada render (o texto cresce em streaming). */
function useCollapse<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [open, setOpen] = useState(false);
  const [tall, setTall] = useState(false);
  // De propósito sem dependências: a altura muda com o conteúdo (texto em streaming), não com props.
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (el && !open) setTall(el.scrollHeight > el.clientHeight + 1);
  });
  return { ref, open, setOpen, tall };
}

function Expand({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="flex justify-center border-t border-line p-1 print:hidden">
      <Button variant="ghost" size="sm" aria-expanded={open} onClick={onToggle}>
        {open ? "Recolher" : "Mostrar tudo"}
      </Button>
    </div>
  );
}

/**
 * Bloco de código ou de texto para copiar: diz o que é (linguagem ou nome do arquivo), copia o
 * bloco inteiro e tem altura limitada com rolagem própria, para um bloco longo não empurrar o resto
 * da página. Texto e Markdown quebram linha; código mantém as linhas e rola de lado.
 */
export function CodeBlock({
  code,
  language = "",
  title,
  lineNumbers = false,
  highlightLines,
  maxHeight = 360,
  copy = true,
  actions,
  children,
  className,
}: {
  /** O texto. É também o que o botão Copiar copia. */
  code: string;
  /** Linguagem do bloco ("ts", "sql", "bash"…): vira o rótulo e liga o realce. Vazio = texto corrido. */
  language?: string;
  /** Rótulo no lugar da linguagem: nome do arquivo (`src/lib/format.ts`) ou do passo ("Instalar"). */
  title?: ReactNode;
  /** Numera as linhas. Para código que a pessoa vai citar ou comparar; não em comando de uma linha. */
  lineNumbers?: boolean;
  /** Linhas em destaque (base 1): a mudança que a explicação ao lado comenta. */
  highlightLines?: number[];
  /** Altura máxima recolhido, em px. Acima disso aparece "Mostrar tudo". `false` não limita. */
  maxHeight?: number | false;
  copy?: boolean;
  /** Ações extras no cabeçalho, antes de Copiar ("Abrir no editor", "Executar"). */
  actions?: ReactNode;
  /** Conteúdo já realçado por outro realçador (shiki, prism). Substitui o realce do DS; `code` segue sendo o que se copia. */
  children?: ReactNode;
  className?: string;
}) {
  const kind = languages[language.toLowerCase()] ?? { label: language };
  const text = code.replace(/^\n+|\s+$/g, "");
  const { ref, open, setOpen, tall } = useCollapse<HTMLPreElement>();
  const lines = useMemo(() => text.split("\n"), [text]);
  const marked = useMemo(() => new Set(highlightLines), [highlightLines]);
  const byLine = lineNumbers || marked.size > 0;
  const paint = (s: string) => (kind.prose || kind.plain ? s : tokens(s));
  return (
    <figure className={cn("code-block m-0 min-w-0 max-w-full overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <figcaption className="flex min-h-10 items-center gap-2 border-b border-line py-1 pl-4 pr-1">
        <span className={cn("min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink-soft", title != null && "font-mono")}>{title ?? kind.label}</span>
        {actions}
        {copy && <CopyButton value={text} className="border-0 bg-transparent" />}
      </figcaption>
      <pre
        ref={ref}
        tabIndex={0}
        role="region"
        aria-label={typeof title === "string" ? title : kind.label || "Código"}
        className={cn(
          "m-0 overflow-auto bg-soft/60 py-3 text-ink outline-none [tab-size:2] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-muted/50",
          kind.prose ? "whitespace-pre-wrap px-4 font-sans text-[13.5px] leading-relaxed [overflow-wrap:anywhere]" : "whitespace-pre font-mono text-[12.5px] leading-[1.65] [font-variant-ligatures:none]",
          !byLine && !kind.prose && "px-4",
        )}
        style={{ maxHeight: open || maxHeight === false ? undefined : maxHeight }}
      >
        <code className="block min-w-max bg-transparent p-0 [font:inherit]">
          {children ??
            (byLine
              ? lines.map((line, i) => (
                  <span key={i} className={cn("flex", marked.has(i + 1) && "bg-accent-soft")}>
                    {lineNumbers && (
                      <span aria-hidden className="w-11 shrink-0 select-none pr-3 text-right tabular-nums text-muted">
                        {i + 1}
                      </span>
                    )}
                    <span className={cn("flex-1 pr-4", !lineNumbers && "pl-4")}>{line ? paint(line) : "\n"}</span>
                  </span>
                ))
              : paint(text))}
        </code>
      </pre>
      {(tall || open) && maxHeight !== false && <Expand open={open} onToggle={() => setOpen(!open)} />}
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* DiffView                                                            */
/* ------------------------------------------------------------------ */

const rowTone = { add: "bg-ok-soft", del: "bg-rose-soft", ctx: "" } as const;
const markTone = { add: "bg-ok/25", del: "bg-rose/25", ctx: "" } as const;
const sign = { add: "+", del: "−", ctx: " " } as const;

function Counts({ added, removed }: { added: number; removed: number }) {
  return (
    <span className="shrink-0 text-[12px] tabular-nums" aria-label={`${added} linhas adicionadas, ${removed} removidas`}>
      <span className={toneText.ok}>+{added}</span> <span className={toneText.bad}>−{removed}</span>
    </span>
  );
}

function DiffRow({ line }: { line: DiffLine }) {
  if (line.kind === "hunk")
    return (
      <tr className="bg-soft text-muted">
        <td colSpan={4} className="whitespace-pre px-4 py-0.5 text-[12px]">
          ⋯ {line.text}
        </td>
      </tr>
    );
  const number = "w-px min-w-9 select-none whitespace-nowrap px-2 text-right align-top tabular-nums text-muted";
  return (
    <tr className={rowTone[line.kind]}>
      <td className={number}>{line.old ?? ""}</td>
      <td className={number}>{line.new ?? ""}</td>
      <td className={cn("w-px select-none pl-0.5 pr-1.5 align-top", line.kind === "add" ? toneText.ok : line.kind === "del" ? toneText.bad : "text-muted")} aria-label={line.kind === "add" ? "adicionada" : line.kind === "del" ? "removida" : undefined}>
        {sign[line.kind]}
      </td>
      <td className="whitespace-pre pr-4 align-top">
        {line.words
          ? line.words.map((word, i) =>
              word.changed ? (
                <mark key={i} className={cn("rounded-sm text-inherit", markTone[line.kind])}>
                  {word.text}
                </mark>
              ) : (
                <span key={i}>{word.text}</span>
              ),
            )
          : line.text || " "}
      </td>
    </tr>
  );
}

function DiffFileRows({ file, many }: { file: DiffFile; many: boolean }) {
  return (
    <tbody>
      {many && (
        <tr>
          <th colSpan={4} className="border-t border-line bg-soft px-4 py-1.5 text-left font-medium first:border-t-0">
            <span className="mr-3">{file.name ?? "Arquivo"}</span>
            <Counts added={file.added} removed={file.removed} />
          </th>
        </tr>
      )}
      {file.lines.map((line, i) => (
        <DiffRow key={i} line={line} />
      ))}
    </tbody>
  );
}

/**
 * Diff como quem revisa lê: o arquivo, quantas linhas entraram e saíram, cada linha com o número
 * antigo e o novo, adicionadas em verde, removidas em vermelho (sempre com + e −, nunca só a cor) e
 * as palavras que mudaram marcadas dentro de uma linha reescrita. Recebe um diff unificado
 * (`git diff`); texto que não é diff aparece como bloco de código comum.
 */
export function DiffView({ diff, title, maxHeight = 420, className }: { /** Diff unificado, como sai do `git diff`. */ diff: string; /** Título no lugar do nome do arquivo. */ title?: string; maxHeight?: number | false; className?: string }) {
  const files = useMemo(() => parseDiff(diff), [diff]);
  const { ref, open, setOpen, tall } = useCollapse<HTMLDivElement>();
  if (!files) return <CodeBlock language="diff" code={diff} title={title} maxHeight={maxHeight} className={className} />;
  const added = files.reduce((n, f) => n + f.added, 0);
  const removed = files.reduce((n, f) => n + f.removed, 0);
  const many = files.length > 1;
  const name = title ?? (many ? `${files.length} arquivos` : (files[0].name ?? "Alterações"));
  return (
    <figure className={cn("diff-view m-0 min-w-0 max-w-full overflow-hidden rounded-xl border border-line bg-surface", className)} aria-label={`Diff: ${name}`}>
      <figcaption className="flex min-h-10 items-center gap-2 border-b border-line py-1 pl-4 pr-1">
        <FileDiff className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] font-medium text-ink-soft">{name}</span>
        <Counts added={added} removed={removed} />
        <CopyButton value={diff} className="border-0 bg-transparent" />
      </figcaption>
      <div ref={ref} tabIndex={0} role="region" aria-label={`Diff de ${name}`} className="overflow-auto bg-surface outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-muted/50" style={{ maxHeight: open || maxHeight === false ? undefined : maxHeight }}>
        <table className="w-full border-collapse font-mono text-[12.5px] leading-[1.55] [font-variant-ligatures:none]">
          {files.map((file, i) => (
            <DiffFileRows key={i} file={file} many={many} />
          ))}
        </table>
      </div>
      {(tall || open) && maxHeight !== false && <Expand open={open} onToggle={() => setOpen(!open)} />}
    </figure>
  );
}

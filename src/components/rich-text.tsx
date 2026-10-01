"use client";

import {
  AlignCenter,
  AlignLeft,
  Bold,
  ChevronDown,
  Code,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Strikethrough,
  Table2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Menu, Tooltip } from "./overlays-extra";

/*
 * Editor de texto rico LEVE (contentEditable + comandos do navegador).
 * Bom para: instruções de agente, notas de registro, descrições, comentários.
 * Não é um editor de documentos: sem colaboração em tempo real, sem schema,
 * HTML como valor. Para documentos de produção, use TipTap/ProseMirror com
 * este mesmo toolbar visual (receita em docs/padroes/editor-de-texto.md).
 */

type Block = "p" | "h1" | "h2" | "h3";
const blockLabel: Record<Block, string> = { p: "Texto", h1: "Título 1", h2: "Título 2", h3: "Título 3" };

export type RichTextTool =
  | "heading"
  | "bold"
  | "italic"
  | "strike"
  | "highlight"
  | "align"
  | "bullet"
  | "ordered"
  | "checklist"
  | "quote"
  | "table"
  | "code"
  | "link"
  | "image";

const allTools: RichTextTool[][] = [["heading"], ["bold", "italic", "strike", "highlight"], ["align"], ["bullet", "ordered", "checklist", "quote"], ["table", "code", "link", "image"]];

/** Estilos de leitura do conteúdo (h1–h3, listas, checklist, citação, código, tabela). */
export const richTextContentClass = cn(
  "text-[14px] leading-relaxed text-ink [overflow-wrap:anywhere]",
  "[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-[20px] [&_h1]:font-semibold [&_h1]:tracking-tight first:[&_h1]:mt-0",
  "[&_h2]:mb-1.5 [&_h2]:mt-4 [&_h2]:text-[17px] [&_h2]:font-semibold first:[&_h2]:mt-0",
  "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-[15px] [&_h3]:font-semibold",
  "[&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-0.5 [&_ol_ol]:list-[lower-alpha]",
  "[&_ul[data-checklist]]:list-none [&_ul[data-checklist]]:pl-1 [&_ul[data-checklist]>li]:relative [&_ul[data-checklist]>li]:pl-7",
  "[&_ul[data-checklist]>li]:before:absolute [&_ul[data-checklist]>li]:before:left-0 [&_ul[data-checklist]>li]:before:top-[0.2em] [&_ul[data-checklist]>li]:before:h-4 [&_ul[data-checklist]>li]:before:w-4 [&_ul[data-checklist]>li]:before:rounded [&_ul[data-checklist]>li]:before:border [&_ul[data-checklist]>li]:before:border-line-strong [&_ul[data-checklist]>li]:before:content-['']",
  "[&_ul[data-checklist]>li[data-checked]]:text-muted [&_ul[data-checklist]>li[data-checked]]:line-through [&_ul[data-checklist]>li[data-checked]]:before:border-ok [&_ul[data-checklist]>li[data-checked]]:before:bg-ok",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-line-strong [&_blockquote]:pl-3 [&_blockquote]:text-ink-soft",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-soft [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[12.5px]",
  "[&_code]:rounded [&_code]:bg-soft [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px] [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_mark]:rounded-sm [&_mark]:bg-accent-soft [&_mark]:px-0.5 [&_mark]:text-ink",
  "[&_a]:text-blue [&_a]:underline [&_a]:underline-offset-2",
  "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[13px] [&_td]:border [&_td]:border-line [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-line [&_th]:bg-soft [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium",
  "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg",
);

type Active = Partial<Record<RichTextTool | "alignCenter", boolean>> & { block?: Block };

function ToolButton({ label, shortcut, active, onClick, children }: { label: string; shortcut?: string[]; active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip content={label} shortcut={shortcut} delay={300}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        // mousedown: não tira o foco/seleção do editor
        onMouseDown={(e) => {
          e.preventDefault();
          onClick();
        }}
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-md transition-colors [&_svg]:h-4 [&_svg]:w-4",
          active ? "bg-ink/[0.08] text-ink" : "text-muted hover:bg-soft hover:text-ink",
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

/**
 * Barra de ferramentas do editor (também serve para TipTap: passe `onCommand`
 * e `active` do seu editor). Grupos separados por divisória; rola na
 * horizontal em telas estreitas. `aside` fica à direita (ex.: "Melhorar").
 */
export function RichTextToolbar({
  onCommand,
  active = {},
  tools = allTools,
  aside,
  className,
}: {
  onCommand: (tool: RichTextTool | "alignCenter" | "alignLeft", value?: string) => void;
  active?: Active;
  tools?: RichTextTool[][];
  aside?: ReactNode;
  className?: string;
}) {
  const block = active.block ?? "p";
  const btn = (t: RichTextTool) => {
    switch (t) {
      case "heading":
        return (
          <Menu
            key={t}
            label="Estilo do parágrafo"
            triggerClassName="!h-8 !bg-transparent !px-2 !text-[12.5px] !font-medium !ring-0 hover:!bg-soft gap-1"
            trigger={
              <>
                {block === "p" ? "Texto" : block.toUpperCase()}
                <ChevronDown className="!h-3.5 !w-3.5 text-muted" />
              </>
            }
            items={(Object.keys(blockLabel) as Block[]).map((b) => ({ type: "item" as const, label: blockLabel[b], onSelect: () => onCommand("heading", b) }))}
          />
        );
      case "bold":
        return <ToolButton key={t} label="Negrito" shortcut={["⌘", "B"]} active={active.bold} onClick={() => onCommand(t)}><Bold /></ToolButton>;
      case "italic":
        return <ToolButton key={t} label="Itálico" shortcut={["⌘", "I"]} active={active.italic} onClick={() => onCommand(t)}><Italic /></ToolButton>;
      case "strike":
        return <ToolButton key={t} label="Tachado" active={active.strike} onClick={() => onCommand(t)}><Strikethrough /></ToolButton>;
      case "highlight":
        return <ToolButton key={t} label="Destacar" active={active.highlight} onClick={() => onCommand(t)}><Highlighter /></ToolButton>;
      case "align":
        return active.alignCenter ? (
          <ToolButton key={t} label="Alinhar à esquerda" onClick={() => onCommand("alignLeft")}><AlignLeft /></ToolButton>
        ) : (
          <ToolButton key={t} label="Centralizar" onClick={() => onCommand("alignCenter")}><AlignCenter /></ToolButton>
        );
      case "bullet":
        return <ToolButton key={t} label="Lista" shortcut={["-", "espaço"]} active={active.bullet} onClick={() => onCommand(t)}><List /></ToolButton>;
      case "ordered":
        return <ToolButton key={t} label="Lista numerada" shortcut={["1.", "espaço"]} active={active.ordered} onClick={() => onCommand(t)}><ListOrdered /></ToolButton>;
      case "checklist":
        return <ToolButton key={t} label="Checklist" shortcut={["[]", "espaço"]} active={active.checklist} onClick={() => onCommand(t)}><ListChecks /></ToolButton>;
      case "quote":
        return <ToolButton key={t} label="Citação" shortcut={[">", "espaço"]} active={active.quote} onClick={() => onCommand(t)}><Quote /></ToolButton>;
      case "table":
        return <ToolButton key={t} label="Tabela" onClick={() => onCommand(t)}><Table2 /></ToolButton>;
      case "code":
        return <ToolButton key={t} label="Código" active={active.code} onClick={() => onCommand(t)}><Code /></ToolButton>;
      case "link":
        return <ToolButton key={t} label="Link" shortcut={["⌘", "K"]} onClick={() => onCommand(t)}><Link2 /></ToolButton>;
      case "image":
        return <ToolButton key={t} label="Imagem" onClick={() => onCommand(t)}><ImagePlus /></ToolButton>;
    }
  };
  return (
    <div role="toolbar" aria-label="Formatação" className={cn("flex min-w-0 items-center gap-1 border-b border-line px-2 py-1.5", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
        {tools.map((g, i) => (
          <div key={i} className="flex shrink-0 items-center gap-0.5">
            {i > 0 && <span aria-hidden className="mx-1 h-4 w-px bg-line" />}
            {g.map(btn)}
          </div>
        ))}
      </div>
      {aside && <div className="flex shrink-0 items-center pl-1">{aside}</div>}
    </div>
  );
}

const exec = (cmd: string, value?: string) => document.execCommand(cmd, false, value);

/**
 * Editor leve. Valor em HTML (controlado). Atalhos de markdown no início da
 * linha: "# ", "## ", "### ", "- ", "1. ", "[] ", "> ", "``` ".
 * Clique no quadradinho de um item de checklist marca/desmarca.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Escreva aqui… use # para títulos, - para listas, [] para checklist",
  label,
  tools,
  aside,
  minHeight = 160,
  readOnly = false,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Rótulo acessível do campo. */
  label: string;
  tools?: RichTextTool[][];
  /** Ação à direita do toolbar (ex.: botão "Melhorar com IA"). */
  aside?: ReactNode;
  minHeight?: number;
  readOnly?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState<Active>({});
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const savedRange = useRef<Range | null>(null);

  // Só reescreve o DOM quando o valor muda de fora (não a cada tecla: perderia o cursor).
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  const emit = useCallback(() => {
    if (ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  const currentBlockEl = () => {
    const sel = window.getSelection();
    let n: Node | null = sel?.anchorNode ?? null;
    while (n && n !== ref.current) {
      if (n instanceof HTMLElement && /^(P|H1|H2|H3|LI|BLOCKQUOTE|PRE|DIV)$/.test(n.tagName)) return n;
      n = n.parentNode;
    }
    return null;
  };
  const closest = (tag: string) => {
    const sel = window.getSelection();
    let n: Node | null = sel?.anchorNode ?? null;
    while (n && n !== ref.current) {
      if (n instanceof HTMLElement && n.tagName === tag) return n;
      n = n.parentNode;
    }
    return null;
  };

  const refresh = useCallback(() => {
    if (!ref.current || !ref.current.contains(window.getSelection()?.anchorNode ?? null)) return;
    const fb = String(document.queryCommandValue("formatBlock") || "p").toLowerCase();
    const ul = closest("UL");
    setActive({
      block: (["h1", "h2", "h3"].includes(fb) ? fb : "p") as Block,
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      strike: document.queryCommandState("strikeThrough"),
      bullet: !!ul && !ul.hasAttribute("data-checklist"),
      ordered: document.queryCommandState("insertOrderedList"),
      checklist: !!ul?.hasAttribute("data-checklist"),
      quote: fb === "blockquote",
      code: fb === "pre" || !!closest("CODE"),
      highlight: !!closest("MARK"),
      alignCenter: document.queryCommandState("justifyCenter"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refresh);
    return () => document.removeEventListener("selectionchange", refresh);
  }, [refresh]);

  const toggleChecklist = () => {
    const ul = closest("UL");
    if (ul?.hasAttribute("data-checklist")) {
      exec("insertUnorderedList");
    } else {
      if (!ul) exec("insertUnorderedList");
      closest("UL")?.setAttribute("data-checklist", "");
    }
  };

  const command = (tool: RichTextTool | "alignCenter" | "alignLeft", v?: string) => {
    ref.current?.focus();
    switch (tool) {
      case "heading":
        exec("formatBlock", v ?? "p");
        break;
      case "bold":
        exec("bold");
        break;
      case "italic":
        exec("italic");
        break;
      case "strike":
        exec("strikeThrough");
        break;
      case "highlight": {
        const mark = closest("MARK");
        if (mark) mark.replaceWith(...Array.from(mark.childNodes));
        else {
          const text = window.getSelection()?.toString();
          if (text) exec("insertHTML", `<mark>${text.replace(/</g, "&lt;")}</mark>`);
        }
        break;
      }
      case "alignCenter":
        exec("justifyCenter");
        break;
      case "alignLeft":
        exec("justifyLeft");
        break;
      case "bullet":
        if (closest("UL")?.hasAttribute("data-checklist")) closest("UL")?.removeAttribute("data-checklist");
        else exec("insertUnorderedList");
        break;
      case "ordered":
        exec("insertOrderedList");
        break;
      case "checklist":
        toggleChecklist();
        break;
      case "quote":
        exec("formatBlock", String(document.queryCommandValue("formatBlock")).toLowerCase() === "blockquote" ? "p" : "blockquote");
        break;
      case "code": {
        const sel = window.getSelection()?.toString();
        if (sel && !sel.includes("\n")) exec("insertHTML", `<code>${sel.replace(/</g, "&lt;")}</code>&nbsp;`);
        else exec("formatBlock", String(document.queryCommandValue("formatBlock")).toLowerCase() === "pre" ? "p" : "pre");
        break;
      }
      case "table":
        exec(
          "insertHTML",
          `<table><thead><tr><th>Coluna</th><th>Coluna</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br></p>`,
        );
        break;
      case "link": {
        const sel = window.getSelection();
        savedRange.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
        setLinkUrl(closest("A")?.getAttribute("href") ?? "https://");
        setLinkOpen(true);
        return;
      }
      case "image":
        fileRef.current?.click();
        return;
    }
    emit();
    refresh();
  };

  const applyLink = () => {
    const sel = window.getSelection();
    ref.current?.focus();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    if (linkUrl && linkUrl !== "https://") {
      if (sel?.toString()) exec("createLink", linkUrl);
      else exec("insertHTML", `<a href="${linkUrl.replace(/"/g, "&quot;")}">${linkUrl}</a>&nbsp;`);
    } else exec("unlink");
    setLinkOpen(false);
    emit();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      command("link");
      return;
    }
    if (e.key !== " ") return;
    const blockEl = currentBlockEl();
    const sel = window.getSelection();
    if (!blockEl || !sel?.anchorNode) return;
    const text = (blockEl.textContent ?? "").slice(0, sel.anchorOffset);
    // Listas: troca o bloco por <ul>/<ol> direto (execCommand aninharia a lista dentro do <p>).
    const toList = (tag: "ul" | "ol", checklist = false) => () => {
      if (blockEl.tagName === "LI") {
        if (checklist) blockEl.parentElement?.setAttribute("data-checklist", "");
        return;
      }
      const list = document.createElement(tag);
      if (checklist) list.setAttribute("data-checklist", "");
      const li = document.createElement("li");
      li.innerHTML = blockEl.innerHTML || "<br>";
      list.appendChild(li);
      blockEl.replaceWith(list);
      const c = document.createRange();
      c.setStart(li, 0);
      c.collapse(true);
      sel.removeAllRanges();
      sel.addRange(c);
    };
    const rules: [string, () => void][] = [
      ["###", () => exec("formatBlock", "h3")],
      ["##", () => exec("formatBlock", "h2")],
      ["#", () => exec("formatBlock", "h1")],
      ["-", toList("ul")],
      ["*", toList("ul")],
      ["1.", toList("ol")],
      ["[]", toList("ul", true)],
      [">", () => exec("formatBlock", "blockquote")],
      ["```", () => exec("formatBlock", "pre")],
    ];
    const hit = rules.find(([k]) => text === k && blockEl.textContent?.startsWith(k));
    if (!hit) return;
    e.preventDefault();
    // apaga o marcador digitado e aplica o bloco
    const range = document.createRange();
    const node = sel.anchorNode;
    range.setStart(node, 0);
    range.setEnd(node, Math.min(hit[0].length, node.textContent?.length ?? 0));
    range.deleteContents();
    // Bloco vazio precisa de um <br> e do cursor DENTRO dele para o comando agir no bloco certo.
    if (!blockEl.textContent) blockEl.innerHTML = "<br>";
    const caret = document.createRange();
    caret.setStart(blockEl, 0);
    caret.collapse(true);
    sel.removeAllRanges();
    sel.addRange(caret);
    hit[1]();
    emit();
  };

  const onClick = (e: React.MouseEvent) => {
    const li = (e.target as HTMLElement).closest("li");
    if (!li || !li.parentElement?.hasAttribute("data-checklist")) return;
    const rect = li.getBoundingClientRect();
    // só o quadradinho (primeiros ~22px) marca; o texto continua editável
    if (e.clientX - rect.left > 22) return;
    e.preventDefault();
    li.toggleAttribute("data-checked");
    emit();
  };

  return (
    <div className={cn("relative min-w-0 overflow-hidden rounded-xl border border-line bg-surface transition-[border-color,box-shadow] focus-within:border-muted focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ds-ink)_6%,transparent)]", className)}>
      {!readOnly && (
        <RichTextToolbar onCommand={command} active={active} tools={tools} aside={aside} />
      )}
      {linkOpen && (
        <div className="flex items-center gap-2 border-b border-line bg-soft/60 px-3 py-2">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") setLinkOpen(false);
            }}
            aria-label="Endereço do link"
            className="ds-bare h-7 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          />
          <button type="button" onClick={applyLink} className="rounded-md px-2 py-1 text-[12.5px] font-medium text-ink hover:bg-surface">
            Aplicar
          </button>
          <button type="button" onClick={() => setLinkOpen(false)} className="rounded-md px-2 py-1 text-[12.5px] text-muted hover:bg-surface">
            Cancelar
          </button>
        </div>
      )}
      <div className="relative">
        {!value.replace(/<[^>]+>|&nbsp;|\s/g, "") && (
          <p aria-hidden className="pointer-events-none absolute left-4 top-3 m-0 text-[14px] text-muted">
            {placeholder}
          </p>
        )}
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          spellCheck
          onInput={emit}
          onKeyDown={onKeyDown}
          onClick={onClick}
          onKeyUp={refresh}
          className={cn("ds-bare px-4 py-3 outline-none", richTextContentClass)}
          style={{ minHeight }}
        />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          ref.current?.focus();
          exec("insertHTML", `<img src="${URL.createObjectURL(f)}" alt="${f.name.replace(/"/g, "")}">`);
          emit();
          e.target.value = "";
        }}
      />
    </div>
  );
}

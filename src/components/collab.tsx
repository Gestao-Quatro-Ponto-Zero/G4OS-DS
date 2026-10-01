"use client";

import { Check, ImagePlus, Paperclip, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Avatar } from "./primitives";

/*
 * Colaboração entre pessoas (não com a IA): conversa do time ao lado de um
 * documento. Mensagens de quem está usando ficam à direita; as dos outros à
 * esquerda, sempre com nome e hora. Ações obrigatórias aparecem como faixa
 * acima do campo, não como mensagem perdida no meio da conversa.
 */

type Author = { name: string; initials: string; tint?: string };

/** Mensagem de uma pessoa: avatar, nome, hora e texto. `mine` alinha à direita. */
export function TeamMessage({ author, time, mine = false, children, className }: { author: Author; time: string; mine?: boolean; children: ReactNode; className?: string }) {
  return (
    <article className={cn("flex", mine ? "justify-end" : "justify-start", className)} aria-label={`${author.name}, ${time}`}>
      <div className={cn("w-fit max-w-[min(85%,520px)] rounded-2xl border border-line bg-surface px-4 py-3 shadow-surface", mine ? "rounded-br-md" : "rounded-bl-md")}>
        <header className="mb-1.5 flex items-center gap-2">
          <Avatar initials={author.initials} tint={author.tint} name={author.name} size="sm" />
          <span className="min-w-0 truncate text-[13px] font-medium">{author.name}</span>
          <time className="ml-auto shrink-0 pl-4 text-[11.5px] tabular-nums text-muted">{time}</time>
        </header>
        <div className="text-[13.5px] leading-relaxed text-ink [overflow-wrap:anywhere] [&_a]:text-blue [&_a]:underline [&_a]:underline-offset-2 [&_p]:my-1.5 first:[&_p]:mt-0 last:[&_p]:mb-0">{children}</div>
      </div>
    </article>
  );
}

/** Separador de data no meio da conversa. */
export function DateSeparator({ children }: { children: ReactNode }) {
  return (
    <div role="separator" className="my-2 flex justify-center">
      <span className="text-[11.5px] tabular-nums text-muted">{children}</span>
    </div>
  );
}

/** "• • •" de alguém digitando. Com `name`, anuncia para leitor de tela. */
export function TypingIndicator({ name, className }: { name?: string; className?: string }) {
  return (
    <div className={cn("flex", className)} role="status" aria-live="polite">
      <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2.5 shadow-surface">
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden className="h-1.5 w-1.5 rounded-full bg-line-strong motion-safe:animate-pulse" style={{ animationDelay: `${i * 180}ms` }} />
        ))}
        <span className="sr-only">{name ? `${name} está digitando` : "Alguém está digitando"}</span>
      </span>
    </div>
  );
}

/**
 * Faixa de ação obrigatória (ex.: "Envie o documento obrigatório") com botão
 * tracejado que também aceita arrastar e soltar. `done` mostra a confirmação.
 */
export function ActionRequiredBanner({
  title,
  description,
  actionLabel = "Enviar",
  accept,
  onFiles,
  done,
  className,
}: {
  title: string;
  description?: ReactNode;
  actionLabel?: string;
  accept?: string;
  onFiles: (files: File[]) => void;
  /** Texto de confirmação depois de resolvido (ex.: "contrato.pdf enviado"). */
  done?: string;
  className?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  if (done)
    return (
      <div role="status" className={cn("flex items-center gap-2 rounded-xl bg-ok-soft px-4 py-3 text-[13px] text-ok", className)}>
        <Check className="h-4 w-4 shrink-0" /> {done}
      </div>
    );
  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-xl bg-rose-soft px-4 py-3", className)} role="region" aria-labelledby={id}>
      <div className="min-w-[200px] flex-1">
        <p id={id} className="m-0 text-[14px] font-medium text-rose">
          {title}
        </p>
        {description && <p className="m-0 mt-0.5 text-[12.5px] text-rose">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length) onFiles(files);
        }}
        className={cn(
          "inline-flex h-10 min-w-[160px] flex-1 items-center justify-center gap-2 rounded-lg border border-dashed px-4 sm:flex-none text-[13px] font-medium text-rose transition-colors",
          over ? "border-rose bg-rose/10" : "border-rose/40 bg-surface/60 hover:bg-surface",
        )}
        style={{ backgroundImage: "radial-gradient(color-mix(in oklab, var(--ds-rose) 22%, transparent) 1px, transparent 1px)", backgroundSize: "8px 8px" }}
      >
        <Upload className="h-4 w-4" /> {over ? "Solte para enviar" : actionLabel}
      </button>
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Campo de mensagem do time: texto, imagem, anexo, "Enviar" (Enter envia; Shift+Enter quebra linha). */
export function TeamComposer({
  value,
  onChange,
  onSend,
  onAttach,
  placeholder = "Escreva uma mensagem",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (v: string) => void;
  onAttach?: (files: File[], kind: "imagem" | "arquivo") => void;
  placeholder?: string;
  className?: string;
}) {
  const img = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const send = () => value.trim() && onSend(value.trim());
  const pick = (kind: "imagem" | "arquivo") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onAttach?.(files, kind);
    e.target.value = "";
  };
  const tool = "grid h-9 w-9 place-items-center rounded-lg bg-soft text-ink-soft hover:bg-line hover:text-ink [&_svg]:h-4 [&_svg]:w-4";
  return (
    <div className={cn("min-w-0", className)}>
      <div className="rounded-xl border border-line bg-surface transition-[border-color,box-shadow] focus-within:border-muted focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ds-ink)_6%,transparent)]">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={3}
          placeholder={placeholder}
          aria-label="Mensagem"
          className="ds-bare block min-h-[88px] w-full resize-none bg-transparent px-4 py-3 text-[14px] outline-none placeholder:text-muted"
        />
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {onAttach && (
          <>
            <button type="button" className={tool} onClick={() => img.current?.click()} aria-label="Enviar imagem">
              <ImagePlus />
            </button>
            <button type="button" className={tool} onClick={() => file.current?.click()} aria-label="Anexar arquivo">
              <Paperclip />
            </button>
            <input ref={img} type="file" accept="image/*" hidden onChange={pick("imagem")} />
            <input ref={file} type="file" hidden onChange={pick("arquivo")} />
          </>
        )}
        <button
          type="button"
          onClick={send}
          disabled={!value.trim()}
          className="ui-button ui-button-primary ml-auto inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13.5px] font-medium text-on-primary hover:bg-primary/90 disabled:opacity-40"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

/**
 * Documento em tipografia de leitura (serifa editorial --ds-font-reading,
 * medida ~68 caracteres). Índice automático dos h2 com destaque da seção lida.
 */
export function ReadingDocument({ title, kicker, children, toc = true, className }: { title?: string; kicker?: ReactNode; children: ReactNode; toc?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<{ id: string; text: string }[]>([]);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !toc) return;
    const hs = Array.from(el.querySelectorAll<HTMLElement>("h2"));
    setItems(
      hs.map((h, i) => {
        if (!h.id) h.id = `doc-${i}-${(h.textContent ?? "").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")}`;
        return { id: h.id, text: h.textContent ?? "" };
      }),
    );
    const scroller = el.closest<HTMLElement>("[data-reading-scroll]") ?? undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { root: scroller, rootMargin: "0px 0px -70% 0px" },
    );
    hs.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [children, toc]);
  return (
    <div className={cn("flex min-w-0 gap-8", className)}>
      <article
        ref={ref}
        className={cn(
          "min-w-0 max-w-[68ch] flex-1 text-[17px] leading-[1.7] text-ink [font-family:var(--ds-font-reading)]",
          "[&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:scroll-mt-6 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:leading-snug [&_h3]:mb-1 [&_h3]:mt-6 [&_h3]:text-[17px] [&_h3]:font-semibold",
          "[&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_a]:text-blue [&_a]:underline [&_a]:underline-offset-2",
          "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ink-soft",
        )}
      >
        {kicker && <p className="!mt-0 mb-2 font-sans text-[12px] font-medium uppercase tracking-[0.1em] text-muted">{kicker}</p>}
        {title && <h1 className="m-0 text-[30px] font-semibold leading-tight tracking-[-0.01em]">{title}</h1>}
        {children}
      </article>
      {toc && items.length > 1 && (
        <nav aria-label="Neste documento" className="sticky top-6 hidden w-48 shrink-0 self-start xl:block">
          <p className="m-0 mb-2 text-[12px] font-medium text-muted">Neste documento</p>
          <ul className="m-0 list-none border-l border-line p-0">
            {items.map((it) => (
              <li key={it.id}>
                <a
                  href={`#${it.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(it.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setActive(it.id);
                  }}
                  aria-current={active === it.id ? "location" : undefined}
                  className={cn("-ml-px block border-l py-1 pl-3 text-[12.5px] leading-snug", active === it.id ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink")}
                >
                  {it.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

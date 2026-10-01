"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { BadgeCheck, ChevronDown, MailPlus, Plus, Sparkles, UserPlus, X } from "lucide-react";
import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { normalize } from "../lib/text";
import { Menu, type MenuEntry } from "./overlays-extra";
import { Avatar } from "./primitives";

/*
 * Escrever e-mail (com ou sem IA): remetente, destinatários com busca,
 * assunto, corpo, modelo e envio com agendamento. Regras:
 *   · destinatário é chip com nome + selo de verificado; e-mail novo vira chip
 *   · rascunho da IA sempre aparece como RASCUNHO até a pessoa enviar
 *   · "Enviar" é a ação principal; agendar/enviar depois ficam no menu ⌄
 */

export type Person = { id: string; name: string; email?: string; initials?: string; tint?: string; verified?: boolean; badge?: ReactNode };

const initialsOf = (p: Person) =>
  p.initials ??
  p.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** Mini avatar (20px) para chips e listas compactas. */
function MiniAvatar({ p }: { p: Person }) {
  return (
    // ds-audit-ignore text-size: iniciais em avatar de 20px (abaixo da escala por geometria)
    <span className="shrink-0 [&_[data-avatar]]:h-5 [&_[data-avatar]]:w-5 [&_[data-avatar]]:text-[8.5px]">
      <Avatar initials={initialsOf(p)} tint={p.tint} size="sm" />
    </span>
  );
}

/** Pessoa como chip: avatar, nome, selo de verificado, remover opcional. */
export function PersonChip({ person, onRemove, className }: { person: Person; onRemove?: () => void; className?: string }) {
  return (
    <span className={cn("inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg bg-surface pl-1.5 text-[13.5px] text-ink ring-1 ring-line", onRemove ? "pr-1" : "pr-2.5", className)} title={person.email}>
      <MiniAvatar p={person} />
      <span className="truncate">{person.name}</span>
      {person.verified && <BadgeCheck className="h-4 w-4 shrink-0 fill-info text-surface" aria-label="Verificado" />}
      {person.badge}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remover ${person.name}`} className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

/**
 * Campo de destinatários: chips + digitação com sugestões em duas seções
 * ("Selecionar pessoa" = e-mails que batem com o texto; "Sugestões" = pessoas
 * frequentes). Teclado: ↑↓ navega, Enter escolhe (ou cria o e-mail digitado),
 * Backspace no vazio remove o último, Esc fecha.
 */
export function RecipientInput({
  value,
  onChange,
  directory,
  suggestions = [],
  placeholder = "Adicionar pessoa",
  label = "Para",
  className,
}: {
  value: Person[];
  onChange: (people: Person[]) => void;
  directory: Person[];
  suggestions?: Person[];
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const taken = new Set(value.map((p) => p.id));
  const n = normalize(q.trim());
  const groups = useMemo(() => {
    const match = (p: Person) => !n || normalize(`${p.name} ${p.email ?? ""}`).includes(n);
    const emails = n ? directory.filter((p) => !taken.has(p.id) && p.email && match(p)).slice(0, 4) : [];
    const sugg = suggestions.filter((p) => !taken.has(p.id) && match(p) && !emails.some((e) => e.id === p.id)).slice(0, 4);
    const out: { label: string; items: { p: Person; asEmail: boolean }[] }[] = [];
    if (emails.length) out.push({ label: "Selecionar pessoa", items: emails.map((p) => ({ p, asEmail: true })) });
    if (sugg.length) out.push({ label: "Sugestões", items: sugg.map((p) => ({ p, asEmail: false })) });
    if (isEmail(q) && !directory.some((p) => p.email === q.trim())) out.unshift({ label: "Novo endereço", items: [{ p: { id: `new:${q.trim()}`, name: q.trim(), email: q.trim() }, asEmail: true }] });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, q, directory, suggestions, value]);
  const flat = groups.flatMap((g) => g.items);
  const add = (p: Person) => {
    onChange([...value, p]);
    setQ("");
    setIdx(0);
    input.current?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || (e.key === "," && q.trim())) {
      if (flat[idx]) {
        e.preventDefault();
        add(flat[idx].p);
      }
    } else if (e.key === "Backspace" && !q && value.length) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };
  const showList = open && flat.length > 0;
  let i = -1;
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <div className="flex flex-wrap items-center gap-1.5" onClick={() => input.current?.focus()}>
        {value.map((p) => (
          <PersonChip key={p.id} person={p} onRemove={() => onChange(value.filter((x) => x.id !== p.id))} />
        ))}
        <span className="flex min-w-[140px] flex-1 items-center gap-1.5 px-1">
          <UserPlus className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setIdx(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKey}
            placeholder={value.length ? "" : placeholder}
            aria-label={label}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-activedescendant={showList && flat[idx] ? `${listId}-${idx}` : undefined}
            autoComplete="off"
            className="ds-bare h-8 min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
          />
        </span>
      </div>
      {showList && (
        <div id={listId} role="listbox" aria-label="Destinatários" className="absolute inset-x-0 top-full z-20 mt-2 max-h-[300px] overflow-y-auto rounded-xl border border-line bg-popover p-1.5 shadow-popup">
          {groups.map((g) => (
            <div key={g.label} role="group" aria-label={g.label} className="pb-1">
              <p className="m-0 px-2.5 pb-1 pt-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">{g.label}</p>
              {g.items.map(({ p, asEmail }) => {
                i += 1;
                const me = i;
                return (
                  <button
                    key={p.id}
                    id={`${listId}-${me}`}
                    type="button"
                    role="option"
                    aria-selected={me === idx}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseMove={() => setIdx(me)}
                    onClick={() => add(p)}
                    className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px]", me === idx ? "bg-ink/[0.06] text-ink" : "text-ink-soft")}
                  >
                    <MiniAvatar p={p} />
                    <span className="min-w-0 truncate">{asEmail ? p.email : p.name}</span>
                    {!asEmail && p.verified && <BadgeCheck className="h-4 w-4 shrink-0 fill-info text-surface" aria-label="Verificado" />}
                    {!asEmail && p.badge}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Botão com ação principal + menu de alternativas (Enviar | ⌄ Agendar…).
 * Para "registrar + novo" lado a lado use Button variant split-left/right.
 */
export function SplitButton({
  children,
  onClick,
  items,
  menuLabel = "Mais opções",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  items: MenuEntry[];
  menuLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex shrink-0 rounded-lg shadow-primary", disabled && "opacity-40 [&>button:last-child]:pointer-events-none", className)}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="ui-button inline-flex min-h-10 items-center gap-2 rounded-l-lg bg-primary px-4 text-[13.5px] font-medium text-on-primary hover:bg-primary/90 [&_svg]:h-4 [&_svg]:w-4"
      >
        {children}
      </button>
      <Menu
        label={menuLabel}
        align="end"
        side="top"
        triggerClassName="!h-10 !w-10 justify-center !gap-0 !rounded-l-none !rounded-r-lg !bg-primary !px-0 !text-on-primary !ring-0 border-l border-on-primary/20 hover:!bg-primary/90 data-popup-open:!bg-primary/85"
        trigger={<ChevronDown />}
        items={items}
      />
    </div>
  );
}

export type ComposeStatus = "draft" | "sending" | "scheduled" | "sent";

const statusLabel: Record<ComposeStatus, { text: string; cls: string }> = {
  draft: { text: "Rascunho", cls: "text-info" },
  sending: { text: "Enviando", cls: "text-amber" },
  scheduled: { text: "Agendado", cls: "text-accent-deep" },
  sent: { text: "Enviado", cls: "text-ok" },
};

type ComposeProps = {
  from: Person;
  to: Person[];
  onToChange: (people: Person[]) => void;
  directory: Person[];
  suggestions?: Person[];
  subject: string;
  onSubjectChange: (v: string) => void;
  body: string;
  onBodyChange: (v: string) => void;
  /** Modelo que escreveu o rascunho (chip no rodapé). */
  model?: { name: string; options?: MenuEntry[] };
  status?: ComposeStatus;
  onSend: () => void;
  /** Itens do menu ⌄ ao lado de Enviar (agendar, enviar amanhã às 8h…). */
  sendOptions?: MenuEntry[];
  /** Menu do "+" (anexar arquivo, inserir modelo, pedir à IA…). */
  addOptions?: MenuEntry[];
  onClose?: () => void;
  title?: string;
  /** Faixa opcional acima do corpo (ex.: aviso "Rascunho gerado pela IA a partir de…"). */
  notice?: ReactNode;
  className?: string;
};

/** Corpo do compositor (use dentro de Modal/Drawer ou numa página). */
export function ComposeEmail({
  from,
  to,
  onToChange,
  directory,
  suggestions,
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  model,
  status = "draft",
  onSend,
  sendOptions = [],
  addOptions,
  onClose,
  title = "Escrever e-mail",
  notice,
  className,
}: ComposeProps) {
  const st = statusLabel[status];
  const rowLabel = "w-12 shrink-0 pt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted";
  return (
    <section className={cn("flex min-h-0 flex-col rounded-2xl bg-popover ring-1 ring-line", className)} aria-label={title}>
      <header className="flex items-center gap-2.5 px-5 pb-3 pt-4">
        <MailPlus className="h-[18px] w-[18px] text-ink-soft" aria-hidden />
        <h2 className="m-0 flex-1 text-[16px] font-medium">{title}</h2>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-8 w-8 place-items-center rounded-lg text-muted ring-1 ring-line hover:bg-soft hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        )}
      </header>
      <div className="space-y-2.5 px-5 pb-3">
        <div className="flex items-start gap-3">
          <span className={rowLabel}>De</span>
          <PersonChip person={from} />
        </div>
        <div className="flex items-start gap-3">
          <span className={rowLabel}>Para</span>
          <RecipientInput value={to} onChange={onToChange} directory={directory} suggestions={suggestions} />
        </div>
      </div>
      <div className="border-t border-line px-5">
        <input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Assunto"
          aria-label="Assunto"
          className="ds-bare h-11 w-full bg-transparent text-[14px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-muted"
        />
      </div>
      {notice && <div className="mx-5 mb-1 rounded-lg bg-info-soft/60 px-3 py-2 text-[12.5px] text-ink-soft">{notice}</div>}
      <div className="min-h-0 flex-1 px-5">
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Escreva a mensagem…"
          aria-label="Mensagem"
          className="ds-bare block h-full min-h-[180px] w-full resize-none bg-transparent py-2 text-[14px] leading-relaxed text-ink outline-none placeholder:text-muted"
        />
      </div>
      <footer className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
        {addOptions ? (
          <Menu label="Adicionar" side="top" triggerClassName="!h-10 !w-10 justify-center !px-0" trigger={<Plus />} items={addOptions} />
        ) : null}
        {model &&
          (model.options ? (
            <Menu
              label={`Modelo: ${model.name}`}
              side="top"
              triggerClassName="!h-10 !gap-2 !px-3 !font-normal"
              trigger={
                <>
                  <Sparkles className="!h-4 !w-4 text-accent" />
                  {model.name}
                </>
              }
              items={model.options}
            />
          ) : (
            <span className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] ring-1 ring-line">
              <Sparkles className="h-4 w-4 text-accent" />
              {model.name}
            </span>
          ))}
        <span className={cn("ml-auto inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em]", st.cls)} aria-live="polite">
          <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
          {st.text}
        </span>
        <SplitButton onClick={onSend} items={sendOptions} menuLabel="Opções de envio" disabled={!to.length || status === "sending"}>
          Enviar
        </SplitButton>
      </footer>
    </section>
  );
}

/** Compositor em modal (sobre a tela atual). */
export function ComposeEmailDialog({ open, onClose, ...props }: ComposeProps & { open: boolean; onClose: () => void }) {
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-[2px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <BaseDialog.Popup className="fixed left-1/2 top-1/2 z-[95] flex max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-[680px] -translate-x-1/2 -translate-y-1/2 flex-col outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
          <BaseDialog.Title className="sr-only">{props.title ?? "Escrever e-mail"}</BaseDialog.Title>
          <ComposeEmail {...props} onClose={onClose} className="min-h-[480px] shadow-overlay" />
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

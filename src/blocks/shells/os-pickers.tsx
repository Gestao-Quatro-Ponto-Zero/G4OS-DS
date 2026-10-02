/*
 * Peças compartilhadas pelos blocos de sessão do G4 OS: ferramentas
 * conectadas (com reconectar), prévia de registro citado, busca na conversa,
 * escolha de contexto e seletor de arquivo do computador. Tudo age no estado
 * do bloco; no app real, troque pelas chamadas da sua API.
 */
import { ExternalLink, FileText, FolderOpen, MessageSquare, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Badge, Button, CommandPalette, Modal, PropertyList, type ConnectedTool } from "@g4ai/ds";
import { contextSources, recordLinks, type ContextSource } from "../data/os-sessions";
import { frameHref } from "./frame-route";

/** Ferramentas conectadas: status, reconectar as que falharam e atalho para conectar outras. */
export function ToolsModal({ open, onClose, tools, onReconnect }: { open: boolean; onClose: () => void; tools: ConnectedTool[]; onReconnect: (tool: ConnectedTool) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const reconnect = (t: ConnectedTool) => {
    setBusy(t.id);
    timer.current = window.setTimeout(() => {
      setBusy(null);
      onReconnect(t);
    }, 900);
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ferramentas conectadas"
      description="O que o agente pode ler e usar nesta conta. Uma ferramenta com erro deixa as rotinas que dependem dela paradas."
      footer={
        <>
          <Button variant="ghost" href={frameHref("app-marketplace")}>
            Conectar outra ferramenta
          </Button>
          <Button onClick={onClose}>Concluir</Button>
        </>
      }
    >
      <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
        {tools.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[11px] font-semibold text-on-ink" style={{ background: t.tint ?? "var(--ds-ink-soft)" }} aria-hidden>
              {t.glyph ?? t.name[0]}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13.5px]">{t.name}</span>
            {t.status === "error" ? (
              <Button size="sm" variant="ghost" onClick={() => reconnect(t)} disabled={busy === t.id}>
                {busy === t.id ? "Reconectando…" : "Reconectar"}
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ok" /> Ativa
              </span>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}

/** Prévia de um registro citado numa resposta (issue, mensagem, tarefa). */
export function RecordModal({ href, label, onClose }: { href: string | null; label?: string; onClose: () => void }) {
  const r = href ? recordLinks[href] : undefined;
  return (
    <Modal
      open={!!href}
      onClose={onClose}
      kicker={r?.from}
      title={r?.title ?? label ?? "Registro"}
      size="sm"
      footer={<Button onClick={onClose}>Fechar</Button>}
    >
      {r ? (
        <div className="space-y-4">
          <PropertyList
            items={[
              { label: "Situação", value: <Badge>{r.status}</Badge> },
              { label: "Atualizado", value: r.updated },
            ]}
          />
          <ul className="m-0 list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-ink-soft">
            {r.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="m-0 flex items-center gap-2 text-[13.5px] text-muted">
          <ExternalLink className="h-4 w-4" aria-hidden /> Este registro não tem prévia disponível.
        </p>
      )}
    </Modal>
  );
}

/** Busca dentro da conversa: escolher uma mensagem rola até ela. */
export function ThreadSearch({ open, onClose, items }: { open: boolean; onClose: () => void; items: { id: string; role: "user" | "assistant"; text: string }[] }) {
  return (
    <CommandPalette
      open={open}
      onClose={onClose}
      placeholder="Buscar nesta conversa…"
      emptyLabel="Nenhuma mensagem com esse texto"
      commands={items
        .filter((m) => m.text.trim())
        .map((m) => ({
          id: m.id,
          label: m.text.length > 90 ? `${m.text.slice(0, 88)}…` : m.text,
          group: m.role === "user" ? "Você" : "Agente",
          icon: m.role === "user" ? <MessageSquare className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />,
          keywords: [m.text],
          onSelect: () => document.getElementById(m.id)?.scrollIntoView({ behavior: "smooth", block: "center" }),
        }))}
    />
  );
}

/** Escolher uma pasta, página ou documento como contexto da sessão. */
export function ContextPicker({ open, onClose, onPick, only }: { open: boolean; onClose: () => void; onPick: (s: ContextSource) => void; only?: ContextSource["from"] }) {
  return (
    <CommandPalette
      open={open}
      onClose={onClose}
      placeholder={only === "Notion" ? "Buscar página do Notion…" : "Buscar pasta, página ou documento…"}
      emptyLabel="Nada encontrado nas ferramentas conectadas"
      commands={contextSources
        .filter((s) => !only || s.from === only)
        .map((s) => ({
          id: s.id,
          label: s.name,
          group: s.from,
          hint: s.kind,
          icon: s.kind === "pasta" ? <FolderOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />,
          onSelect: () => onPick(s),
        }))}
    />
  );
}

/** Seletor de arquivo do sistema: `const [input, pick] = useFilePicker(onFiles)`. Renderize `input`. */
export function useFilePicker(onFiles: (files: File[]) => void, accept?: string) {
  const ref = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={ref}
      type="file"
      hidden
      multiple
      accept={accept}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (files.length) onFiles(files);
      }}
    />
  );
  return [input, () => ref.current?.click()] as const;
}

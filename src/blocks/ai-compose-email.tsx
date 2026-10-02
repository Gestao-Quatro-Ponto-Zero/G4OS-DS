import { CalendarClock, Clock, FileText, ListPlus, Paperclip, Plus, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AiBadge,
  Button,
  ComposeEmail,
  ComposeEmailDialog,
  ComposerChip,
  DateTimePicker,
  Modal,
  Page,
  PageHeading,
  cn,
  formatDate,
  notify,
  type ComposeStatus,
  type MenuEntry,
  type Person,
} from "@g4ai/ds";
import { contacts } from "./data/apps";
import { me } from "./data/workspace";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";
import { StudioShell, studioRoutes } from "./shells/studio-shell";

export const meta = {
  title: "E-mail com IA",
  description: "Rascunhos preparados pelo agente: destinatários com busca e sugestões, modelo, estado RASCUNHO e envio com agendamento.",
  category: "IA",
  height: 900,
  order: 41,
  concept: {
    goal: "Revisar e enviar e-mails que o agente rascunhou, com controle humano sobre destinatários, texto e horário.",
    patterns: [
      "Anatomia F · Mestre-detalhe: rascunhos à esquerda, composer à direita (dialog no celular)",
      "Estado do rascunho sempre visível (Rascunho, Agendado, Enviado)",
      "Destinatários com busca e sugestões; enviar com desfazer; agendar no botão dividido",
    ],
    adapt: [
      "Respostas de atendimento, follow-up de vendas, convites de entrevista no ATS",
    ],
    avoid: [
      "Enviar automaticamente sem passar por revisão",
    ],
  },
} as const;

const directory: Person[] = contacts.map((c) => ({ id: c.id, name: c.name, email: c.email, initials: c.initials, tint: c.tint, verified: c.verified }));
const find = (id: string) => directory.find((p) => p.id === id)!;
const from: Person = { id: me.id, name: me.name, email: me.email, initials: me.initials, tint: me.tint, verified: true };

type Draft = { id: string; reason: string; to: Person[]; subject: string; body: string; status: ComposeStatus; when: string; attachments?: string[] };

/** "Deixar mais curto": mantém saudação, o primeiro parágrafo e a despedida. */
function shorten(body: string) {
  const parts = body.split(/\n\n+/);
  if (parts.length <= 3) return body;
  return [parts[0], parts[1], parts[parts.length - 1]].join("\n\n");
}

/** Dia útil a N dias de hoje (pula sábado e domingo), às 08:00. */
function businessDay(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return `${formatDate(d, { short: true })}, 08:00`;
}

const seed: Draft[] = [
  {
    id: "aurora",
    reason: "Negócio Licenças anuais · sem resposta há 6 dias",
    to: [find("renata"), find("paulo")],
    subject: "Proposta revisada: SLA de 99,9 % e implantação em 60 dias",
    body: "Olá, Renata e Paulo,\n\nRevisamos a proposta com os pontos que o jurídico pediu na nossa última ligação: SLA de 99,9 % com crédito por indisponibilidade e implantação concluída em até 60 dias.\n\nO valor segue R$ 460.800 (240 usuários, 12 meses). Se fizer sentido, consigo uma conversa de 20 minutos na quinta para fechar os detalhes com a diretoria.\n\nAbraço,\nJoana",
    status: "draft",
    when: "há 12 min",
  },
  {
    id: "vertice",
    reason: "Reunião de ontem · próximos passos",
    to: [find("sahkyo")],
    subject: "Resumo da reunião e próximos passos",
    body: "Oi, Saulo,\n\nObrigada pela conversa de ontem. Resumo do que combinamos:\n• piloto em 3 centros de distribuição a partir de 14/10;\n• integração com o ERP no primeiro mês;\n• revisão de resultados em 30 dias.\n\nTe envio o cronograma até sexta.\n\nAbraço,\nJoana",
    status: "draft",
    when: "há 1 h",
  },
  {
    id: "saolucas",
    reason: "Renovação vence em 15 dias",
    to: [find("tuki")],
    subject: "Renovação do contrato · condições para 2027",
    body: "Olá, Tânia,\n\nO contrato vence em 15/10. Preparei duas opções de renovação, com e sem o módulo de agenda. Posso apresentar na próxima semana?\n\nAbraço,\nJoana",
    status: "scheduled",
    when: "amanhã, 08:00",
  },
];

const statusText: Record<ComposeStatus, string> = { draft: "Rascunho", sending: "Enviando", scheduled: "Agendado", sent: "Enviado" };

export default function AiComposeEmail() {
  const current = useFrameParam("id", seed[0].id);
  const [drafts, setDrafts] = useState(seed);
  const [model, setModel] = useState("Opus 4.5");
  const [compose, setCompose] = useState<null | "new" | "draft">(null);
  const [blank, setBlank] = useState<Draft>({ id: "novo", reason: "", to: [], subject: "", body: "", status: "draft", when: "agora" });
  const [isDesktop, setIsDesktop] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const [scheduling, setScheduling] = useState<{ d: Draft; onPatch: (p: Partial<Draft>) => void } | null>(null);
  const [when, setWhen] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const attachTarget = useRef<{ d: Draft; onPatch: (p: Partial<Draft>) => void } | null>(null);

  const draft = drafts.find((d) => d.id === current) ?? drafts[0];
  const patch = (id: string, p: Partial<Draft>) => setDrafts((list) => list.map((d) => (d.id === id ? { ...d, ...p } : d)));

  const send = (d: Draft, onPatch: (p: Partial<Draft>) => void, followUp?: Draft) => {
    onPatch({ status: "sending" });
    setTimeout(() => {
      onPatch({ status: "sent", when: "agora" });
      if (followUp) setDrafts((list) => [...list, followUp]);
      const to = d.to.map((p) => p.name.split(" ")[0]).join(", ");
      notify(followUp ? `E-mail enviado para ${to} · follow-up agendado para ${followUp.when}` : `E-mail enviado para ${to}`, () => {
        onPatch({ status: "draft" });
        if (followUp) setDrafts((list) => list.filter((x) => x.id !== followUp.id));
      });
    }, 700);
  };
  const sendOptions = (d: Draft, onPatch: (p: Partial<Draft>) => void): MenuEntry[] => [
    {
      label: "Agendar para amanhã, 08:00",
      icon: <CalendarClock className="h-4 w-4" />,
      onSelect: () => {
        onPatch({ status: "scheduled", when: "amanhã, 08:00" });
        notify("Envio agendado para amanhã às 08:00", () => onPatch({ status: "draft" }));
      },
    },
    {
      label: "Escolher data e hora…",
      icon: <Clock className="h-4 w-4" />,
      onSelect: () => {
        setWhen("");
        setScheduling({ d, onPatch });
      },
    },
    { type: "separator" },
    {
      label: "Enviar e criar follow-up em 3 dias",
      icon: <ListPlus className="h-4 w-4" />,
      onSelect: () =>
        send(d, onPatch, {
          id: `fu-${d.id}-${Date.now()}`,
          reason: `Follow-up de “${d.subject || "e-mail enviado"}”`,
          to: d.to,
          subject: d.subject ? `Re: ${d.subject}` : "Retomando nossa conversa",
          body: `Olá,\n\nRetomando o e-mail que enviei há alguns dias. Conseguiram avaliar?\n\nAbraço,\n${from.name.split(" ")[0]}`,
          status: "scheduled",
          when: businessDay(3),
        }),
    },
  ];
  const addOptions = (d: Draft, onPatch: (p: Partial<Draft>) => void): MenuEntry[] => {
    const attach = (name: string) => {
      const before = d.attachments ?? [];
      if (before.includes(name)) return notify(`${name} já está anexado`, undefined, "info");
      onPatch({ attachments: [...before, name] });
      notify(`${name} anexado`, () => onPatch({ attachments: before }));
    };
    return [
      {
        label: "Anexar arquivo",
        icon: <Paperclip className="h-4 w-4" />,
        onSelect: () => {
          attachTarget.current = { d, onPatch };
          fileInput.current?.click();
        },
      },
      { label: "Inserir proposta do Drive", icon: <FileText className="h-4 w-4" />, onSelect: () => attach("Proposta-Aurora-v3.pdf") },
      { type: "separator" },
      {
        label: "Pedir à IA: deixar mais curto",
        icon: <Wand2 className="h-4 w-4" />,
        disabled: shorten(d.body) === d.body,
        onSelect: () => {
          const before = d.body;
          onPatch({ body: shorten(before) });
          notify("Texto encurtado", () => onPatch({ body: before }));
        },
      },
    ];
  };
  const modelMenu = { name: model, options: [{ type: "radio" as const, value: model, onValueChange: setModel, options: ["Opus 4.5", "Sonnet 4.5", "Haiku 4.5"].map((m) => ({ value: m, label: m })) }] };

  const composeFor = (d: Draft, onPatch: (p: Partial<Draft>) => void, onClose?: () => void) => ({
    from,
    to: d.to,
    onToChange: (to: Person[]) => onPatch({ to }),
    directory,
    suggestions: [find("tuki"), find("marcos"), find("luiza")],
    subject: d.subject,
    onSubjectChange: (subject: string) => onPatch({ subject }),
    body: d.body,
    onBodyChange: (body: string) => onPatch({ body }),
    model: modelMenu,
    status: d.status,
    onSend: () => send(d, onPatch),
    sendOptions: sendOptions(d, onPatch),
    addOptions: addOptions(d, onPatch),
    onClose,
    notice:
      d.reason || d.attachments?.length ? (
        <span className="flex flex-col gap-2">
          {d.reason && (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Rascunho do agente Williams · {d.reason}
            </span>
          )}
          {!!d.attachments?.length && (
            <span className="flex flex-wrap gap-1.5" aria-label="Anexos">
              {d.attachments.map((a) => (
                <ComposerChip key={a} icon={<Paperclip className="h-3 w-3" />} onRemove={() => onPatch({ attachments: d.attachments?.filter((x) => x !== a) })}>
                  {a}
                </ComposerChip>
              ))}
            </span>
          )}
        </span>
      ) : undefined,
  });

  return (
    <StudioShell current={studioRoutes.compose} mode="agent">
      <Page>
        <div className="mx-auto w-full max-w-[1180px]">
          <PageHeading
            title="E-mails"
            description="Rascunhos que o agente preparou a partir do CRM e das reuniões. Nada sai sem você enviar."
            actions={
              <Button size="sm" onClick={() => setCompose("new")}>
                <Plus /> Novo e-mail
              </Button>
            }
          />
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <ul className="m-0 list-none space-y-2 p-0" aria-label="Rascunhos">
              {drafts.map((d) => {
                const on = d.id === draft.id;
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setFrameQuery({ id: d.id });
                        if (!isDesktop) setCompose("draft");
                      }}
                      aria-current={on ? "true" : undefined}
                      className={cn("relative w-full rounded-xl border px-4 py-3 text-left transition-colors", on ? "border-line-strong bg-ink/[0.04]" : "border-line bg-surface hover:border-line-strong")}
                    >
                      {on && <span aria-hidden className="absolute -left-px top-3 bottom-3 w-[3px] rounded-r-full bg-nav-marker" />}
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{d.to.map((p) => p.name).join(", ") || "Sem destinatário"}</span>
                        <span className="shrink-0 text-[11.5px] text-muted">{d.when}</span>
                      </div>
                      <div className="mt-0.5 truncate text-[13px] text-ink-soft">{d.subject || "Sem assunto"}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={cn(
                            "font-mono text-[10.5px] uppercase tracking-[0.12em]",
                            d.status === "draft" ? "text-info" : d.status === "sent" ? "text-ok" : d.status === "scheduled" ? "text-accent-deep" : "text-amber",
                          )}
                        >
                          ● {statusText[d.status]}
                        </span>
                        {d.reason && <AiBadge />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {isDesktop && <ComposeEmail {...composeFor(draft, (p) => patch(draft.id, p))} className="min-h-[560px]" title={draft.subject ? "Rascunho" : "Escrever e-mail"} />}
          </div>
        </div>
      </Page>
      {/* No celular o rascunho abre em modal; "Novo e-mail" abre em branco em qualquer largura. */}
      <ComposeEmailDialog
        open={compose !== null}
        {...(compose === "draft" ? composeFor(draft, (p) => patch(draft.id, p)) : composeFor(blank, (p) => setBlank((b) => ({ ...b, ...p }))))}
        title={compose === "draft" ? "Rascunho" : "Escrever e-mail"}
        onClose={() => setCompose(null)}
      />
      <input
        ref={fileInput}
        type="file"
        hidden
        multiple
        onChange={(e) => {
          const names = Array.from(e.target.files ?? []).map((f) => f.name);
          e.target.value = "";
          const t = attachTarget.current;
          if (!t || !names.length) return;
          const before = t.d.attachments ?? [];
          t.onPatch({ attachments: [...before, ...names.filter((n) => !before.includes(n))] });
          notify(names.length === 1 ? `${names[0]} anexado` : `${names.length} arquivos anexados`, () => t.onPatch({ attachments: before }));
        }}
      />
      <Modal
        open={!!scheduling}
        onClose={() => setScheduling(null)}
        title="Agendar envio"
        description="O e-mail sai no horário escolhido. Até lá, dá para editar ou cancelar o agendamento."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setScheduling(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!when}
              disabledReason="Escolha a data e a hora"
              onClick={() => {
                if (!scheduling || !when) return;
                const [date, time] = when.split("T");
                const label = `${formatDate(`${date}T12:00:00`, { short: true })}, ${time}`;
                const { onPatch } = scheduling;
                onPatch({ status: "scheduled", when: label });
                setScheduling(null);
                notify(`Envio agendado para ${label}`, () => onPatch({ status: "draft" }));
              }}
            >
              Agendar envio
            </Button>
          </>
        }
      >
        <DateTimePicker label="Data e hora do envio" value={when} onChange={setWhen} className="mb-0" />
      </Modal>
    </StudioShell>
  );
}

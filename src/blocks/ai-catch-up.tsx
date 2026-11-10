import { RotateCcw, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  CatchUpDone,
  CatchUpRow,
  CatchUpRowSkeleton,
  CatchUpSection,
  CatchUpSources,
  Page,
  PageHeading,
  SegmentedControl,
  ToolGlyph,
  catchUpSections,
  notify,
  prefersReducedMotion,
  useVisibleInterval,
  type CatchUpItem,
  type CatchUpSource,
} from "@g4ai/ds";
import { AgentShell, agentRoutes } from "./shells/agent-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Resumo do período",
  description: "\"Enquanto você estava fora\": a IA lê Slack, e-mail, GitHub e tarefas de um período e devolve quatro seções (Precisa de você, Decisões tomadas, Entregue, Para saber). Em Precisa de você, cada linha traz a oferta da IA com a ação.",
  category: "IA",
  order: 8,
  height: 900,
  concept: {
    goal: "Pôr a pessoa em dia em um minuto depois de um dia fora e resolver ali mesmo o que espera por ela, sem abrir quatro apps.",
    patterns: [
      "Anatomia B · Painel em coluna estreita: período no topo, fontes, depois o resumo",
      "Quatro seções fixas, nesta ordem; seção vazia não aparece",
      "Precisa de você: a linha diz o que espera; a oferta da IA diz o que ela faz e leva o primário",
      "Linhas reservadas enquanto o resumo chega; lido recolhe a linha e passa o foco",
    ],
    adapt: [
      "Volta de férias, início do dia, passagem de turno de suporte, resumo de um canal ou projeto",
    ],
    avoid: [
      "Resumo sem as fontes e a contagem do período",
      "Oferecer trabalho em Decisões, Entregue ou Para saber",
      "Executar a oferta sem a pessoa tocar em Fazer",
    ],
  },
} as const;

/* Dados de exemplo NO TOPO do arquivo: troque pela sua API. */
type Range = "1d" | "3d" | "7d";
const ranges: { value: Range; label: string; since: string; from: string; button: string }[] = [
  { value: "1d", label: "Hoje", since: "desde ontem, 18:00", from: "2025-10-26T18:00:00-03:00", button: "Resumir o dia" },
  { value: "3d", label: "3 dias", since: "desde sex., 24/10", from: "2025-10-24T00:00:00-03:00", button: "Resumir 3 dias" },
  { value: "7d", label: "Semana", since: "desde seg., 20/10", from: "2025-10-20T00:00:00-03:00", button: "Resumir a semana" },
];

// ds-audit-ignore-start hex-color: cores de marca das fontes (apps de terceiros)
const icons = {
  slack: <ToolGlyph name="Slack" color="#611f69" />,
  gmail: <ToolGlyph name="Gmail" color="#c5221f" />,
  github: <ToolGlyph name="GitHub" color="#24292f" />,
  linear: <ToolGlyph name="Linear" color="#5e6ad2" />,
};
// ds-audit-ignore-end

const counts: Record<Range, Record<keyof typeof icons, number>> = {
  "1d": { slack: 31, gmail: 4, github: 6, linear: 9 },
  "3d": { slack: 86, gmail: 7, github: 18, linear: 31 },
  "7d": { slack: 204, gmail: 19, github: 41, linear: 77 },
};
const sourceMeta: { id: keyof typeof icons; label: string; unit: string }[] = [
  { id: "slack", label: "Slack", unit: "mensagens" },
  { id: "gmail", label: "Gmail", unit: "conversas" },
  { id: "github", label: "GitHub", unit: "PRs" },
  { id: "linear", label: "Linear", unit: "tarefas" },
];

type Row = CatchUpItem & { occurredAt: string; offer?: string; offerLabel?: string };
const marina = { name: "Marina Couto", initials: "MC", tint: "#7c3aed" };
const rafael = { name: "Rafael Lima", initials: "RL", tint: "#0e7490" };
const bia = { name: "Beatriz Ramos", initials: "BR", tint: "#b45309" };
const caio = { name: "Caio Tavares", initials: "CT", tint: "#be123c" };

const digest: Row[] = [
  {
    id: "n1",
    section: "needs-you",
    source: "Gmail",
    sourceIcon: icons.gmail,
    text: "A Marina pediu a versão final do contrato da Vértice até qui., 30/10.",
    context: "Contrato Vértice · rev. 4",
    when: "dom., 13:10",
    occurredAt: "2025-10-26T13:10:00-03:00",
    people: [marina],
    href: "#",
    offer: "Posso responder à Marina com a rev. 4 em anexo e confirmar a entrega na quinta.",
    offerLabel: "Responder",
  },
  {
    id: "n2",
    section: "needs-you",
    source: "Slack",
    sourceIcon: icons.slack,
    text: "O Rafael espera sua revisão do plano de onboarding desde sexta.",
    context: "#ops-clientes",
    when: "sex., 17:42",
    occurredAt: "2025-10-24T17:42:00-03:00",
    people: [rafael, bia],
    href: "#",
    offer: "Posso ler o plano e deixar três comentários no fio com os pontos em aberto.",
    offerLabel: "Revisar",
  },
  {
    id: "d1",
    section: "decisions",
    source: "Slack",
    sourceIcon: icons.slack,
    text: "O time decidiu adiar a migração do faturamento para 10/11.",
    context: "#financeiro",
    when: "sáb., 10:05",
    occurredAt: "2025-10-25T10:05:00-03:00",
    people: [bia, caio],
    href: "#",
  },
  {
    id: "s1",
    section: "shipped",
    source: "GitHub",
    sourceIcon: icons.github,
    text: "Exportação de CSV com mais de 50 mil linhas foi para produção.",
    context: "PR #418 · app-web",
    when: "seg., 09:12",
    occurredAt: "2025-10-27T09:12:00-03:00",
    people: [caio],
    href: "#",
  },
  {
    id: "s2",
    section: "shipped",
    source: "Linear",
    sourceIcon: icons.linear,
    text: "Os 3 chamados P1 de exportação foram fechados.",
    context: "SUP-221, SUP-224, SUP-230",
    when: "seg., 11:40",
    occurredAt: "2025-10-27T11:40:00-03:00",
    href: "#",
  },
  {
    id: "f1",
    section: "fyi",
    source: "Gmail",
    sourceIcon: icons.gmail,
    text: "A Vértice mudou o ponto focal de compras para a Beatriz.",
    context: "Vértice · Compras",
    when: "sex., 15:20",
    occurredAt: "2025-10-24T15:20:00-03:00",
    people: [bia],
    href: "#",
  },
  {
    id: "f2",
    section: "fyi",
    source: "Slack",
    sourceIcon: icons.slack,
    text: "O guia de passagem de turno foi atualizado com os contatos de plantão.",
    context: "#ops-clientes",
    when: "ter., 14:30",
    occurredAt: "2025-10-21T14:30:00-03:00",
    href: "#",
  },
];

type Phase = "idle" | "reading" | "writing" | "ready" | "error" | "stopped";
const STEP_MS = 420;

export default function CatchUp() {
  const [range, setRange] = useState<Range>("3d");
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [failGmail, setFailGmail] = useState(false);
  const [stoppedAt, setStoppedAt] = useState<number | null>(null);
  const current = ranges.find((r) => r.value === range)!;
  const periodDigest = digest.filter((item) => Date.parse(item.occurredAt) >= Date.parse(current.from));
  const total = Object.values(counts[range]).reduce((a, b) => a + b, 0);
  const startRef = useRef<() => void>(() => {});

  function start(gmailFailure = failGmail) {
    setFailGmail(gmailFailure);
    setRead(new Set());
    setStoppedAt(null);
    if (prefersReducedMotion()) {
      setStep(sourceMeta.length + periodDigest.length);
      setPhase(gmailFailure ? "error" : "ready");
      return;
    }
    setStep(0);
    setPhase("reading");
  }
  startRef.current = start;

  // Simulação: lê uma fonte por passo, depois escreve uma linha por passo.
  useVisibleInterval(
    () => {
      setStep((s) => {
        const next = s + 1;
        if (phase === "reading" && next >= sourceMeta.length) {
          if (failGmail) setPhase("error");
          else setPhase("writing");
        }
        if (phase === "writing" && next >= sourceMeta.length + periodDigest.length) setPhase("ready");
        return next;
      });
    },
    phase === "reading" || phase === "writing" ? STEP_MS : null,
  );

  // Trocar o período com um resumo aberto refaz o resumo.
  const firstRange = useRef(true);
  useEffect(() => {
    if (firstRange.current) {
      firstRange.current = false;
      return;
    }
    setPhase((p) => {
      if (p !== "idle") requestAnimationFrame(() => startRef.current());
      return p;
    });
  }, [range]);

  const sources: CatchUpSource[] = sourceMeta.map((s, i) => ({
    id: s.id,
    label: s.label,
    icon: icons[s.id],
    count: counts[range][s.id],
    unit: s.unit,
    state:
      phase === "idle"
        ? "idle"
        : phase === "error" && s.id === "gmail"
          ? "error"
          : i < step
            ? "done"
            : phase === "reading" && i === step
              ? "reading"
              : "idle",
  }));

  const written = stoppedAt ?? (phase === "ready" || phase === "error" ? periodDigest.length : Math.max(0, step - sourceMeta.length));
  const visible = periodDigest.filter((d, i) => !read.has(d.id) && i < written && (phase !== "error" || d.source !== "Gmail"));
  const writing = phase === "reading" || phase === "writing";
  const left = visible.length;

  const markRead = (ids: string[]) => setRead((s) => new Set([...s, ...ids]));

  return (
    <AgentShell current={agentRoutes.workspace}>
      <Page width="reading">
        <PageHeading
          kicker="seg., 27/10"
          title="Enquanto você estava fora"
          description={`${total} atualizações ${current.since}`}
          actions={<SegmentedControl label="Período" value={range} onChange={setRange} options={ranges.map((r) => ({ value: r.value, label: r.label }))} />}
        />

        <div className="flex flex-col gap-5 pb-10" data-catch-up="">
          <section aria-label="Fontes do resumo" className="rounded-xl border border-line bg-surface px-4 py-3">
            <CatchUpSources sources={sources} />
          </section>

          <div className="sr-only" role="status" aria-live="polite">
            {phase === "reading" ? "Lendo as fontes" : phase === "writing" ? "Escrevendo o resumo" : phase === "ready" ? `${left} itens no resumo` : phase === "error" ? "O Gmail não respondeu" : ""}
          </div>

          {phase === "idle" && (
            <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-line px-4 py-5">
              <p className="m-0 text-[13.5px] text-ink-soft">O resumo traz o que espera você, o que foi decidido, o que saiu e o que vale saber.</p>
              <Button onClick={() => start()} data-catch-up-fallback="">
                <Sparkles className="h-4 w-4" aria-hidden /> {current.button}
              </Button>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-rose-soft px-4 py-3 text-[13px] text-ink" role="alert">
              O Gmail não respondeu. O resumo saiu sem ele.
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => start(false)}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Tentar de novo
              </Button>
            </div>
          )}

          {phase === "stopped" && (
            <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-soft px-4 py-3 text-[13px] text-ink">
              <p className="m-0 flex-1">Resumo interrompido. {written === 0 ? "A leitura parou antes de gerar itens." : "O conteúdo abaixo é parcial."}</p>
              <Button variant="ghost" size="sm" onClick={() => start()}>Refazer resumo</Button>
            </div>
          )}

          {phase !== "idle" && (phase !== "stopped" || left > 0) && (
            <article aria-busy={writing || undefined} aria-label="Resumo" className="flex flex-col gap-5 rounded-xl border border-line bg-surface px-4 py-4">
              {left === 0 && !writing ? (
                <CatchUpDone action={<Button variant="ghost" size="sm" onClick={() => start()} data-catch-up-fallback="">Resumir de novo</Button>}>
                  Nada mais {current.since}. As próximas novidades aparecem aqui.
                </CatchUpDone>
              ) : (
                catchUpSections.map((section) => {
                  const all = periodDigest.filter((d) => d.section === section.id && (phase !== "error" || d.source !== "Gmail"));
                  const rows = all.filter((d) => !read.has(d.id));
                  const shown = rows.filter((d) => periodDigest.indexOf(d) < written);
                  const pending = writing ? rows.length - shown.length : 0;
                  if (!shown.length && !pending) return null;
                  return (
                    <CatchUpSection key={section.id} section={section.id} count={writing ? undefined : shown.length}>
                      {shown.map((d) => (
                        <CatchUpRow
                          key={d.id}
                          item={d}
                          onOpen={() => notify(`Abriria ${d.context ?? d.source}`, undefined, "info")}
                          onRead={(id) => markRead([id])}
                          action={
                            d.offer ? (
                              <Button size="sm" onClick={() => { markRead([d.id]); notify(`Pedido enviado ao agente: ${d.offerLabel?.toLowerCase()}`); }}>
                                {d.offerLabel}
                              </Button>
                            ) : undefined
                          }
                        >
                          {d.offer && (
                            <p className="m-0 flex items-start gap-1.5 rounded-lg bg-soft px-2.5 py-2 text-[12.5px] leading-snug text-ink-soft">
                              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-deep" aria-hidden />
                              {d.offer}
                            </p>
                          )}
                        </CatchUpRow>
                      ))}
                      {Array.from({ length: pending }, (_, i) => (
                        <CatchUpRowSkeleton key={`s${i}`} />
                      ))}
                    </CatchUpSection>
                  );
                })
              )}
              <footer className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden /> Resumido pelo Agente G4
                </span>
                <span className="ml-auto flex items-center gap-1">
                  {writing ? (
                    <Button variant="ghost" size="sm" onClick={() => { setStoppedAt(written); setPhase("stopped"); }}>
                      <Square className="h-3.5 w-3.5" aria-hidden /> Parar
                    </Button>
                  ) : (
                    <>
                      {left > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => { const before = read; markRead(visible.map((v) => v.id)); notify(`${left} itens marcados como lidos`, () => setRead(before)); }}>
                          Marcar tudo como lido
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => start(true)}>
                        Simular falha
                      </Button>
                    </>
                  )}
                </span>
              </footer>
            </article>
          )}
        </div>
      </Page>
    </AgentShell>
  );
}

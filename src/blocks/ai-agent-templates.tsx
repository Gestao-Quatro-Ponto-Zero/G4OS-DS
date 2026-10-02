import { BadgeCheck, Clock, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AgentComposer,
  Badge,
  Button,
  Empty,
  FilterChip,
  Page,
  PageHeading,
  PageToolbar,
  TableSearch,
  ToolGlyph,
  formatNumber,
  normalize,
} from "@g4ai/ds";
import { apps } from "./data/agent-builder";
import { agentById, templateCategories, templates, type TemplateCategory } from "./data/agents";
import { AgentListError, AgentListSkeleton, AgentShell, agentRoutes, useAgentDemoState } from "./shells/agent-shell";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Descobrir agentes",
  description: "Galeria de modelos de agente por categoria (Vendas, Financeiro, Suporte, Pessoas, Operações): ferramentas que cada um usa, quantas equipes usam, quem criou e tempo para configurar. 'Usar modelo' abre o construtor; campo de pedido para começar do zero.",
  category: "IA",
  order: 10.2,
  height: 1080,
  concept: {
    goal: "Quem ainda não sabe o que automatizar encontra um ponto de partida testado por outras equipes e sai com um agente em rascunho em minutos.",
    patterns: [
      "Anatomia A · Lista (galeria): cabeçalho fixo + PageToolbar com categorias e busca",
      "Cartão = ferramentas (glifos), nome, uma frase, prova social (equipes) e autor",
      "Um primário por cartão: 'Usar modelo' abre o construtor com ?modelo=",
      "Pedido livre no topo para quem prefere descrever do zero",
    ],
    adapt: [
      "Galeria de automações, modelos de relatório, playbooks de atendimento",
    ],
    avoid: [
      "Cartões com ilustração genérica no lugar das ferramentas reais",
      "Usar modelo publicando direto (sempre nasce rascunho)",
    ],
  },
} as const;

type Cat = "todos" | TemplateCategory;

export default function AiAgentTemplates() {
  const estado = useAgentDemoState();
  const cat = (useFrameParam("categoria", "todos") as Cat) ?? "todos";
  const [q, setQ] = useState("");
  const [prompt, setPrompt] = useState("");
  const source = useMemo(() => (estado === "vazio" ? [] : templates), [estado]);
  const shown = useMemo(() => source.filter((t) => (cat === "todos" || t.category === cat) && (!q || normalize(`${t.name} ${t.description} ${t.author}`).includes(normalize(q)))), [source, cat, q]);
  const count = (c: TemplateCategory) => source.filter((t) => t.category === c).length;

  return (
    <AgentShell current={agentRoutes.templates}>
      <Page>
        <PageHeading
          crumbs={[{ label: "Agentes", href: agentRoutes.agents }]}
          title="Descobrir agentes"
          description="Modelos prontos, testados por outras equipes. Todo agente criado a partir de um modelo nasce como rascunho."
          actions={
            <Button variant="ghost" href={`${agentRoutes.builder}?novo=1`}>
              <Plus /> Começar do zero
            </Button>
          }
        />
        <section aria-label="Descrever um agente" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <p className="m-0 mb-3 text-[14px] font-medium">Não achou? Descreva o que o agente deve fazer</p>
          <AgentComposer value={prompt} onChange={setPrompt} onSubmit={(v) => v.trim() && go("ai-agent-builder", { pedido: v.trim() })} placeholder="Ex.: quando um cliente pedir cancelamento, junte o histórico e avise o executivo da conta" />
        </section>

        <div className="mt-6 space-y-4">
          <PageToolbar>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Categoria" className="flex flex-wrap gap-1.5">
                <FilterChip on={cat === "todos"} onClick={() => setFrameQuery({ categoria: undefined })}>
                  Todos
                </FilterChip>
                {templateCategories.map((c) => (
                  <FilterChip key={c} on={cat === c} onClick={() => setFrameQuery({ categoria: c })}>
                    {c} <span className="tabular-nums text-muted">{count(c)}</span>
                  </FilterChip>
                ))}
              </div>
              <div className="ml-auto w-full sm:w-[280px]">
                <TableSearch value={q} onChange={setQ} total={source.length} noun="modelo" searchIn="nome, descrição e autor" />
              </div>
            </div>
          </PageToolbar>

          {estado === "carregando" ? (
            <AgentListSkeleton rows={6} label="Carregando modelos" />
          ) : estado === "erro" ? (
            <AgentListError noun="os modelos" />
          ) : !source.length ? (
            <Empty title="Nenhum modelo publicado ainda" hint="Os modelos do Time G4 e os que sua equipe compartilhar aparecem aqui." action={<Button href={`${agentRoutes.builder}?novo=1`}>Começar do zero</Button>} />
          ) : !shown.length ? (
            <Empty
              title="Nenhum modelo com esses filtros"
              hint="Tente outra palavra ou veja todas as categorias."
              action={
                <Button
                  variant="ghost"
                  onClick={() => {
                    setQ("");
                    setFrameQuery({ categoria: undefined });
                  }}
                >
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((t) => {
                const live = agentById(t.basedOn);
                return (
                  <li key={t.id} className="flex flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex flex-wrap gap-1">
                        {t.apps.map((id) => (
                          <ToolGlyph key={id} name={apps[id].name} color={apps[id].color} size={22} />
                        ))}
                        {t.extra?.map((x) => (
                          <span key={x} className="inline-flex h-[22px] items-center rounded-md bg-soft px-1.5 text-[11px] text-muted ring-1 ring-line">
                            {x}
                          </span>
                        ))}
                      </span>
                      <Badge>{t.category}</Badge>
                    </div>
                    <h2 className="m-0 mt-3 text-[15px] font-medium">{t.name}</h2>
                    <p className="m-0 mt-1 flex-1 text-[13px] leading-relaxed text-ink-soft">{t.description}</p>
                    <p className="m-0 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> usado por {formatNumber(t.teams)} equipes
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {t.setupMinutes} min para configurar
                      </span>
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                      <span className="inline-flex min-w-0 items-center gap-1 truncate text-[12px] text-muted">
                        {t.official && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-ink" aria-label="Oficial" />}
                        por {t.author}
                      </span>
                      <span className="flex shrink-0 gap-1">
                        {live && (
                          <Button size="sm" variant="quiet" href={frameHref("ai-agent", live.id)}>
                            Ver na frota
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" href={frameHref("ai-agent-builder", { modelo: t.id })}>
                          Usar modelo
                        </Button>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Page>
    </AgentShell>
  );
}

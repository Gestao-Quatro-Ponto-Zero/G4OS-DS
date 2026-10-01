import { CalendarClock, Globe, Mail, MessageSquare, Pause, Play, Plus, Sparkles, Target, Wand2, Zap } from "lucide-react";
import { useState } from "react";
import {
  AppIcon,
  Button,
  ConnectionsCard,
  Page,
  PageHeading,
  Switch,
  notify,
  type AgentConnection,
  type Subagent,
} from "@g4os/ds";
import { agent, appById } from "./data/apps";
import { go, goTo } from "./shells/frame-route";
import { StudioShell, studioRoutes } from "./shells/studio-shell";

export const meta = {
  title: "Agente e conexões",
  description: "Página do agente: o que ele acessa (conexões), quem ele aciona (subagentes com estado), o que entrega (resultados), gatilhos e instruções.",
  category: "IA",
  height: 900,
  order: 40,
  concept: {
    goal: "Mostrar de uma vez o que um agente acessa, quem ele aciona e o que entrega, para o dono do agente confiar e ajustar permissões.",
    patterns: [
      "Anatomia C · Registro: cabeçalho fixo com Testar/Pausar, conteúdo à esquerda e cartão de conexões fixo à direita",
      "ConnectionsCard em três blocos: conexões (✓/Conectar), subagentes com estado, resultados",
      "Conectar acontece no lugar, com desfazer",
      "Gatilhos com switch: liga/desliga sem formulário",
    ],
    adapt: [
      "Página de integração de um usuário, bot de atendimento, robô de cobrança",
      "Troque 'subagentes' por 'etapas' quando o agente for uma automação linear",
    ],
    avoid: [
      "Esconder permissões de escrita no meio da lista de leitura",
    ],
  },
} as const;

const subIcons = { brand: Target, creative: Wand2, ads: Sparkles } as const;
// ds-audit-ignore-start hex-color: cores de identidade dos subagentes
const subColors = { brand: "#e8590c", creative: "#e03131", ads: "#0c8599" } as const;
// ds-audit-ignore-end

export default function AiAgentConnections() {
  const [active, setActive] = useState(true);
  const [linked, setLinked] = useState<Record<string, boolean>>({ "meta-ads": true, "google-ads": true, site: true, shopify: false });
  const [selected, setSelected] = useState("site");
  const [instructions, setInstructions] = useState(agent.instructions);
  const [triggers, setTriggers] = useState([
    { id: "t1", icon: CalendarClock, text: "Toda segunda-feira às 8h", on: true },
    { id: "t2", icon: Zap, text: "Nova campanha publicada no Meta Ads", on: true },
    { id: "t3", icon: MessageSquare, text: "Menção a @williams em #marketing no Slack", on: false },
  ]);

  const connections: AgentConnection[] = agent.connections.map((id) => {
    if (id === "site") {
      return { id, name: agent.site.name, icon: Globe, color: "var(--ds-accent)", status: selected === id ? "active" : "connected", onClick: () => setSelected(id) };
    }
    const app = appById(id)!;
    return {
      id,
      name: app.name,
      icon: app.icon,
      color: app.color,
      status: !linked[id] ? "available" : selected === id ? "active" : "connected",
      onClick: () => go("app-connection", id),
      onConnect: () => {
        setLinked((l) => ({ ...l, [id]: true }));
        notify(`${app.name} liberado para o ${agent.name}`, () => setLinked((l) => ({ ...l, [id]: false })));
      },
    };
  });
  const subagents: Subagent[] = agent.subagents.map((s) => ({
    id: s.id,
    name: s.name,
    icon: subIcons[s.id as keyof typeof subIcons],
    color: subColors[s.id as keyof typeof subColors],
    status: active ? s.status : "idle",
    onClick: () => goTo(studioRoutes.trace),
  }));
  const results = agent.results.map((r) => ({ ...r, onClick: () => goTo(studioRoutes.workspace) }));

  return (
    <StudioShell current={studioRoutes.home} mode="agent">
      <Page>
        <div className="mx-auto w-full max-w-[1120px]">
          <PageHeading
            crumbs={[{ label: "Agentes", href: studioRoutes.home }, { label: agent.name }]}
            title={agent.name}
            description={`${agent.role}. ${agent.description}`}
            actions={
              <>
                <Button variant="ghost" size="sm" onClick={() => goTo(`${studioRoutes.sessions}?novo=${encodeURIComponent("Williams: rodar o relatório semanal agora")}`)}>
                  <Play /> Testar agora
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setActive((a) => !a);
                    notify(active ? `${agent.name} pausado` : `${agent.name} ativo de novo`, () => setActive((a) => !a));
                  }}
                >
                  {active ? <Pause /> : <Play />} {active ? "Pausar" : "Ativar"}
                </Button>
              </>
            }
          />

          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 space-y-8">
              <section>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="m-0 text-[15px] font-medium">Gatilhos</h2>
                    <p className="m-0 mt-0.5 text-[12.5px] text-muted">O agente roda quando qualquer uma destas condições acontece.</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => notify("Exemplo: abre a escolha de gatilho (agenda, evento de app, menção)", undefined, "info")}>
                    <Plus /> Adicionar
                  </Button>
                </div>
                <ul className="m-0 mt-3 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                  {triggers.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                      <t.icon className="h-4 w-4 shrink-0 text-muted" />
                      <span className={t.on ? "min-w-0 flex-1 text-[13.5px]" : "min-w-0 flex-1 text-[13.5px] text-muted"}>{t.text}</span>
                      <Switch
                        label={t.text}
                        hideLabel
                        checked={t.on}
                        onCheckedChange={(v) => setTriggers((list) => list.map((x) => (x.id === t.id ? { ...x, on: v } : x)))}
                        className="h-6"
                      />
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="m-0 text-[15px] font-medium">Instruções</h2>
                <p className="m-0 mt-0.5 text-[12.5px] text-muted">O que o agente faz quando roda. Escreva como para uma pessoa do time.</p>
                <div className="focus-field mt-3 rounded-xl border border-line bg-surface">
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    aria-label="Instruções do agente"
                    rows={6}
                    className="ds-bare block w-full resize-y rounded-xl bg-transparent px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none"
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2 text-[12px] text-muted">
                    <span>{instructions.length} caracteres</span>
                    <Button size="sm" variant="quiet" onClick={() => notify("Instruções salvas")}>
                      Salvar instruções
                    </Button>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="m-0 text-[15px] font-medium">Entregas desta semana</h2>
                <ul className="m-0 mt-3 list-none space-y-2 p-0">
                  {[
                    { icon: Mail, text: "Rascunho de e-mail para o Grupo Aurora sobre o novo plano de mídia", cta: "Revisar", href: studioRoutes.compose },
                    { icon: Sparkles, text: "6 variações de anúncio para a campanha de outubro", cta: "Ver criativos", href: studioRoutes.conversation },
                  ].map((e) => (
                    <li key={e.text} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                      <AppIcon icon={e.icon} color="var(--ds-accent)" size="sm" variant="soft" />
                      <span className="min-w-0 flex-1 text-[13.5px]">{e.text}</span>
                      <Button size="sm" variant="ghost" href={e.href}>
                        {e.cta}
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="page-aside">
              <ConnectionsCard
                name={agent.name}
                scope={agent.scope}
                avatar={<AppIcon icon={Sparkles} color="var(--ds-accent)" size="md" variant="soft" />}
                connections={connections}
                subagents={subagents}
                results={results}
                footer={
                  <button type="button" onClick={() => goTo(studioRoutes.apps)} className="text-[12.5px] font-medium text-blue hover:underline">
                    Gerenciar conexões no marketplace →
                  </button>
                }
              />
              <p className="m-0 mt-3 px-2 text-[12px] leading-relaxed text-muted">
                {active ? "Ponto âmbar = subagente executando agora." : "Agente pausado: nenhum subagente roda até você ativar."} Clique numa conexão para ver as permissões.
              </p>
            </div>
          </div>
        </div>
      </Page>
    </StudioShell>
  );
}

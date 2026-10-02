import { Badge, RevisionTimeline, Timeline, type Revision } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Histórico e versões",
  group: "Ações e exibição",
  order: 62,
  description: "Timeline com coluna de versão vira changelog; RevisionTimeline navega revisões dia a dia com um dial (versões de agente, documento, configuração).",
};

const notes = (items: string[]) => (
  <ul className="m-0 list-disc space-y-1 pl-4">
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);

const revisions: Revision[] = [
  { id: "r1", date: "2026-09-08", time: "10:12", author: "Ana Lopes", kind: "major", title: "v1.0 · primeira versão em produção", content: notes(["Qualifica leads do formulário do site.", "Cria negócio no CRM quando a nota passa de 70."]) },
  { id: "r2", date: "2026-09-12", time: "15:40", author: "Diego Araújo", title: "Ajuste no prompt de qualificação", content: notes(["Pergunta sobre orçamento antes do tamanho do time.", "Tom mais curto nas mensagens de WhatsApp."]) },
  { id: "r3", date: "2026-09-19", time: "09:05", author: "Ana Lopes", kind: "major", title: "v1.1 · consulta ao ERP", content: notes(["Nova ferramenta: consultar clientes no ERP antes de criar o negócio.", "Evita duplicar contas que já compram."]) },
  { id: "r4", date: "2026-09-23", time: "18:22", author: "Carla Nogueira", title: "Limite de custo por execução", content: notes(["Teto de R$ 0,40 por execução.", "Acima disso, pede aprovação humana."]) },
  {
    id: "r5",
    date: "2026-09-29",
    time: "11:47",
    author: "Ana Lopes",
    kind: "major",
    title: "v1.2 · passagem para o vendedor",
    tag: <Badge tone="ok">Em produção</Badge>,
    content: notes(["Agenda a reunião direto na agenda do vendedor do território.", "Resumo da conversa anexado ao negócio.", "Avaliação: 92 % dos casos passaram (era 87 %)."]),
  },
];

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Changelog com Timeline" rule="Versão e data à esquerda, o que mudou à direita. A versão em produção leva `current`. No celular a coluna sobe para cima do título.">
        <Demo
          className="block max-w-[680px]"
          code={`<Timeline items={[
  { id: "v12", current: true, leading: <><b>v1.2</b><br />29 set</>, title: "Passagem para o vendedor", body: "Agenda a reunião…" },
  { id: "v11", leading: <><b>v1.1</b><br />19 set</>, title: "Consulta ao ERP", body: "…" },
]} />`}
        >
          <Timeline
            items={[
              { id: "v12", current: true, leading: <VersionCell v="v1.2" d="29 set 2026" />, title: <span className="inline-flex items-center gap-2">Passagem para o vendedor <Badge tone="ok">Em produção</Badge></span>, body: "Agenda a reunião na agenda do vendedor do território e anexa o resumo da conversa ao negócio." },
              { id: "v11", leading: <VersionCell v="v1.1" d="19 set 2026" />, title: "Consulta ao ERP", body: "Nova ferramenta para checar se o lead já é cliente antes de criar o negócio." },
              { id: "v101", leading: <VersionCell v="v1.0.1" d="12 set 2026" />, title: "Ajuste no prompt de qualificação", body: "Pergunta sobre orçamento antes do tamanho do time; mensagens mais curtas no WhatsApp." },
              { id: "v10", leading: <VersionCell v="v1.0" d="08 set 2026" />, title: "Primeira versão em produção", body: "Qualifica leads do formulário do site e cria negócio quando a nota passa de 70." },
            ]}
          />
        </Demo>
        <PropsTable
          rows={[
            ["items[].leading", "ReactNode", "—", "Coluna à esquerda (versão + data). Some no celular e vai para cima do título."],
            ["items[].current", "boolean", "false", "Item vigente: ponto vazado em destaque e “(atual)” para leitor de tela."],
            ["items[].tone", "Tone", '"neutral"', "Cor do ponto, para eventos de exceção (falha, alerta)."],
            ["leadingWidth", "number", "96", "Largura da coluna em px."],
          ]}
        />
      </DocSection>

      <DocSection title="RevisionTimeline" rule="Para navegar revisões no tempo: o dial mostra a cadência (dias com e sem mudança) e o painel mostra o que mudou. Uma revisão por dia; a mais recente abre por padrão.">
        <Demo
          className="block max-w-[560px]"
          code={`<RevisionTimeline today="2026-10-01" revisions={[
  { id: "r1", date: "2026-09-08", kind: "major", title: "v1.0 · primeira versão", author: "Ana Lopes", time: "10:12", content: <Notas /> },
  { id: "r5", date: "2026-09-29", kind: "major", title: "v1.2 · passagem para o vendedor", tag: <Badge tone="ok">Em produção</Badge>, content: <Notas /> },
]} />`}
        >
          <RevisionTimeline revisions={revisions} today="2026-10-01" />
        </Demo>
        <Rules
          items={[
            { do: "Use para histórico com cadência: versões de agente, alterações de configuração, revisões de documento.", dont: "Usar como linha do tempo de atividades (use ActivityFeed) ou como changelog longo (use Timeline com leading)." },
            { do: "Diga o que mudou em itens curtos; marque a versão em produção com um selo.", dont: "Colocar o diff inteiro no painel; abra um Drawer para isso." },
          ]}
        />
        <PropsTable
          rows={[
            ["revisions", "Revision[]", "—", "{ id, date (ISO), title, time?, author?, kind?, tag?, content? }."],
            ["value · defaultValue · onChange", "string", "a mais recente", "Revisão aberta (controlada ou não)."],
            ["today", "string (ISO)", "hoje", "Dias depois dele são tracejados (futuro)."],
            ["padDays · futureDays", "number", "14 · 7", "Dias vazios antes da primeira revisão e depois de hoje."],
            ["height", "number", "—", "Altura fixa do painel (rola por dentro)."],
            ["label", "string", '"Histórico de revisões"', "Nome acessível do dial (←/→, Home, End)."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

function VersionCell({ v, d }: { v: string; d: string }) {
  return (
    <>
      <span className="block font-mono text-[12.5px] font-semibold text-ink">{v}</span>
      <span className="block text-[11.5px] tabular-nums text-muted">{d}</span>
    </>
  );
}

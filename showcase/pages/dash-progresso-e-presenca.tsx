import { UserPlus } from "lucide-react";
import { Badge, Button, IconButton, LocationTag, MiniBarChart, ProjectProgressCard, StackedList, formatCurrency, notify, type StackedListItem } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Progresso, presença e mini gráfico",
  group: "Dashboards",
  order: 45,
  description: "ProjectProgressCard (projeto com marcos e próximo passo), MiniBarChart (atividade em barrinhas), StackedList (quem está online + diretório) e LocationTag (lugar e hora local).",
};

const people: StackedListItem[] = [
  { id: "1", name: "Ana Lopes", status: "online", description: "Online", meta: <Badge>Gestora</Badge>, keywords: "vendas" },
  { id: "2", name: "Diego Araújo", status: "online", description: "Online", meta: <Badge>Vendas</Badge> },
  { id: "3", name: "Carla Nogueira", status: "away", description: "Visto há 17 min", meta: <Badge>Financeiro</Badge> },
  { id: "4", name: "Bruno Takeda", status: "offline", description: "Visto há 2 h", meta: <Badge>Dados</Badge> },
  { id: "5", name: "Juliana Rocha", status: "online", description: "Online", meta: <Badge>Pessoas</Badge> },
  { id: "6", name: "Marcos Vieira", status: "offline", description: "Visto ontem", meta: <Badge>Suporte</Badge> },
  { id: "7", name: "Renata Farias", status: "busy", description: "Em reunião", meta: <Badge>Jurídico</Badge> },
];

const week = [
  { label: "Seg", value: 412 },
  { label: "Ter", value: 538 },
  { label: "Qua", value: 301 },
  { label: "Qui", value: 604 },
  { label: "Sex", value: 487 },
  { label: "Sáb", value: 122 },
  { label: "Dom", value: 98 },
];

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="ProjectProgressCard" rule="Um projeto, um cartão: quem responde, até quando, onde está e o que fazer agora. Um só botão (o próximo passo). Prazo estourado pinta só a data, com a palavra “Atrasado”.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo
            className="block"
            code={`<ProjectProgressCard
  title="Implantação do ERP · Distribuidora Andrade"
  subtitle="Go-live na filial Recife"
  owner="Carla Nogueira" due="2026-10-24"
  milestones={[
    { id: "1", title: "Cadastro de produtos", status: "done", date: "2026-09-05" },
    { id: "2", title: "Integração com a SEFAZ", status: "done", date: "2026-09-19" },
    { id: "3", title: "Treinamento do time", status: "current", description: "2 de 4 turmas" },
    { id: "4", title: "Go-live", status: "todo", date: "2026-10-24" },
  ]}
  action={<Button>Agendar turma 3</Button>}
/>`}
          >
            <ProjectProgressCard
              title="Implantação do ERP · Distribuidora Andrade"
              subtitle="Go-live na filial Recife"
              owner="Carla Nogueira"
              due="2026-10-24"
              milestones={[
                { id: "1", title: "Cadastro de produtos e tabelas de preço", status: "done", date: "2026-09-05" },
                { id: "2", title: "Integração com a SEFAZ (NF-e)", status: "done", date: "2026-09-19" },
                { id: "3", title: "Treinamento do time", status: "current", description: "2 de 4 turmas concluídas" },
                { id: "4", title: "Go-live", status: "todo", date: "2026-10-24" },
              ]}
              action={<Button onClick={() => notify("Turma 3 agendada para 08/10")}>Agendar turma 3</Button>}
            />
          </Demo>
          <Demo className="block" title="Atrasado" code={`<ProjectProgressCard late due="2026-09-26" … />`}>
            <ProjectProgressCard
              title="Rollout do agente de cobrança v2"
              subtitle="Do piloto (10 %) para toda a carteira"
              owner="Ana Lopes"
              due="2026-09-26"
              late
              milestones={[
                { id: "1", title: "Avaliação ≥ 90 %", status: "done", date: "2026-09-15" },
                { id: "2", title: "Piloto com 10 % da carteira", status: "current", description: "Aguardando aprovação do jurídico" },
                { id: "3", title: "50 % da carteira", status: "todo" },
                { id: "4", title: "100 % da carteira", status: "todo" },
              ]}
              action={
                <Button variant="ghost" onClick={() => notify("Lembrete enviado ao jurídico")}>
                  Cobrar aprovação do jurídico
                </Button>
              }
            />
          </Demo>
        </div>
        <PropsTable
          rows={[
            ["milestones", "{ id, title, description?, status, date? }[]", "—", 'status: "done" | "current" | "todo". Um "current" por vez.'],
            ["owner · due · late", "ReactNode · ISO · boolean", "—", "Responsável, prazo e se está vencido."],
            ["action", "ReactNode", "—", "O próximo passo: um Button (primário, ou ghost se houver outro primário na área)."],
          ]}
        />
      </DocSection>

      <DocSection title="MiniBarChart" rule="Barrinhas para cadência (7 dias, 12 meses, 24 h) num espaço pequeno. Em repouso mostra o último ponto; ao apontar ou com ←/→, o ponto escolhido. Barras em tinta, sem cor de série.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Demo className="block" code={`<MiniBarChart label="Execuções do agente" caption="Últimos 7 dias" data={[{ label: "Seg", value: 412 }, …]} />`}>
            <MiniBarChart label="Execuções do agente" caption="Últimos 7 dias" data={week} />
          </Demo>
          <Demo className="block" title="Com formato" code={`<MiniBarChart label="Custo por dia" format={(n) => formatCurrency(n)} data={…} />`}>
            <MiniBarChart label="Custo por dia" caption="Últimos 7 dias" format={(n) => formatCurrency(n)} data={week.map((d) => ({ ...d, value: d.value * 0.31 }))} />
          </Demo>
        </div>
        <Rules items={[{ do: "Use em cartões de painel e colunas laterais, com uma pergunta clara no label.", dont: "Comparar séries ou mostrar eixos: para isso, BarChart dentro de ChartCard." }]} />
      </DocSection>

      <DocSection title="StackedList" rule="O recorte que importa agora (quem está online) fica à vista; o total fica empilhado no rodapé e abre por cima do cartão, com busca. Esc fecha e o foco volta para a barra.">
        <Demo
          className="block max-w-[420px]"
          code={`<StackedList
  title="Online agora"
  directoryLabel="Time comercial"
  action={<IconButton label="Convidar pessoa"><UserPlus /></IconButton>}
  items={[{ id: "1", name: "Ana Lopes", status: "online", description: "Online", meta: <Badge>Gestora</Badge> }, …]}
/>`}
        >
          <StackedList
            title="Online agora"
            directoryLabel="Time comercial"
            action={
              <IconButton label="Convidar pessoa" onClick={() => notify("Convite enviado")}>
                <UserPlus />
              </IconButton>
            }
            items={people}
          />
        </Demo>
        <PropsTable
          rows={[
            ["items", "StackedListItem[]", "—", "{ id, name, status?, description?, meta?, href?, onClick?, keywords? }."],
            ["featured", "(item) => boolean", 'status === "online"', "Quem aparece em destaque."],
            ["directoryLabel · directoryHint", "string · ReactNode", '"Todas as pessoas"', "Título e linha de apoio da barra e do diretório."],
            ["height", "number", "420", "Altura do cartão (o diretório abre dentro dela)."],
          ]}
        />
      </DocSection>

      <DocSection title="LocationTag" rule="Lugar com hora local no fuso dele (atualiza sozinha). O fuso completo fica no tooltip. Estado do lugar sempre com palavra.">
        <Demo
          className="flex flex-wrap gap-2"
          code={`<LocationTag place="São Paulo, SP" timeZone="America/Sao_Paulo" />
<LocationTag place="CD Recife" timeZone="America/Recife" status={{ label: "Operando", tone: "ok" }} />
<LocationTag place="Lisboa, Portugal" timeZone="Europe/Lisbon" />`}
        >
          <LocationTag place="São Paulo, SP" timeZone="America/Sao_Paulo" />
          <LocationTag place="CD Recife" timeZone="America/Recife" status={{ label: "Operando", tone: "ok" }} />
          <LocationTag place="CD Manaus" timeZone="America/Manaus" status={{ label: "Fechado", tone: "neutral" }} />
          <LocationTag place="Lisboa, Portugal" timeZone="Europe/Lisbon" />
        </Demo>
        <PropsTable
          rows={[
            ["place", "string", "—", "“Cidade, UF” ou nome do local."],
            ["timeZone", "string (IANA)", "do navegador", "Fuso do lugar."],
            ["status", "{ label, tone? }", "—", "Estado com palavra (Operando, Fechado, Em manutenção)."],
            ["showTime", "boolean", "true", "Esconde a hora quando o fuso não importa."],
            ["href", "string", "—", "Vira link (abre o local, filial ou região)."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

import { Bot, Briefcase, Building2, FileSignature, Handshake, Landmark, LayoutDashboard, Megaphone, Package, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, Card, CardAction } from "@g4ai/ds";
import { DocPage, DocSection, type PageMeta } from "../kit";
import { GuideTable } from "./_guia-table";

export const meta: PageMeta = {
  title: "Receitas por tipo de app",
  group: "Começar",
  order: 4,
  description: "Como montar um CRM, um ATS, um ERP (de produtos ou de serviços), um financeiro, um SaaS, um portal do cliente, uma gestão de contratos, uma comunicação interna ou uma plataforma de agentes de IA com os mesmos componentes e blocos.",
};

type Recipe = { icon: ReactNode; title: string; href: string; entities: string[]; screens: string; doc: string };

const recipes: Recipe[] = [
  {
    icon: <Handshake />,
    title: "CRM",
    href: "#/blocos/crm",
    entities: ["Empresa", "Contato", "Negócio", "Atividade"],
    screens: "Dashboard de vendas, pipeline em quadro, página do negócio com StagePath, lista de contatos com ações em massa.",
    doc: "docs/receitas/crm.md",
  },
  {
    icon: <Briefcase />,
    title: "ATS",
    href: "#/blocos/ats",
    entities: ["Vaga", "Candidato", "Candidatura", "Entrevista", "Avaliação"],
    screens: "Funil de recrutamento, pipeline da vaga, perfil do candidato com scorecards, agenda de entrevistas.",
    doc: "docs/receitas/ats.md",
  },
  {
    icon: <Package />,
    title: "ERP",
    href: "#/blocos/erp",
    entities: ["Pedido", "Produto", "Estoque", "Fornecedor", "Nota fiscal"],
    screens: "Painel de operação, pedidos com faturamento em massa, estoque com mínimo, página do pedido.",
    doc: "docs/receitas/erp.md",
  },
  {
    icon: <Wrench />,
    title: "ERP de serviços",
    href: "#/blocos/servicos",
    entities: ["Cliente", "Ordem de serviço", "Orçamento", "Contrato", "NFS-e", "Cobrança"],
    screens: "Início com caixa e filas, OS em quadro com SLA, agenda dos técnicos, NFS-e em lote, cobrança com régua.",
    doc: "docs/receitas/erp-servicos.md",
  },
  {
    icon: <Landmark />,
    title: "Financeiro",
    href: "#/blocos/financeiro",
    entities: ["Lançamento", "Conta bancária", "Categoria", "Fatura"],
    screens: "Visão financeira com fluxo de caixa, contas a receber/pagar, conciliação, DRE.",
    doc: "docs/receitas/financeiro.md",
  },
  {
    icon: <LayoutDashboard />,
    title: "SaaS / produto",
    href: "#/blocos/saas",
    entities: ["Conta", "Usuário", "Assinatura", "Evento"],
    screens: "Dashboard de produto, análises, clientes, configurações, login e onboarding.",
    doc: "docs/padroes/dashboards.md",
  },
  {
    icon: <Building2 />,
    title: "Portal do cliente",
    href: "#/blocos/autenticacao",
    entities: ["Projeto", "Entrega", "Documento", "Fatura", "Solicitação"],
    screens: "Início com próximo passo, aceite de entregas, documentos, faturas. Menos densidade, mais explicação.",
    doc: "docs/receitas/portal-do-cliente.md",
  },
  {
    icon: <FileSignature />,
    title: "Contratos (CLM)",
    href: "#/blocos/contratos",
    entities: ["Contrato", "Contraparte", "Modelo", "Cláusula", "Obrigação"],
    screens: "Painel de vencimentos e avisos prévios, carteira com visões salvas, aprovação por diferença, assinatura e prazos.",
    doc: "docs/receitas/contratos.md",
  },
  {
    icon: <Megaphone />,
    title: "Comunicação interna",
    href: "#/blocos/comunicacao",
    entities: ["Comunicado", "Canal", "Pessoa", "Evento", "Pesquisa"],
    screens: "Mural com leituras obrigatórias, comunicado com confirmação, conversas, diretório, eventos, eNPS e alcance.",
    doc: "docs/receitas/comunicacao-interna.md",
  },
  {
    icon: <Bot />,
    title: "Agentes de IA",
    href: "#/blocos/ia",
    entities: ["Agente", "Versão", "Execução", "Aprovação", "Avaliação"],
    screens: "Painel da frota, agentes com custo e orçamento, trace da execução, aprovações humanas, avaliações e governança.",
    doc: "docs/receitas/agentes-ia.md",
  },
];

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Escolha o ponto de partida" rule="Cada card leva à categoria de blocos. Copie o bloco mais próximo, troque os dados do topo do arquivo e siga a receita em docs/receitas.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recipes.map((r) => (
            <Card key={r.title} href={r.href} className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <span className="inline-grid h-8 w-8 place-items-center rounded-lg bg-soft text-ink-soft [&_svg]:h-4 [&_svg]:w-4">{r.icon}</span>
                <span className="text-[14px] font-medium">{r.title}</span>
              </div>
              <p className="m-0 mt-2.5 text-[12.5px] leading-relaxed text-muted">{r.screens}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {r.entities.map((e) => (
                  <Badge key={e}>{e}</Badge>
                ))}
              </div>
              <div className="mt-auto pt-3">
                <CardAction>Ver blocos</CardAction>
                <code className="mt-1 block truncate font-mono text-[11px] text-muted">{r.doc}</code>
              </div>
            </Card>
          ))}
        </div>
      </DocSection>

      <DocSection title="O mesmo esqueleto em todo app" rule="Mudam as entidades e os nomes das etapas; a estrutura é a mesma.">
        <GuideTable
          head={["Tela", "Tipo de página", "Componentes", "Exemplos"]}
          mono={[2]}
          rows={[
            ["Início", "dashboard", "KpiGrid + ChartCard + ListPanel", "3–5 KPIs, tendência principal, “Precisa de você”."],
            ["Lista da entidade", "página global", "PageHeading + TableToolbar + DataTable + Pagination", "Negócios, Vagas, Pedidos, Lançamentos."],
            ["Quadro por etapa", "mesma lista", "KanbanBoard + KanbanColumn + RecordCard", "Alternado com a lista por SegmentedControl."],
            ["Registro", "página de registro", "ContextBar + StagePath + SplitLayout + PropertyList", "Negócio, Candidato, Pedido."],
            ["Entidade com seções", "página com abas", "EntityHeader + Tabs", "Empresa, Vaga, Produto."],
            ["Criar / editar", "drawer", "Drawer + FieldBlock + OperationButton", "Formulário sem perder a lista."],
            ["Configurações", "página", "navegação secundária + ReadingColumn", "Equipe, campos, integrações, cobrança."],
            ["Entrar / onboarding", "tela cheia", "blocos de Autenticação e Onboarding", "OTP, link mágico, primeiros passos."],
          ]}
        />
      </DocSection>

      <DocSection title="Glossário: um nome por conceito" rule="Defina no começo e use em sidebar, título, botão, toast e e-mail.">
        <GuideTable
          head={["App", "Use", "Evite misturar com"]}
          mono={[]}
          rows={[
            ["CRM", "Negócio, Contato, Empresa, Atividade, Funil", "deal, oportunidade, lead no mesmo app"],
            ["ATS", "Vaga, Candidato, Etapa, Entrevista, Proposta", "job, aplicação, processo"],
            ["ERP", "Pedido, Produto, Estoque, Fornecedor, Nota fiscal", "ordem, item, SKU na interface"],
            ["Financeiro", "Conta a pagar, Conta a receber, Lançamento, Conciliação", "título e boleto como sinônimos"],
            ["ERP de serviços", "Ordem de serviço (OS), Orçamento, Contrato, Cobrança", "chamado, ticket, proposta"],
            ["Contratos", "Contrato, Contraparte, Aditivo, Aviso prévio, Obrigação", "fornecedor e cliente quando a lista mistura os dois"],
            ["Comunicação interna", "Comunicado (oficial), Mensagem (conversa), Leitura obrigatória", "post, aviso e mensagem como sinônimos"],
            ["Agentes de IA", "Agente, Execução, Aprovação, Avaliação, Créditos", "run, job, eval, bot na interface"],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

import { Building, Folder, FolderOpen, Landmark, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { Accordion, Collapsible, DescriptionToggle, FieldBlock, Switch, TreeView, fieldClass, type TreeNode } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Accordion, árvore e recolhíveis",
  group: "Navegação",
  order: 40,
  description: "Revelação progressiva: mostre o essencial e deixe o resto a um clique. Accordion para várias seções, Collapsible para uma opcional, TreeView para hierarquias, DescriptionToggle para texto longo.",
};

const contas: TreeNode[] = [
  {
    id: "1",
    label: "1 · Receitas",
    icon: <Wallet />,
    meta: "R$ 2,4 mi",
    children: [
      { id: "1.1", label: "1.1 · Assinaturas", meta: "R$ 1,9 mi" },
      { id: "1.2", label: "1.2 · Serviços", meta: "R$ 410 mil", children: [{ id: "1.2.1", label: "1.2.1 · Implantação", meta: "R$ 260 mil" }, { id: "1.2.2", label: "1.2.2 · Consultoria", meta: "R$ 150 mil" }] },
      { id: "1.3", label: "1.3 · Treinamentos", meta: "R$ 90 mil" },
    ],
  },
  {
    id: "2",
    label: "2 · Despesas",
    icon: <Landmark />,
    meta: "R$ 1,7 mi",
    children: [
      { id: "2.1", label: "2.1 · Pessoal", meta: "R$ 1,1 mi", children: [{ id: "2.1.1", label: "2.1.1 · Salários", meta: "R$ 860 mil" }, { id: "2.1.2", label: "2.1.2 · Benefícios", meta: "R$ 240 mil" }] },
      { id: "2.2", label: "2.2 · Infraestrutura", meta: "R$ 320 mil" },
      { id: "2.3", label: "2.3 · Marketing", meta: "R$ 280 mil" },
    ],
  },
  { id: "3", label: "3 · Centros de custo", icon: <Building />, children: [{ id: "3.1", label: "Comercial", icon: <Users /> }, { id: "3.2", label: "Produto", icon: <Folder /> }] },
];

export default function Page() {
  const [sel, setSel] = useState("1.2.1");
  const [adv, setAdv] = useState(false);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Accordion" rule="Seções do mesmo nível: FAQ, configurações longas, etapas de um checklist. `multiple` deixa várias abertas; `plain` tira a moldura para uso dentro de card.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo title="Card, uma por vez" className="block p-0 border-0" bare code={`<Accordion items={[{ id: "prazo", title: "Qual o prazo de implantação?", content: "…" }]} defaultOpen={["prazo"]} />`}>
            <Accordion
              defaultOpen={["prazo"]}
              items={[
                { id: "prazo", title: "Qual o prazo de implantação?", content: "Entre 4 e 6 semanas para até 50 usuários. Projetos com integração ao ERP somam 2 semanas." },
                { id: "migra", title: "Vocês migram os dados do sistema atual?", content: "Sim. Importamos contatos, empresas e negócios por planilha ou API, com validação linha a linha." },
                { id: "contrato", title: "Posso cancelar a qualquer momento?", content: "Planos mensais cancelam a qualquer momento. Planos anuais têm multa proporcional de 20 %." },
                { id: "suporte", title: "Como funciona o suporte?", hint: "Plano Pro e acima", content: "Chat em horário comercial e gerente de conta dedicado a partir de 25 usuários." },
              ]}
            />
          </Demo>
          <Demo title="Plain, várias abertas" className="block" code={`<Accordion variant="plain" multiple items={…} />`}>
            <Accordion
              variant="plain"
              multiple
              defaultOpen={["a", "b"]}
              items={[
                { id: "a", title: "Dados da empresa", hint: "Completo", content: "Razão social, CNPJ e endereço fiscal validados." },
                { id: "b", title: "Usuários e permissões", hint: "3 de 8 convites aceitos", content: "Carla, Bruno e Elisa já entraram. Reenvie os convites pendentes em Configurações › Equipe." },
                { id: "c", title: "Integrações", hint: "Nenhuma conectada", content: "Conecte e-mail e agenda para registrar atividades automaticamente." },
              ]}
            />
          </Demo>
        </div>
      </DocSection>

      <DocSection title="Collapsible" rule="Uma seção opcional dentro de um formulário ou painel. O rótulo diz o que tem dentro.">
        <Demo className="block" code={`<Collapsible label="Opções avançadas">…</Collapsible>`}>
          <FieldBlock label="Nome do funil">
            <input className={fieldClass} defaultValue="Vendas B2B" />
          </FieldBlock>
          <Collapsible label="Opções avançadas" className="mt-3">
            <div className="rounded-xl border border-line bg-soft/40 p-4">
              <Switch label="Exigir motivo de perda" checked={adv} onCheckedChange={setAdv} />
              <p className="m-0 mt-1 text-[12.5px] text-muted">Negócios só vão para “Perdido” com um motivo escolhido.</p>
            </div>
          </Collapsible>
        </Demo>
      </DocSection>

      <DocSection title="TreeView" rule="Hierarquia navegável: pastas, plano de contas, centros de custo, estrutura de times. Teclado de árvore completo (↑↓ →← Home End Enter).">
        <Demo className="grid gap-6 md:grid-cols-[320px_1fr]" code={`<TreeView label="Plano de contas" nodes={contas} selected={sel} onSelect={(n) => setSel(n.id)} defaultExpanded={["1", "1.2"]} />`}>
          <div className="rounded-xl border border-line bg-rail p-2">
            <TreeView label="Plano de contas" nodes={contas} selected={sel} onSelect={(n) => setSel(n.id)} defaultExpanded={["1", "1.2"]} />
          </div>
          <div className="flex items-center gap-3 text-[13px] text-muted">
            <FolderOpen className="h-4 w-4" /> Selecionado: <span className="font-medium text-ink">{sel}</span>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="DescriptionToggle" rule="Texto longo (descrição de vaga, nota de reunião) recortado com “Ver mais”. O botão só aparece se o texto passar do limite.">
        <Demo className="block max-w-[560px]" code={`<DescriptionToggle lines={3}>{descricao}</DescriptionToggle>`}>
          <DescriptionToggle lines={3}>
            Procuramos uma pessoa para liderar o time de pré-vendas (6 SDRs), responsável por desenhar a cadência de prospecção, definir critérios de qualificação junto ao time de marketing e garantir a passagem de bastão para os executivos de conta. Você vai trabalhar com dados do CRM todos os dias, conduzir 1:1s semanais, contratar e treinar novos SDRs e reportar para a diretoria comercial. Experiência prévia com vendas B2B de ticket médio acima de R$ 30 mil é essencial; experiência com SaaS é um diferencial.
          </DescriptionToggle>
        </Demo>
        <PropsTable
          rows={[
            ["Accordion.items", "{ id, title, content, hint?, disabled? }[]", "—", "Seções."],
            ["Accordion.multiple", "boolean", "false", "Várias abertas ao mesmo tempo."],
            ["Accordion.variant", '"card" | "plain"', '"card"', "plain para dentro de card."],
            ["TreeView.nodes", "TreeNode[]", "—", "{ id, label, icon?, meta?, children? }"],
            ["TreeView.onSelect", "(node) => void", "—", "Sem ele, clicar só expande."],
            ["DescriptionToggle.lines", "number", "3", "Linhas antes do corte."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Esconder o opcional e o detalhe.", dont: "Esconder erro, preço, prazo ou o que é preciso para decidir." },
            { do: "Primeira seção aberta quando a pessoa chega para agir nela.", dont: "Accordion com uma seção só — use Collapsible." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

// Tarefas do eval: pedidos realistas, como um time pediria a um agente num app que usa o DS.
// Cada tarefa vira uma rota do starter Vite (templates/vite-app) que o avaliador abre no navegador.
export const TASKS = [
  {
    id: "vagas-lista",
    route: "/vagas",
    file: "src/pages/Vagas.tsx",
    prompt:
      "Crie a tela de lista de vagas do nosso ATS em src/pages/Vagas.tsx e registre a rota /vagas (e um item na sidebar). Precisa de busca, filtros por status (aberta, pausada, encerrada) e por área, seleção de várias vagas com ações em massa (arquivar e trocar recrutador responsável), paginação e um botão para criar vaga. Use uns 30 registros fictícios realistas no topo do arquivo.",
    expects: { list: true, bulk: true, currency: false },
  },
  {
    id: "cliente-registro",
    route: "/clientes/acme",
    file: "src/pages/Cliente.tsx",
    prompt:
      "Crie a página de registro de um cliente B2B em src/pages/Cliente.tsx e registre a rota /clientes/acme. Mostre identificação do cliente, situação (ativo/inadimplente), abas Visão geral, Pedidos e Notas, propriedades (CNPJ, segmento, responsável, limite de crédito) ao lado do conteúdo e um jeito de editar os dados sem sair da página. Dados fictícios no topo.",
    expects: { record: true, currency: true },
  },
  {
    id: "migrar-faturas",
    route: "/faturas",
    file: "src/pages/Faturas.tsx",
    fixtures: { "src/legacy/Faturas.tsx": "fixtures/Faturas.tsx" },
    prompt:
      "Migre a tela legada src/legacy/Faturas.tsx (feita com shadcn/Tailwind cru) para o design system do projeto, mantendo o comportamento. Coloque a versão nova em src/pages/Faturas.tsx, registre a rota /faturas e a entrada na sidebar.",
    expects: { list: true, bulk: true, currency: true, migration: true },
  },
  {
    id: "config-automacao",
    route: "/automacoes",
    file: "src/pages/Automacoes.tsx",
    prompt:
      "Crie a tela de configurações de uma automação 'Pedido de forecast' em src/pages/Automacoes.tsx e registre a rota /automacoes. A pessoa escolhe os dias da semana em que o pedido sai, o horário, a data de início, quais cargos recebem o pedido (são uns 12 cargos, vários podem ser escolhidos), liga/desliga a automação e salva. Existe um modo demonstração (flag no topo do arquivo) em que nada pode ser salvo: os controles de gravação ficam desabilitados explicando o motivo.",
    expects: { form: true, disabledReason: true },
  },
  {
    id: "dashboard-financeiro",
    route: "/financeiro",
    file: "src/pages/Financeiro.tsx",
    prompt:
      "Crie o dashboard financeiro em src/pages/Financeiro.tsx e registre a rota /financeiro: receita, despesas, saldo e inadimplência do mês com comparação ao mês anterior, gráfico de fluxo de caixa dos últimos 6 meses, contas a receber que vencem nos próximos 7 dias e um filtro de período. Os dados vêm de uma função assíncrona fictícia (simule atraso), então trate carregando e erro.",
    expects: { dashboard: true, currency: true, async: true },
  },
  {
    id: "migrar-automacoes",
    route: "/automacoes-legado",
    file: "src/pages/AutomacoesLegado.tsx",
    fixtures: { "src/legacy/Automacoes.tsx": "fixtures/Automacoes.tsx" },
    prompt:
      "Migre a tela legada src/legacy/Automacoes.tsx para o design system do projeto, mantendo o comportamento e o modo demonstração. Coloque a versão nova em src/pages/AutomacoesLegado.tsx e registre a rota /automacoes-legado com um item na sidebar.",
    expects: { form: true, disabledReason: true, migration: true, runs: true },
  },
];

export const HARNESS_RULES = `
Regras do ambiente de avaliação (não fazem parte do pedido):
- Trabalhe só neste diretório. Não instale pacotes, não rode servidor de desenvolvimento nem navegador.
- Pode rodar: npx tsc --noEmit, npx g4os-ds audit src, npx g4os-ds doctor, npx eslint src.
- Termine quando a tela estiver pronta e as verificações acima limpas.`;

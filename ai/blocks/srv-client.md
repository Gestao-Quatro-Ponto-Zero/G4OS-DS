# Cliente do ERP de serviços

- Arquivo: `src/blocks/srv-client.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Serviços
- Preview: showcase `#/frame/srv-client` (`?theme=dark` para o escuro)

Registro do cliente (?id=): receita recorrente, saldo em aberto e vencido, contratos, ordens de serviço, orçamentos, notas e cobranças, anotações da equipe e dados cadastrais (CNPJ, ISS retido, endereço com hora local). Edição em gaveta.

## Conceito

**Objetivo:** Antes de ligar para o cliente, saber tudo em um lugar: o que ele paga, o que está aberto, o que deve e o que a equipe combinou.

**Padrões aplicados**

- Anatomia C · Registro: trilha para Clientes, ação primária Abrir OS, resto no menu ⋯; dados cadastrais fixos na coluna
- Faixa de números (StatGrid) com recorrente, em aberto, vencido e OS abertas
- Abas: Ordens de serviço, Contratos e orçamentos, Financeiro (notas + cobranças), Anotações (Timeline)
- Inadimplente vira Callout com a saída (enviar 2ª via, ver cobranças)
- Editar cadastro em Drawer; ISS retido como Switch com explicação

**Quando usar e o que adaptar**

- Página do condomínio numa administradora, do paciente numa clínica, do aluno numa escola

**Evite**

- Herdar o cabeçalho da lista (registro tem o próprio)
- Saldo devedor escondido numa aba

## Componentes usados

`ActionMenu`, `Badge`, `Button`, `Callout`, `Column`, `DataTable`, `Drawer`, `Empty`, `EntityMark`, `LocationTag`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `SplitLayout`, `StatCell`, `StatGrid`, `Switch`, `Tabs`, `TextField`, `TextareaField`, `Timeline`, `TimelineItem`, `formatCurrency`, `formatDate`, `notify`, `useOperation`

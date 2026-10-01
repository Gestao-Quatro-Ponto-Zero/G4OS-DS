# Relatórios

- Arquivo: `src/blocks/saas-reports.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-reports` (`?theme=dark` para o escuro)

Modelos prontos, relatórios salvos com agendamento, execução manual e criação com destinatários.

## Conceito

**Objetivo:** Gerar e agendar relatórios recorrentes para quem precisa receber números sem entrar no app.

**Padrões aplicados**

- Anatomia A · Lista: modelos prontos + relatórios salvos
- Agendamento e execução manual
- Criação com destinatários em modal

**Quando usar e o que adaptar**

- Relatórios do financeiro, do recrutamento, de operações

**Evite**

- Relatório sem dono nem próxima execução visível

## Componentes usados

`ActionMenu`, `Avatar`, `Badge`, `Button`, `Card`, `Column`, `DataTable`, `FieldBlock`, `FieldGrid`, `Modal`, `Page`, `PageHeading`, `Select`, `Sparkline`, `TagInput`, `TextField`, `formatDate`, `notify`

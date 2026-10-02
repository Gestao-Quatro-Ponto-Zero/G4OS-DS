# Modelos e cláusulas

- Arquivo: `src/blocks/clm-templates.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Contratos
- Preview: showcase `#/frame/clm-templates` (`?theme=dark` para o escuro)

Modelos de contrato aprovados pelo Jurídico (versão, última revisão, uso, quem pode usar sem o Jurídico) e a biblioteca de cláusulas com o texto padrão, orientação de uso e alternativas pré-aprovadas por risco e alçada.

## Conceito

**Objetivo:** Manter os modelos e as cláusulas que o Jurídico aceita num só lugar, para que as áreas peçam contratos sem reinventar texto e a aprovação só olhe o que foge disso.

**Padrões aplicados**

- Anatomia A · Lista (modelos) com Drawer de detalhe por ?modelo=; Anatomia F · Mestre-detalhe (cláusulas) com ?clausula=
- Revisão vencida (mais de 1 ano) aparece com palavra, não só cor
- Quem pode usar: áreas com autoatendimento e limite de valor
- Alternativas aprovadas com risco, alçada e quantas vezes foram usadas
- Propor alternativa e criar modelo em Drawer, com operação e aviso ao terminar
- Cinco estados: ?estado=carregando|vazio|erro

**Quando usar e o que adaptar**

- Políticas internas, modelos de proposta comercial, biblioteca de respostas de RFP

**Evite**

- Cláusula alternativa sem dizer quem pode aprovar
- Editar o modelo publicado direto: nova versão passa por revisão

## Componentes usados

`Avatar`, `Badge`, `Button`, `Callout`, `Drawer`, `Empty`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `Select`, `Tabs`, `TextField`, `TextareaField`, `formatCurrency`, `formatDate`, `formatNumber`, `plural`, `useOperation`

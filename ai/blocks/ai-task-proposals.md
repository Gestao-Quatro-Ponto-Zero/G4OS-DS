# Tarefas propostas pela IA

- Arquivo: `src/blocks/ai-task-proposals.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-task-proposals` (`?theme=dark` para o escuro)

Resumo de reunião à esquerda e as tarefas que a IA sugere à direita: destino (Linear, Jira, Asana), sub-tarefas, propriedades editáveis, aceitar/recusar por tarefa ou todas, com desfazer.

## Conceito

**Objetivo:** Transformar o resumo de uma reunião em tarefas reais com revisão humana: aceitar, editar ou recusar cada uma.

**Padrões aplicados**

- Anatomia G · App de altura total: documento à esquerda, propostas à direita
- Aceitar todas / Recusar todas no topo, com desfazer
- Card editável: destino (Linear, Jira…), sub-tarefas com progresso, propriedades em chips
- Card aceito vira uma linha com 'Desfazer'

**Quando usar e o que adaptar**

- Ações de ata de reunião, pendências de auditoria, itens de onboarding de cliente

**Evite**

- Criar tarefas automaticamente sem revisão

## Componentes usados

`AvatarGroup`, `ProposalState`, `SegmentedControl`, `TaskDestination`, `TaskProposal`, `TaskProposalCard`, `TaskProposalList`, `ToolGlyph`, `notify`

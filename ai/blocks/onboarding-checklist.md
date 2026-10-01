# Primeiros passos

- Arquivo: `src/blocks/onboarding-checklist.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Onboarding
- Preview: showcase `#/frame/onboarding-checklist` (`?theme=dark` para o escuro)

Página inicial de conta nova: checklist com progresso, um passo aberto por vez com a ação direta, recursos de ajuda e opção de dispensar.

## Conceito

**Objetivo:** Levar uma conta nova ao primeiro valor com poucos passos, cada um com a ação direta.

**Padrões aplicados**

- Anatomia B · Painel (home): cabeçalho fixo com saudação
- Checklist com progresso; um passo aberto por vez
- Cada passo leva à tela real onde a ação acontece
- Pode ser dispensado; progresso salvo

**Quando usar e o que adaptar**

- Ativação de cliente no SaaS, implantação no ERP, onboarding de recrutador

**Evite**

- Checklist com passos que não levam a lugar nenhum

## Componentes usados

`Button`, `Callout`, `Page`, `PageHeading`, `ProgressRing`

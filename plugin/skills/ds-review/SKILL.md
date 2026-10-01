---
name: ds-review
description: Revisa, audita, polir e refina telas feitas com o G4OS-DS e entrega um relatório por gravidade (com correções opcionais). Use quando o usuário pedir "revisar/auditar/polir/refinar esta tela", "está seguindo o design system?", "QA visual", "o que falta para ficar no padrão G4". Triggers in English: "review/audit/polish this screen against the G4OS design system". Não use para criar do zero (ds-create) nem migrar o projeto todo (ds-migrate).
---

# Revisar com o G4OS-DS

Aplique antes a skill **g4os-ds** (localizar `DS`, ler `DS/ai/core.md`). Escopo: os arquivos/rotas que o usuário indicou; se não indicou, os alterados no branch (`git diff --name-only main...`).

## 1. Automático

```bash
npx g4os-ds audit <arquivos ou pastas> --fix-hints
npx tsc --noEmit
```

Toda ocorrência `erro` vira item "Alta" do relatório (a menos que tenha `ds-audit-ignore` com motivo válido).

## 2. Checklist humano

Leia o código (e a tela renderizada, se houver dev server ou screenshot). Use `references/checklist.md`; cada item que falhar entra no relatório com arquivo:linha.

Pontos que o audit não pega e mais importam:
- **Hierarquia**: um primário por área; título = o que é a tela; ações secundárias no `ActionMenu`.
- **Densidade**: busca só com ≥ 12 itens, filtros ≥ 8; sem card dentro de card; espaçamento dos tokens.
- **Estados**: carregando, vazio (com próxima ação), vazio por filtro, erro (com saída), ideal.
- **Superfície certa**: Drawer para editar, Modal curto, ConfirmDialog para irreversível, drawer não abre drawer.
- **Escrita pt-BR**: verbo + objeto; sem "com sucesso", sem exclamação, sem jargão; toasts no particípio.
- **Dados**: `format*` em todo número/data; KPI com delta e base; gráfico com título-pergunta e `label`.
- **Acessibilidade**: teclado, foco visível, nomes (`IconButton label`), cor com palavra, contraste.
- **Tema e marca**: nada que quebre no `data-theme="dark"` ou numa `data-brand`.
- **Responsivo**: 390 px sem rolagem horizontal; tabela vira cards.

## 3. Relatório

Use `references/output-format.md`: resumo, itens por gravidade (Alta = quebra regra/acessibilidade/tema; Média = padrão/escrita/estado faltando; Baixa = polimento), cada um com arquivo:linha, o problema, a correção proposta (componente/token do DS) e referência (`DS/docs/...`).

## 4. Corrigir (se o usuário pedir ou a instrução disser "revise e corrija")

Corrija da Alta para a Baixa, sem mudar comportamento. Depois rode de novo `audit` + `tsc` e mostre antes → depois (contagens). Não marque como corrigido o que não verificou.

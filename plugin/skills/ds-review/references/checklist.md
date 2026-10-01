# Checklist de revisão G4OS-DS

Marque cada item: ✓ ok · ✗ falha (vai para o relatório) · — não se aplica.

## Estrutura e hierarquia
- [ ] Casca do DS (`AppShell`/`Sidebar`/`Page`) e `PageHeading` com título que diz o que é a tela.
- [ ] Um único botão primário por área; secundárias `ghost`; ações de linha no `ActionMenu` (⋯).
- [ ] Trilha só com ancestrais; página de registro usa `ContextBar`.
- [ ] Sidebar ≤ 10 itens em ≤ 2 grupos; contador só quando pede ação.

## Densidade e layout
- [ ] Controles só quando há o que controlar (busca ≥ 12, filtro ≥ 8, alternador ≥ 8).
- [ ] Sem card dentro de card; superfícies separadas por borda, não sombra.
- [ ] Título e corpo no mesmo eixo: coluna estreita por `Page width`, não por wrapper `mx-auto max-w-*`.
- [ ] Largura de leitura ≤ 620 px em texto corrido; números alinhados à direita com `tabular-nums`.

## Componentes e superfícies
- [ ] Sem `<select>`, `<input type="date">`, `confirm`, `alert`.
- [ ] Rótulo visível acima de todo campo; placeholder é exemplo; nenhum rótulo duplicado (FieldBlock + label do campo).
- [ ] Checkbox fora de tabela com texto visível; seleção múltipla em `CheckboxGroup`/`MultiSelect`.
- [ ] Desabilitado legível e com motivo (`disabledReason`), sem wrapper de opacidade.
- [ ] Criar/editar em `Drawer`; decisão curta em `Modal`; irreversível em `ConfirmDialog` (título = pergunta com o objeto, botão = verbo).
- [ ] Filtros no padrão `FilterBar` (ativos visíveis como chips, "Limpar"), estado na URL quando a lista é compartilhável.

## Estados e feedback
- [ ] Carregando com `Skeleton` na forma final.
- [ ] Vazio com próxima ação; vazio por filtro com "Limpar filtros".
- [ ] Erro com saída; dados digitados preservados.
- [ ] Botão informa enquanto executa (`useOperation`); toast só depois, no particípio, com "Desfazer" quando reversível.

## Dados e gráficos
- [ ] Todo número/data por `formatCurrency/Number/Percent/Delta/Date/Relative`.
- [ ] KPI com delta e período explícito; `goodWhen="down"` em custo/churn/prazo.
- [ ] Gráfico: título = pergunta, descrição = período/unidade, `label` acessível, série 1 = ink, eixo em zero.

## Escrita (pt-BR)
- [ ] Verbo + objeto nos botões; só a primeira letra maiúscula; sem exclamação, sem "com sucesso".
- [ ] Um nome por conceito em todo o app (glossário).

## Tokens, tema e marca
- [ ] `npx g4os-ds audit` sem erros (sem hex, `bg-white`, `text-white`, paleta do Tailwind, classes shadcn).
- [ ] Tela correta em `data-theme="dark"` (contraste, bordas visíveis, gráficos legíveis).
- [ ] Tela correta com outra `data-brand` (nada depende da tinta G4 como cor fixa).

## Acessibilidade e responsivo
- [ ] Tudo alcançável por teclado; foco visível; ordem lógica.
- [ ] Botões só-ícone com nome (`IconButton label`); imagens com `alt`.
- [ ] Cor nunca sozinha (status = ponto + texto).
- [ ] 390 px sem rolagem horizontal; tabela vira cards; alvos ≥ 40 px.
- [ ] `prefers-reduced-motion` respeitado em animações próprias.

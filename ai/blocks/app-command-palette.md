# Paleta de comandos (⌘K)

- Arquivo: `src/blocks/app-command-palette.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-command-palette` (`?theme=dark` para o escuro)

App com a paleta aberta: navegar, criar e achar registros pelo teclado. Busca sem acento, recentes, grupos e atalhos.

## Conceito

**Objetivo:** Navegar, criar e achar registros pelo teclado sem tirar a mão dele, para quem usa o app o dia inteiro.

**Padrões aplicados**

- ⌘K abre uma paleta sobre qualquer tela
- Grupos (navegar, criar, registros), busca sem acento, recentes e atalhos visíveis
- Enter executa, Esc fecha; a tela de fundo não muda

**Quando usar e o que adaptar**

- Qualquer produto do DS: registre os comandos do produto e os atalhos de criação

**Evite**

- Paleta com ações sem atalho nem grupo (vira lista sem ordem)

## Componentes usados

`Card`, `Command`, `CommandPalette`, `Kbd`, `ListPanel`, `ListRow`, `Page`, `PageHeading`, `useCommandShortcut`, `useTheme`

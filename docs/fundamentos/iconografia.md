# Iconografia

Biblioteca única: **lucide-react** (peer dependency). Não misture com Heroicons, Material ou SVG solto.

## Tamanhos e traço

| Contexto | Tamanho | Classe |
| --- | --- | --- |
| Botão, item de menu, campo, sidebar | 16 px | `h-4 w-4` (botões já aplicam `[&_svg]:h-4`) |
| Badge, delta, chip, ação de linha compacta | 12–14 px | `h-3 w-3`, `h-3.5 w-3.5` |
| Estado vazio, cabeçalho de card de destaque | 20 px | `h-5 w-5` |
| Tela de erro/ilustração | 24–32 px | `h-6 w-6`+ |

Traço: `base.css` afina os ícones dentro de `main`, `aside` e `[data-ds-content]` para `stroke-width: 1.65`. Em estados vazios use `strokeWidth={1.5}`. Em setas pequenas de delta, 2.2.

Cor: `text-muted` em repouso, `text-ink` no ativo/hover. Ícone colorido só quando carrega o tom (alerta âmbar, erro rosa).

## Regras

1. **Ícone acompanha texto.** Ícone sozinho só em `IconButton`, que exige `label` (vira `aria-label` e `title`).
2. **Um ícone, um significado** no app inteiro. Se `Trash2` é excluir, não é "limpar filtro" (use `X`).
3. Ícones decorativos recebem `aria-hidden`.
4. Não use emoji como ícone de interface.
5. Sidebar: todo item tem ícone (necessário no modo recolhido de 64 px).

## Vocabulário recomendado

| Ação / conceito | Ícone |
| --- | --- |
| Criar | `Plus` |
| Editar | `Pencil` |
| Excluir | `Trash2` |
| Arquivar | `Archive` |
| Fechar, limpar | `X` |
| Mais ações | `MoreHorizontal` (menu ⋯) |
| Buscar | `Search` |
| Filtrar | `ListFilter` |
| Exportar / baixar | `Download` |
| Importar / enviar | `Upload` |
| Abrir em outro lugar | `ArrowUpRight` |
| Voltar | `ChevronLeft` / `ArrowLeft` |
| Configurações | `Settings` |
| Pessoa / equipe | `User` / `Users` |
| Empresa / conta | `Building2` |
| Negócio / oportunidade | `Handshake` ou `CircleDollarSign` |
| Vaga / candidato | `Briefcase` / `UserRound` |
| Pedido / nota | `ShoppingCart` / `Receipt` |
| Estoque / produto | `Package` / `Boxes` |
| Financeiro | `Wallet`, `Landmark`, `CreditCard` |
| Agenda | `CalendarDays` |
| Documento | `FileText` |
| Alerta | `AlertTriangle` |
| Sucesso | `CheckCircle2` |
| Erro | `XCircle` |
| Informação | `Info` |
| Início / dashboard | `Home` / `LayoutDashboard` |
| Relatórios | `ChartColumn` / `ChartArea` |

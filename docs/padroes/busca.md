# Busca

Showcase: **Filtros e busca › Busca global (⌘K)** e **Busca em tabelas**. Código: `src/components/search.tsx`.

| | ⌘K · `SearchPalette` | `/` · `TableSearch` | Filtros · `FilterBar` |
|---|---|---|---|
| Alcance | App inteiro, todos os tipos | A lista na tela | A lista na tela |
| Entrada | Texto + escopo | Texto livre | Campo + operador + valor |
| Resultado | Abre registro / executa ação | Estreita a lista | Estreita a lista |
| URL | não | `?q=` | `?f=` |

## ⌘K

- Escopos em abas: **Tudo · Negócios · Contatos · Pedidos · Ações**. `Tab` alterna; prefixos `#` registros, `@` pessoas, `>` ações entram direto.
- Resultado = ícone do tipo + título com trecho destacado + contexto (empresa) + meta (valor/status).
- Vazio: buscas recentes e registros abertos recentemente.
- Em “Tudo”, 4 por tipo + “Ver todos os N resultados em X” → abre a lista de X com `?q=`.
- Prévia à direita (≥ 768px), `→` alterna. `⌘↵` abre em nova aba.
- Fonte remota: `source(q, scope, signal)` com debounce (160 ms), cancelamento, carregando e erro com “Tentar de novo”.
- Um só ⌘K no app; botão “Buscar ⌘K” visível na sidebar.

## `/` em tabelas

- Primeiro controle da FilterBar. Placeholder “Buscar em 312 contatos”. `/` foca, `Esc` limpa e depois sai.
- Procura em nome + contexto (empresa, número, e-mail, CNPJ sem pontuação), todas as palavras, sem acento (`matchesQuery`).
- `Highlight` na coluna principal e no contexto.
- A partir de 12 itens. Local: filtra ao digitar. Servidor: debounce ~200 ms.

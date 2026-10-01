# Auditoria e lint

O G4OS-DS vem com um verificador próprio: as regras do [AGENTS.md](../../AGENTS.md) viram checagens automáticas no terminal (`g4os-ds audit`), no editor e no `eslint .` (plugin `@g4ai/ds/eslint`), no CI (anotações no PR e SARIF) e nos agentes (tool `audit` do MCP). Um motor só, as mesmas regras em todo lugar.

| Onde | Comando | Para quê |
| --- | --- | --- |
| Terminal | `npx g4os-ds audit` | relatório do projeto, `--fix` para as trocas seguras |
| Pré-requisitos | `npx g4os-ds doctor` | React 19, Tailwind v4, ordem do CSS, tema, fonte, layout raiz |
| Começar | `npx g4os-ds init` | config, scripts `ds:*`, workflow de CI, ESLint e pre-commit opcionais |
| Editor e `eslint .` | `@g4ai/ds/eslint` | mesmas regras, sublinhadas no código, com correção rápida |
| CI | `audit --format github` / `--format sarif` | anotações no PR e code scanning |
| Agentes | tool `audit` do MCP | o agente audita e corrige o que escreveu |

## Começar em 1 minuto

```bash
npx g4os-ds init            # mostra o que vai criar; --dry-run para só ver
npm run ds:doctor           # pré-requisitos
npm run ds:audit            # auditoria
npm run ds:audit:fix        # aplica as trocas seguras
```

O `init` cria `g4os-ds.config.json`, adiciona os scripts `ds:audit`, `ds:audit:changed`, `ds:audit:fix` e `ds:doctor` ao `package.json` e grava `.github/workflows/g4os-ds.yml`. Nunca sobrescreve um arquivo existente sem `--force`. Opções:

| Opção | O que faz |
| --- | --- |
| `--dry-run` | só lista o que faria |
| `--eslint` | cria `eslint.config.mjs` com o plugin (ou mostra o trecho, se já houver config) |
| `--hook lefthook\|husky\|simple-git-hooks` | pre-commit com `audit --staged` (só o que vai no commit) |
| `--baseline` | grava a dívida atual em `.g4os-ds-baseline.json`: daqui em diante só achado novo falha |
| `--no-ci` | não cria o workflow |
| `--force` | substitui arquivos existentes |

## `g4os-ds audit`

```bash
npx g4os-ds audit                       # pastas do "include" da config (ou o projeto todo)
npx g4os-ds audit src app               # pastas ou arquivos
npx g4os-ds audit --fix                 # aplica as correções seguras e mostra o que sobrou
npx g4os-ds audit --changed             # só o que mudou no git (working tree + staged + novos)
npx g4os-ds audit --staged              # só o staged (pre-commit)
npx g4os-ds audit --since origin/main   # o que mudou no branch
npx g4os-ds audit --format sarif --out g4os-ds.sarif
```

| Opção | Padrão | |
| --- | --- | --- |
| `--format pretty\|json\|markdown\|sarif\|github` | `pretty` | `--json` é atalho de `--format json` |
| `--fix` | | troca segura: `bg-white`→`bg-surface`, `text-white` sobre `bg-primary`→`text-on-primary`, paleta neutra/estado→token, shadcn→DS, `rounded-[12px]`→`rounded-card`, `rel="noopener noreferrer"`, import interno→`@g4ai/ds`, nome renomeado |
| `--baseline [arquivo]` | `.g4os-ds-baseline.json` | compara com a dívida conhecida; cria se não existir |
| `--update-baseline` | | regrava a baseline com o estado atual |
| `--config <arquivo>` | busca `g4os-ds.config.json`, `.g4os-dsrc.json` ou `package.json#"g4os-ds"` subindo pastas | |
| `--preset recommended\|strict\|migration` | o da config | |
| `--rule <id>=<off\|info\|warn\|error>` | | repetível, vence a config |
| `--max-errors <n>` | `0` | tolera até n erros |
| `--max-warnings <n>` | sem limite | falha se passar de n avisos |
| `--out <arquivo>` | stdout | |

**Código de saída**: `0` sem erros (e avisos dentro de `--max-warnings`) · `1` há achados que falham · `2` erro de uso ou de config (regra desconhecida, caminho inexistente, formato inválido). `info` nunca falha.

`--fix` só faz trocas que não mudam o comportamento nem o desenho de forma surpreendente. O resto (por exemplo `text-white` sem fundo conhecido, `bg-violet-600`, `<select>`) aparece com a sugestão.

## Configuração

`g4os-ds.config.json` na raiz (o `init` cria; o editor completa pelo `$schema`):

```json
{
  "$schema": "./node_modules/@g4ai/ds/scripts/lint/config.schema.json",
  "extends": "recommended",
  "include": ["src"],
  "exclude": ["src/legacy/**", "src/**/*.generated.tsx"],
  "rules": { "text-size": "error", "dangerous-html": "off" },
  "overrides": [{ "files": ["src/marketing/**"], "rules": { "white-black": "warn" } }],
  "baseline": ".g4os-ds-baseline.json",
  "maxWarnings": 50
}
```

- **`extends`**: `recommended` (padrão, as regras do AGENTS.md), `strict` (liga também `tailwind-text-scale` e `z-index-token`) ou `migration` (quase tudo vira aviso, para projetos em migração; combine com baseline).
- **`rules`**: `off`, `info`, `warn` ou `error` por regra.
- **`include` / `exclude`**: globs relativos à pasta da config (`**`, `*`, `{a,b}`). `node_modules`, `dist`, `.next`, `build`, `out`, `coverage` e arquivos `*.test.*`, `*.stories.*`, `*.d.ts` já ficam de fora.
- **`overrides`**: gravidades diferentes por pasta.
- Também vale em `package.json`, na chave `"g4os-ds"`.

## Ignorar com motivo

Exceção legítima (logo de terceiro, painel navy, tabela de/para) fica no código, com motivo:

```tsx
// g4os-ds-disable-next-line white-black -- painel navy fica escuro nos dois temas
<div className="bg-white/10" />
<div className="bg-white" /> {/* g4os-ds-disable-line white-black -- mockup de papel */}

{/* g4os-ds-disable hex-color -- cores oficiais do logo */}
<svg>…</svg>
{/* g4os-ds-enable */}

/* g4os-ds-disable-file white-black -- slide de marca */
```

Várias regras: `g4os-ds-disable-next-line white-black, hex-color`. Sem regra = todas. A sintaxe antiga continua valendo: `// ds-audit-ignore <regra>: motivo` (linha e seguinte), `ds-audit-ignore-start/-end`, `ds-audit-ignore-file`. No ESLint, `// eslint-disable-next-line g4os-ds/<regra>` também funciona.

## Projeto legado: baseline

Migrando um app grande, não dá para zerar tudo de uma vez. A baseline congela a dívida atual e faz o CI falhar só no que é **novo**:

```bash
npx g4os-ds init --baseline          # ou: npx g4os-ds audit --baseline
git add g4os-ds.config.json .g4os-ds-baseline.json
```

- Cada achado é identificado por arquivo + regra + conteúdo da linha (não pelo número da linha): mover código não quebra a baseline.
- Corrigiu um trecho? O relatório avisa "N já resolvidos": rode `npx g4os-ds audit --update-baseline` para encolher a baseline (e commite).
- Para medir avanço: `npx g4os-ds audit --no-baseline --format json` mostra a dívida total.
- Preset `migration` + baseline é o combo para começar; volte a `recommended` quando a baseline zerar.

Roteiro completo em [migração](migracao.md).

## CI

O `init` cria `.github/workflows/g4os-ds.yml`:

```yaml
- name: Pré-requisitos (doctor)
  run: npx g4os-ds doctor --format github
- name: Auditoria (anotações no PR)
  run: npx g4os-ds audit --format github
- name: Auditoria (SARIF para code scanning)
  if: always()
  run: npx g4os-ds audit --format sarif --out g4os-ds.sarif || true
- uses: github/codeql-action/upload-sarif@v3
  if: always() && hashFiles('g4os-ds.sarif') != ''
  continue-on-error: true
  with: { sarif_file: g4os-ds.sarif, category: g4os-ds }
```

- `--format github` vira anotações no diff do PR (`::error file=…,line=…`).
- SARIF 2.1.0 alimenta o code scanning do GitHub (aba Security), Azure DevOps e IDEs. Em repositório privado sem code scanning, o upload falha em silêncio e as anotações bastam.
- Só no que mudou no PR: `npx g4os-ds audit --since origin/${{ github.base_ref }}` (com `fetch-depth: 0` no checkout).
- GitLab, Bitbucket etc.: `npx g4os-ds audit` (pretty) ou `--format json`.

## Pre-commit

`npx g4os-ds init --hook lefthook` (ou `husky`, `simple-git-hooks`) roda `g4os-ds audit --staged`: só os arquivos do commit, em milissegundos. Com baseline configurada, só achado novo bloqueia o commit.

## ESLint

O plugin traz as mesmas regras (o mesmo motor) para o editor e o `eslint .`, com correção rápida (`eslint --fix`) nas regras corrigíveis.

Projeto que já tem ESLint com TypeScript/JSX (typescript-eslint, `eslint-config-next`…):

```js
// eslint.config.mjs
import g4osDs from "@g4ai/ds/eslint";

export default [
  // …sua config
  g4osDs.configs.recommended, // ou .strict / .migration
];
```

Projeto sem parser de TypeScript: `standalone` usa o leitor do próprio DS (só as regras do G4OS-DS rodam):

```js
import g4osDs from "@g4ai/ds/eslint";

export default [g4osDs.config({ preset: "recommended", standalone: true })];
```

- Ajustes: `g4osDs.config({ preset: "strict", files: ["src/**/*.tsx"], rules: { "g4os-ds/text-size": "off" } })`.
- Regras com o prefixo `g4os-ds/`: `g4os-ds/white-black`, `g4os-ds/hex-color`…
- ESLint 9 (flat config) é dependência opcional (`npm i -D eslint@9`). CSS e HTML ficam com o `g4os-ds audit`.
- Tipos para `eslint.config.ts` incluídos.

## `g4os-ds doctor`

Confere se o projeto pode usar o DS e aponta a correção. `✗` bloqueia (exit 1), `△` avisa, `i` informa.

- **Pacotes**: `@g4ai/ds` instalado (e o antigo `@g4os/ds` removido); React e react-dom 19 na mesma versão; **React duplicado** em `node_modules` (causa "Invalid hook call"); Tailwind ≥ 4.3 e `tailwind.config` esquecido; `@base-ui/react` e `lucide-react` nas versões que o DS pede.
- **Integração do Tailwind v4**: `@tailwindcss/postcss` ou `@tailwindcss/vite` (bloqueia se o PostCSS ainda usa o plugin do v3).
- **CSS**: `@import "@g4ai/ds/styles.css"` presente e **depois** de `@import "tailwindcss"`; sem `@tailwind base`; sem import interno.
- **Layout raiz**: `lang="pt-BR"`, `ds-app`, `data-theme`, `themeScript` no `<head>`, `suppressHydrationWarning` (Next).
- **Fonte**: Figtree ou `--ds-font-sans`. **Next**: `setLinkComponent(Link)`; `transpilePackages` desnecessário.
- **Qualidade contínua**: config e script de audit (sugere `init`).

Formatos: `--format pretty|json|markdown|github|sarif`.

## Agentes (MCP)

A tool `audit` do servidor MCP (`npx -y @g4ai/ds mcp`) usa o mesmo motor e a config do projeto. Parâmetros: `path`, `format` (`json` paginado, `markdown`, `sarif`, `github`), `preset`, `severity` (mínima), `rule`, `changed`, `since`, `limit`/`offset`. Cada achado traz `rule`, `line`, `suggestion`, `docs` e, quando há troca segura, `fixable` + `replacement`. Fluxo recomendado para o agente: escrever → `audit` no que mudou → `g4os-ds audit --fix` → corrigir o resto à mão → `audit` com zero erros.

## Regras

Gravidade por preset. `--fix` = o `g4os-ds audit --fix` e o `eslint --fix` fazem a troca.

| Regra | Categoria | recommended | strict | migration | `--fix` |
| --- | --- | --- | --- | --- | --- |
| [`hex-color`](#hex-color) | Tokens e cor | erro | erro | aviso |  |
| [`white-black`](#white-black) | Tokens e cor | erro | erro | aviso | sim |
| [`tailwind-palette`](#tailwind-palette) | Tokens e cor | erro | erro | aviso | sim |
| [`shadcn-class`](#shadcn-class) | Tokens e cor | erro | erro | aviso | sim |
| [`hardcoded-dark`](#hardcoded-dark) | Tokens e cor | aviso | aviso | aviso | sim |
| [`arbitrary-radius`](#arbitrary-radius) | Tokens e cor | aviso | aviso | aviso | sim |
| [`arbitrary-shadow`](#arbitrary-shadow) | Tokens e cor | aviso | aviso | aviso |  |
| [`z-index`](#z-index) | Tokens e cor | aviso | aviso | aviso |  |
| [`z-index-token`](#z-index-token) | Tokens e cor | desligada | info | desligada | sim |
| [`text-size`](#text-size) | Tipografia | aviso | aviso | aviso |  |
| [`tailwind-text-scale`](#tailwind-text-scale) | Tipografia | desligada | aviso | desligada | sim |
| [`native-select`](#native-select) | Componentes | erro | erro | aviso |  |
| [`native-date`](#native-date) | Componentes | erro | erro | aviso |  |
| [`confirm-alert`](#confirm-alert) | Componentes | erro | erro | aviso |  |
| [`deprecated-export`](#deprecated-export) | Componentes | erro | erro | erro | sim |
| [`as-any-props`](#as-any-props) | Componentes | info | info | aviso |  |
| [`icon-button-label`](#icon-button-label) | Acessibilidade | erro | erro | aviso |  |
| [`img-alt`](#img-alt) | Acessibilidade | erro | erro | erro |  |
| [`field-label`](#field-label) | Acessibilidade | aviso | aviso | aviso |  |
| [`clickable-div`](#clickable-div) | Acessibilidade | aviso | aviso | aviso |  |
| [`outline-none`](#outline-none) | Acessibilidade | aviso | aviso | aviso |  |
| [`positive-tabindex`](#positive-tabindex) | Acessibilidade | aviso | aviso | aviso |  |
| [`html-lang`](#html-lang) | Acessibilidade | aviso | aviso | aviso |  |
| [`number-format`](#number-format) | Formatação pt-BR | erro | erro | aviso |  |
| [`locale-missing`](#locale-missing) | Formatação pt-BR | aviso | aviso | aviso |  |
| [`date-format`](#date-format) | Formatação pt-BR | aviso | aviso | aviso |  |
| [`effect-return`](#effect-return) | React | aviso | aviso | aviso |  |
| [`deep-import`](#deep-import) | Imports | erro | erro | erro | sim |
| [`target-blank`](#target-blank) | Segurança | aviso | aviso | aviso | sim |
| [`dangerous-html`](#dangerous-html) | Segurança | aviso | aviso | aviso |  |
| [`icon-star-import`](#icon-star-import) | Performance | aviso | aviso | aviso |  |
### Tokens e cor

#### `hex-color`

**Cor fixa (hex/rgb/hsl).** Use o token: bg-surface, text-ink, border-line; em SVG/style, var(--ds-…).

- Gravidade: erro (strict: erro)
- Evite: `className="bg-[#fff]"` · `style={{ color: "#202124" }}` · `.a { color: #333 }`
- Use: `bg-surface` · `style={{ color: "var(--ds-ink)" }}` · `.a { color: var(--ds-ink) }`

#### `white-black`

**bg-white / text-white / *-black.** bg-surface (card), bg-popover (menu), text-on-primary (sobre primary), text-on-ink (sobre ink/rose/ok). text-white só sobre bg-navy/bg-brand.

- Gravidade: erro (strict: erro) · corrigível com `--fix`
- Evite: `bg-white` · `bg-primary text-white` · `text-black`
- Use: `bg-surface` · `bg-primary text-on-primary` · `text-ink`

#### `tailwind-palette`

**Cor da paleta do Tailwind.** Troque pelo token semântico sugerido (text-muted, border-line, bg-ok-soft…).

- Gravidade: erro (strict: erro) · corrigível com `--fix`
- Evite: `text-gray-500` · `border-gray-200` · `bg-red-50` · `text-green-700`
- Use: `text-muted` · `border-line` · `bg-rose-soft` · `text-ok`

#### `shadcn-class`

**Classe semântica do shadcn.** Troque pelo equivalente do DS (ou importe @g4ai/ds/shadcn.css e troque aos poucos).

- Gravidade: erro (strict: erro) · corrigível com `--fix`
- Evite: `bg-background` · `text-muted-foreground` · `hover:bg-accent`
- Use: `bg-page` · `text-muted` · `hover:bg-soft`

#### `hardcoded-dark`

**dark: trocando cor que o token já troca.** Remova: bg-surface/text-ink/border-line já mudam no tema escuro. dark: só para imagem e ilustração.

- Gravidade: aviso (strict: aviso) · corrigível com `--fix`
- Evite: `bg-surface dark:bg-zinc-900`
- Use: `bg-surface`

#### `arbitrary-radius`

**Raio arbitrário igual a um token.** rounded-chip (6) · rounded-control (8) · rounded-tile (10) · rounded-card (12) · rounded-shell (16): seguem --ds-radius-scale da marca.

- Gravidade: aviso (strict: aviso) · corrigível com `--fix`
- Evite: `rounded-[12px]` · `rounded-t-[8px]`
- Use: `rounded-card` · `rounded-t-control`

#### `arbitrary-shadow`

**Sombra arbitrária sem token.** shadow-surface · shadow-raised · shadow-popup · shadow-toast · shadow-overlay (mudam no tema escuro).

- Gravidade: aviso (strict: aviso)
- Evite: `shadow-[0_2px_8px_rgba(0,0,0,.1)]`
- Use: `shadow-raised` · `shadow-[0_0_0_1px_var(--ds-ink)]`

#### `z-index`

**z-index acima da camada de popup.** A pilha do DS vai até --z-popup (100). Acima disso, menus e selects ficam por baixo.

- Gravidade: aviso (strict: aviso)
- Evite: `z-[9999]` · `z-index: 2147483647`
- Use: `z-[var(--z-modal)]` · `z-[var(--z-popup)]`

#### `z-index-token`

**z-index numérico igual a uma camada do DS.** z-[var(--z-sticky)] · z-[var(--z-modal)] · z-[var(--z-popup)]…

- Gravidade: desligada (strict: info) · corrigível com `--fix`
- Evite: `z-[95]`
- Use: `z-[var(--z-modal)]`


### Tipografia

#### `text-size`

**Tamanho de texto fora da escala.** text-caption/label/control/body/input/section/title ou um px da escala (10–25, 30).

- Gravidade: aviso (strict: aviso)
- Evite: `text-[14.5px]` · `text-[1.1rem]`
- Use: `text-[14px]` · `text-input` · `text-body`

#### `tailwind-text-scale`

**Escala de texto do Tailwind (text-sm, text-lg…).** Use a escala do DS: text-caption (12), text-input (14), text-section (18), text-record (20).

- Gravidade: desligada (strict: aviso) · corrigível com `--fix`
- Evite: `text-sm` · `text-lg`
- Use: `text-input` · `text-section`


### Acessibilidade

#### `icon-button-label`

**Botão só com ícone sem nome acessível.** IconButton label=… ou aria-label no <button>.

- Gravidade: erro (strict: erro)
- Evite: `<button><Plus /></button>` · `<IconButton><Plus /></IconButton>`
- Use: `<IconButton label="Adicionar"><Plus /></IconButton>`

#### `img-alt`

**<img> sem alt.** alt="descrição" (ou alt="" se for decorativa).

- Gravidade: erro (strict: erro)
- Evite: `<img src={logo} />`
- Use: `<img src={logo} alt="Acme" />` · `alt="" se decorativa`

#### `field-label`

**Campo sem rótulo.** Envolva em FieldBlock label=… (rótulo visível) ou dê aria-label.

- Gravidade: aviso (strict: aviso)
- Evite: `<input placeholder="Nome" />`
- Use: `<FieldBlock label="Nome"><input /></FieldBlock>` · `aria-label`

#### `clickable-div`

**onClick em div/span sem teclado.** Use <button type="button"> (ou role, tabIndex={0} e onKeyDown).

- Gravidade: aviso (strict: aviso)
- Evite: `<div onClick={abrir}>Abrir</div>`
- Use: `<button type="button" onClick={abrir}>Abrir</button>`

#### `outline-none`

**Foco removido sem substituto.** Mantenha um foco visível: focus-visible:ring-2 ring-primary/40, ou deixe o foco global do DS.

- Gravidade: aviso (strict: aviso)
- Evite: `<a className="outline-none">` · `a:focus-visible { outline: none }`
- Use: `outline-none focus-visible:ring-2 focus-visible:ring-primary/40`

#### `positive-tabindex`

**tabIndex positivo.** Use 0 ou -1; a ordem do teclado segue o DOM.

- Gravidade: aviso (strict: aviso)
- Evite: `tabIndex={2}`
- Use: `tabIndex={0} (ordem do DOM)`

#### `html-lang`

**<html> sem lang="pt-BR".** <html lang="pt-BR" className="ds-app" data-theme="system">

- Gravidade: aviso (strict: aviso)
- Evite: `<html lang="en">`
- Use: `<html lang="pt-BR" className="ds-app" data-theme="system">`


### Formatação pt-BR

#### `number-format`

**Formatação fora do pt-BR.** formatCurrency / formatNumber / formatPercent / formatDate de @g4ai/ds.

- Gravidade: erro (strict: erro)
- Evite: `"R$ " + v.toFixed(2)` · `toLocaleString("en-US")` · `currency: "USD"`
- Use: `formatCurrency(v)` · `formatNumber(v, 2)`

#### `locale-missing`

**toLocaleString/Intl sem locale.** Sem locale, o formato muda com o navegador. Use os formatadores de @g4ai/ds (pt-BR).

- Gravidade: aviso (strict: aviso)
- Evite: `d.toLocaleDateString()` · `new Intl.NumberFormat()`
- Use: `formatDate(d)` · `formatNumber(n)`

#### `date-format`

**Formato de data fixo.** formatDate / formatRelative de @g4ai/ds (dd/mm/aaaa, '12 mar', 'há 2 dias').

- Gravidade: aviso (strict: aviso)
- Evite: `format(d, "MM/dd/yyyy")`
- Use: `formatDate(d)` · `formatRelative(d)`


### Componentes

#### `native-select`

**<select> cru.** Select (lista curta), Combobox (entidades), MultiSelect (vários) ou NativeSelect (seletor do sistema estilizado: celular, lista longa sem busca).

- Gravidade: erro (strict: erro)
- Evite: `<select>…</select>`
- Use: `<Select label="Status" options={…} />`

#### `native-date`

**<input type="date|datetime-local|month">.** DatePicker · DateTimePicker · MonthPicker · TimePicker.

- Gravidade: erro (strict: erro)
- Evite: `<input type="date" />`
- Use: `<DatePicker label="Início" … />`

#### `confirm-alert`

**window.confirm / alert / prompt.** ConfirmDialog para confirmar; notify para avisar; Modal com campo para perguntar.

- Gravidade: erro (strict: erro)
- Evite: `if (window.confirm("Excluir?")) …`
- Use: `<ConfirmDialog …/>` · `notify("Negócio excluído")`

#### `deprecated-export`

**Export ou classe renomeada.** Troque pelo nome novo (ai/renames.json).

- Gravidade: erro (strict: erro) · corrigível com `--fix`
- Evite: `import { NomeAntigo } from "@g4ai/ds"`
- Use: `import { NomeNovo as NomeAntigo } from "@g4ai/ds" (troca automática)`

#### `as-any-props`

**as any em prop de componente.** Tipos do DS documentam o contrato: ajuste o dado, não silencie o tipo.

- Gravidade: info (strict: info)
- Evite: `<Select options={dados as any} />`
- Use: `<Select options={dados.map(toOption)} />`


### React

#### `effect-return`

**Efeito devolve algo que não é limpeza.** useEffect(() => { x(); }, …): um efeito só pode devolver uma função de limpeza (Promise ou valor quebra o React).

- Gravidade: aviso (strict: aviso)
- Evite: `useEffect(async () => { … })` · `useEffect(() => fetch(url), [])`
- Use: `useEffect(() => { void carregar(); }, [])`


### Imports

#### `deep-import`

**Import interno do pacote.** Importe de "@g4ai/ds" (e CSS de "@g4ai/ds/styles.css"): caminhos internos mudam entre versões.

- Gravidade: erro (strict: erro) · corrigível com `--fix`
- Evite: `"@g4ai/ds/src/components/primitives"` · `"@g4os/ds"` · `"@g4ai/ds/src/styles/index.css"`
- Use: `"@g4ai/ds"` · `"@g4ai/ds/styles.css"`


### Segurança

#### `target-blank`

**target="_blank" sem rel="noopener".** Adicione rel="noopener noreferrer".

- Gravidade: aviso (strict: aviso) · corrigível com `--fix`
- Evite: `<a href={url} target="_blank">`
- Use: `<a href={url} target="_blank" rel="noopener noreferrer">`

#### `dangerous-html`

**dangerouslySetInnerHTML.** Só com HTML gerado por você e escapado (themeScript é seguro). Conteúdo de usuário: RichTextView.

- Gravidade: aviso (strict: aviso)
- Evite: `<div dangerouslySetInnerHTML={{ __html: comentario }} />`
- Use: `<RichTextView value={comentario} /> (themeScript é permitido)`


### Performance

#### `icon-star-import`

**import * de "lucide-react".** Importe só os ícones usados: import { Plus } from "lucide-react".

- Gravidade: aviso (strict: aviso)
- Evite: `import * as Icons from "lucide-react"`
- Use: `import { Plus, Search } from "lucide-react"`

## Contribuir com uma regra

As regras moram em `scripts/lint/rules.mjs` (metadados + verificação), o motor em `engine.mjs`, as saídas em `format.mjs` e o plugin em `eslint-plugin.mjs`. Uma regra nova precisa de:

1. Entrada em `RULES` (categoria, gravidade, título, dica; `fixable` se trouxer troca segura).
2. Fixtures `scripts/lint/__fixtures__/<regra>.bad.tsx` e `.good.tsx` (e `.fixed.tsx` se corrigível). Primeira linha `// expect N` fixa a contagem.
3. Seção nesta página (o teste confere) e a regra no `config.schema.json` (`npm run test:lint` avisa).
4. `npm run check`: o próprio DS passa no `audit:self` e no `eslint .`.

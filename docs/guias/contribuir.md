# Contribuir: novo componente, bloco ou página de documentação

## Estrutura do repositório

```
src/
  styles/        tokens.css · base.css · components.css · index.css · shadcn.css (opcional)
  tokens/        espelho TS dos tokens (check:tokens compara com o CSS)
  lib/           cn, format (pt-BR), text (normalize, plural, initials), portal
  components/    um arquivo por família (primitives, forms, inputs, charts, …)
  blocks/        telas completas de exemplo (um arquivo = um bloco)
  index.ts       exporta tudo
showcase/
  main.tsx       site de documentação (hash router)
  kit.tsx        molduras de documentação: DocPage, DocSection, Demo, Rules, PropsTable, CodeBlock, BlockPreview
  pages/         uma página de doc por arquivo (registro automático)
  build.mjs      gera .generated/registry.ts, compila com esbuild + Tailwind
docs/            fundamentos, padrões, receitas, guias (markdown)
templates/       starters de app
```

## Antes de criar

1. O DS já tem? Procure no showcase (busca no topo) e em `src/index.ts`.
2. Dá para compor com o que existe? Composição é bloco, não componente.
3. É usado (ou vai ser) em 2+ apps? Se não, deixe no app.

## Novo componente

1. Escolha o arquivo da família em `src/components/` (ou crie um novo se for uma família nova) e escreva o componente:
   - `"use client"` se tiver estado/efeito.
   - Só tokens (`bg-soft`, `text-muted`, `border-line`, `var(--color-…)`). Nada de hex.
   - Texto padrão em pt-BR; props para trocar rótulos.
   - Comentário JSDoc curto dizendo **quando usar** e a regra principal (é o que aparece no editor).
   - Acessível: nome acessível, teclado, foco, `aria-*`.
   - Nomes exportados únicos no pacote inteiro.
2. Exporte em `src/index.ts` (`export * from "./components/<arquivo>"`, se for arquivo novo).
3. Documente no showcase (abaixo).
4. `npm run ai:build` e `npm run check` (tokens + typecheck + `ai/` em dia + auditoria).

## Nova página de documentação (showcase)

Crie `showcase/pages/<slug>.tsx`. O `build.mjs` registra sozinho (arquivos com `_` no início são ignorados, use para dados/auxiliares).

```tsx
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { MeuComponente } from "@g4os/ds";

export const meta: PageMeta = {
  title: "Meu componente",
  group: "Formulários",          // um dos grupos de kit.tsx
  order: 30,                     // ordem dentro do grupo
  description: "Uma frase: para que serve.",
};

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Uso" rule="Quando usar e quando não usar.">
        <Demo title="Padrão" code={`<MeuComponente valor={1} />`}>
          <MeuComponente valor={1} />
        </Demo>
        <Rules items={[{ do: "…", dont: "…" }]} />
        <PropsTable rows={[["valor", "number", "—", "O que é."]]} />
      </DocSection>
    </DocPage>
  );
}
```

Grupos disponíveis (`groups` em `showcase/kit.tsx`): Começar, Fundamentos, Ações e exibição, Formulários, Navegação, Sobreposições, Feedback e estados, Coleções, Gráficos, Dashboards, Mídia e conteúdo.

## Novo bloco

Crie `src/blocks/<slug>.tsx`. Aparece em **Blocos** na categoria indicada, com Preview em iframe (larguras desktop/tablet/celular) e aba Código com o arquivo inteiro.

```tsx
import { AppShell, Sidebar, Page, PageHeading /* … */ } from "@g4os/ds";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Pipeline de vendas",
  description: "Quadro de negócios por etapa com soma de valor e filtros.",
  category: "CRM",     // SaaS | CRM | ATS | ERP | Financeiro | Autenticação | Configurações | Onboarding | Aplicação
  height: 820,         // altura do iframe no showcase
  order: 10,
} as const;          // sem importar tipos do showcase: o arquivo continua copiável

/* Dados de exemplo NO TOPO do arquivo: quem copia troca só isto. */
const deals = [/* … */];

export default function Block() {
  return <AppShell …>…</AppShell>;
}
```

Regras de bloco:

- **Importe de `@g4os/ds`** (não caminhos relativos): o arquivo copiado funciona igual no app.
- Autocontido: dados de exemplo no topo, nenhum import de outro bloco.
- Tela inteira e realista, com os estados (vazio/carregando se fizer sentido), responsiva de 320 a 1440 px.
- Dados plausíveis em pt-BR (nomes, empresas, valores em R$), nunca "Lorem ipsum" ou "Acme".
- Ações de exemplo usam `notify(…)` para mostrar o feedback.

## Verificar

```bash
npm run ai:build              # regenera ai/ (props, JSDoc e exemplos Demo code= viram guia para agentes)
npm run check                 # tokens + registry + TypeScript + ai/ em dia + g4os-ds audit do próprio DS
npm run showcase:build        # compila o site em showcase/dist
npm run showcase:watch        # recompila a cada mudança
python3 -m http.server 4173 -d showcase/dist   # ou: npm run showcase
```

Capturas headless para conferir layout (desktop e celular):

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --hide-scrollbars --window-size=1440,1000 --virtual-time-budget=4000 --screenshot=desk.png "http://localhost:4173/#/p/<slug>"
"$CHROME" --headless --hide-scrollbars --window-size=1440,1000 --virtual-time-budget=4000 --screenshot=dark.png "http://localhost:4173/#/frame/<bloco>?theme=dark"
```

O Chrome headless não desenha abaixo de ~500 px de largura: para 390 px, carregue o frame dentro de um `<iframe style="width:390px">` numa página auxiliar.

## Mudar um token

1. Edite o semântico `--ds-*` em `src/styles/tokens.css` (claro **e** `[data-theme="dark"]`) **e** `src/tokens/index.ts` (`color` e `colorDark`). Ver [tokens.md](../fundamentos/tokens.md).
2. `npm run check:tokens`.
3. Atualize `docs/fundamentos/*.md` se o papel do token mudou.
4. Confira o showcase inteiro: token muda tudo.

## Critério de pronto

- [ ] `npm run ai:build` rodado e `npm run check` verde.
- [ ] Página no showcase com exemplo (`Demo code=`), regras e props.
- [ ] Conferido em 1440 e 390 px, **claro e escuro**, teclado e leitor de tela no básico.
- [ ] Mudança de API registrada em `CHANGELOG.md` e `ai/renames.json`.
- [ ] Doc em `docs/` atualizada se criou padrão novo.

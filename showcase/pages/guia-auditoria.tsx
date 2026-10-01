/* g4os-ds-disable-file white-black, tailwind-palette, shadcn-class, hex-color, text-size, arbitrary-radius, hardcoded-dark, number-format, deep-import -- página que documenta as regras: os exemplos proibidos aparecem de propósito */
import { Callout } from "@g4ai/ds";
import { CodeBlock, DocPage, DocSection, Rules, type PageMeta } from "../kit";
import { GuideTable } from "./_guia-table";

export const meta: PageMeta = {
  title: "Auditoria e lint",
  group: "Começar",
  order: 2.7,
  description: "As regras do DS viram checagens automáticas: g4os-ds audit no terminal e no CI, o plugin @g4ai/ds/eslint no editor e a tool audit do MCP para agentes. Um motor só, com --fix para as trocas seguras e baseline para projetos legados.",
};

const DOCS = "https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS/blob/main/docs/guias/auditoria.md";

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Onde roda" rule="As mesmas 47 regras em todo lugar: o que o CI reprova, o editor já sublinhou e o agente já corrigiu.">
        <GuideTable
          head={["Onde", "Como", "Para quê"]}
          mono={[1]}
          rows={[
            ["Terminal", "npx g4os-ds audit", "relatório do projeto; --fix aplica as trocas seguras"],
            ["Pré-requisitos", "npx g4os-ds doctor", "React 19, Tailwind v4, ordem do CSS, tema, fonte, React duplicado"],
            ["Começar", "npx g4os-ds init", "config, scripts ds:*, workflow de CI; --eslint, --hook, --baseline"],
            ["Editor e eslint .", "@g4ai/ds/eslint", "mesmas regras sublinhadas no código, com correção rápida"],
            ["CI", "audit --format github · --format sarif", "anotações no PR e code scanning"],
            ["Agentes", "tool audit do MCP", "o agente audita e corrige o que escreveu"],
          ]}
        />
      </DocSection>

      <DocSection title="Começar em 1 minuto" rule="O init mostra tudo o que muda e nunca sobrescreve sem --force. --dry-run só lista.">
        <CodeBlock
          code={`npx g4os-ds init --dry-run      # o que vai criar
npx g4os-ds init                # g4os-ds.config.json + scripts ds:* + .github/workflows/g4os-ds.yml
npm run ds:doctor               # pré-requisitos
npm run ds:audit                # auditoria
npm run ds:audit:fix            # trocas seguras`}
        />
        <GuideTable
          head={["Opção do init", "O que faz"]}
          rows={[
            ["--eslint", "cria eslint.config.mjs com o plugin (ou mostra o trecho, se já houver config)"],
            ["--hook lefthook | husky | simple-git-hooks", "pre-commit com audit --staged: só o que vai no commit"],
            ["--baseline", "congela a dívida atual; daqui em diante só achado novo falha"],
            ["--no-ci · --force · --dry-run", "sem workflow · substitui existentes · só lista"],
          ]}
        />
      </DocSection>

      <DocSection title="g4os-ds audit" rule="Saída 0 = ok, 1 = achados que falham, 2 = erro de uso ou de config. info nunca falha.">
        <CodeBlock
          code={`npx g4os-ds audit                        # pastas do "include" da config
npx g4os-ds audit src app --fix          # corrige o que é seguro e mostra o que sobrou
npx g4os-ds audit --changed              # só o que mudou no git (--staged, --since origin/main)
npx g4os-ds audit --baseline             # projeto legado: só achado novo falha
npx g4os-ds audit --format sarif --out g4os-ds.sarif   # também: pretty, json, markdown, github
npx g4os-ds audit --preset strict --max-warnings 0
npx g4os-ds rules                        # lista as regras`}
        />
        <Callout tone="info" title="O que o --fix troca sozinho">
          bg-white → bg-surface · text-white sobre bg-primary → text-on-primary (sobre bg-ink/rose/ok → text-on-ink) · text-gray-500 → text-muted · border-gray-200 → border-line ·
          bg-red-50 → bg-rose-soft · classes do shadcn → DS · rounded-[12px] → rounded-card · dark: em cor de token (remove) · target=&quot;_blank&quot; ganha rel · import interno → @g4ai/ds · nomes renomeados. O que depende do papel
          (bg-gray-100 é hover ou card?) fica como sugestão.
        </Callout>
      </DocSection>

      <DocSection title="Configuração" rule="g4os-ds.config.json na raiz (ou a chave g4os-ds no package.json). O $schema completa no editor.">
        <CodeBlock
          code={`{
  "$schema": "./node_modules/@g4ai/ds/scripts/lint/config.schema.json",
  "extends": "recommended",          // recommended · strict · migration
  "include": ["src"],
  "exclude": ["src/legacy/**"],
  "rules": { "text-size": "error", "dangerous-html": "off" },
  "overrides": [{ "files": ["src/marketing/**"], "rules": { "white-black": "warn" } }],
  "baseline": ".g4os-ds-baseline.json",
  "maxWarnings": 50
}`}
        />
      </DocSection>

      <DocSection title="Exceção com motivo" rule="Logo de terceiro, painel navy, tabela de/para: a exceção fica no código, com o porquê.">
        <CodeBlock
          code={`// g4os-ds-disable-next-line white-black -- painel navy fica escuro nos dois temas
<div className="bg-white/10" />

{/* g4os-ds-disable hex-color -- cores oficiais do logo */}
<svg>…</svg>
{/* g4os-ds-enable */}

/* g4os-ds-disable-file white-black -- slide de marca */
// também valem: // ds-audit-ignore <regra>: motivo · // eslint-disable-next-line g4os-ds/<regra>`}
        />
      </DocSection>

      <DocSection title="Projeto legado: baseline" rule="Congele a dívida e faça o CI falhar só no que é novo. A baseline só encolhe.">
        <CodeBlock
          code={`npx g4os-ds init --baseline              # config + baseline + CI
npx g4os-ds audit --fix                   # trocas seguras de uma vez
npx g4os-ds audit --update-baseline       # depois de cada tela migrada
npx g4os-ds audit --no-baseline --format json   # dívida total, para acompanhar`}
        />
        <Rules
          items={[
            { do: "Comece com extends: migration + baseline e volte a recommended quando a baseline zerar.", dont: "Desligar regras na config para o CI passar." },
            { do: "Achado identificado por arquivo + regra + conteúdo da linha: mover código não quebra a baseline.", dont: "Regravar a baseline para esconder um achado novo." },
          ]}
        />
      </DocSection>

      <DocSection title="ESLint" rule="O plugin usa o mesmo motor do CLI: mesmas regras, mesmas trocas, agora no editor (eslint --fix nas corrigíveis).">
        <CodeBlock
          code={`// eslint.config.mjs · projeto que já tem typescript-eslint / eslint-config-next
import g4osDs from "@g4ai/ds/eslint";

export default [
  // …sua config
  g4osDs.configs.recommended, // ou .strict / .migration
];

// projeto sem parser de TypeScript: leitor próprio do DS
export default [g4osDs.config({ preset: "recommended", standalone: true })];`}
        />
      </DocSection>

      <DocSection title="CI e pre-commit" rule="Anotações no diff do PR, SARIF na aba Security e pre-commit só com os arquivos do commit.">
        <CodeBlock
          code={`# .github/workflows/g4os-ds.yml (criado pelo init)
- run: npx g4os-ds doctor --format github
- run: npx g4os-ds audit --format github
- run: npx g4os-ds audit --format sarif --out g4os-ds.sarif || true
- uses: github/codeql-action/upload-sarif@v3
  with: { sarif_file: g4os-ds.sarif, category: g4os-ds }

# lefthook.yml (init --hook lefthook)
pre-commit:
  commands:
    g4os-ds:
      run: npx g4os-ds audit --staged`}
        />
      </DocSection>

      <DocSection title="Regras" rule="Gravidade no preset recommended. Detalhe, exemplos e motivo de cada uma no guia completo.">
        <GuideTable
          head={["Regra", "Categoria", "O que pega", "Gravidade", "--fix"]}
          rows={[
            ["hex-color", "Tokens e cor", "Cor fixa (hex/rgb/hsl)", "erro", ""],
            ["white-black", "Tokens e cor", "bg-white / text-white / *-black", "erro", "sim"],
            ["tailwind-palette", "Tokens e cor", "Cor da paleta do Tailwind", "erro", "sim"],
            ["shadcn-class", "Tokens e cor", "Classe semântica do shadcn", "erro", "sim"],
            ["hardcoded-dark", "Tokens e cor", "dark: trocando cor que o token já troca", "aviso", "sim"],
            ["arbitrary-radius", "Tokens e cor", "Raio arbitrário igual a um token", "aviso", "sim"],
            ["arbitrary-shadow", "Tokens e cor", "Sombra arbitrária sem token", "aviso", ""],
            ["z-index", "Tokens e cor", "z-index acima da camada de popup", "aviso", ""],
            ["z-index-token", "Tokens e cor", "z-index numérico igual a uma camada do DS", "—", "sim"],
            ["text-size", "Tipografia", "Tamanho de texto fora da escala", "aviso", ""],
            ["tailwind-text-scale", "Tipografia", "Escala de texto do Tailwind (text-sm, text-lg…)", "—", "sim"],
            ["native-select", "Componentes", "<select> nativo", "erro", ""],
            ["native-date", "Componentes", "<input type=\"date|datetime-local|month\">", "erro", ""],
            ["confirm-alert", "Componentes", "window.confirm / alert / prompt", "erro", ""],
            ["deprecated-export", "Componentes", "Export ou classe renomeada", "erro", "sim"],
            ["as-any-props", "Componentes", "as any em prop de componente", "info", ""],
            ["icon-button-label", "Acessibilidade", "Botão só com ícone sem nome acessível", "erro", ""],
            ["img-alt", "Acessibilidade", "<img> sem alt", "erro", ""],
            ["field-label", "Acessibilidade", "Campo sem rótulo", "aviso", ""],
            ["clickable-div", "Acessibilidade", "onClick em div/span sem teclado", "aviso", ""],
            ["outline-none", "Acessibilidade", "Foco removido sem substituto", "aviso", ""],
            ["positive-tabindex", "Acessibilidade", "tabIndex positivo", "aviso", ""],
            ["html-lang", "Acessibilidade", "<html> sem lang=\"pt-BR\"", "aviso", ""],
            ["number-format", "Formatação pt-BR", "Formatação fora do pt-BR", "erro", ""],
            ["locale-missing", "Formatação pt-BR", "toLocaleString/Intl sem locale", "aviso", ""],
            ["date-format", "Formatação pt-BR", "Formato de data fixo", "aviso", ""],
            ["effect-return", "React", "Efeito devolve algo que não é limpeza", "aviso", ""],
            ["raw-inert", "React", "inert direto no JSX (use inertProps: funciona no React 18 e 19)", "aviso", ""],
            ["deep-import", "Imports", "Import interno do pacote", "erro", "sim"],
            ["target-blank", "Segurança", "target=\"_blank\" sem rel=\"noopener\"", "aviso", "sim"],
            ["dangerous-html", "Segurança", "dangerouslySetInnerHTML", "aviso", ""],
            ["icon-star-import", "Performance", "import * de \"lucide-react\"", "aviso", ""],
            ["page-width-wrapper", "Anatomia de página", "Largura da página num wrapper (mx-auto max-w-*)", "aviso", ""],
            ["page-heading", "Anatomia de página", "<h1> solto numa tela com Page", "info", ""],
            ["disabled-wrapper", "Componentes", "Wrapper com opacity/pointer-events em volta de controle desabilitado", "aviso", ""],
            ["redundant-children", "Componentes", "Texto repetido em label e children", "info", "sim"],
            ["field-double-label", "Componentes", "FieldBlock em volta de campo que já tem rótulo", "aviso", ""],
            ["nested-drawer", "Componentes", "Drawer dentro de Drawer", "aviso", ""],
            ["multiple-primary", "Componentes", "Mais de um botão primário na mesma área", "aviso", ""],
            ["select-per-row", "Componentes", "Select/Combobox dentro de célula de tabela", "aviso", ""],
            ["cell-control-label", "Acessibilidade", "Checkbox/Switch em célula sem hideLabel", "aviso", "sim"],
            ["raw-input", "Componentes", "<input>/<textarea> cru", "aviso", ""],
            ["raw-table", "Componentes", "<table> cru", "info", ""],
            ["data-states", "Componentes", "Tabela com dados assíncronos sem estado de carregamento", "info", ""],
            ["manual-format", "Formatação pt-BR", "Formatação pt-BR feita à mão", "info", ""],
            ["copy-tone", "Escrita", "Texto com \"com sucesso\" ou exclamação", "aviso", ""],
            ["english-copy", "Escrita", "Texto de interface em inglês", "aviso", ""],
            ["title-case", "Escrita", "Botão em Title Case", "info", ""],
          ]}
        />
        <p className="m-0 text-[13px] text-muted">
          Guia completo com exemplos por regra:{" "}
          <a className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue" href={DOCS} target="_blank" rel="noopener noreferrer">
            docs/guias/auditoria.md
          </a>
          .
        </p>
      </DocSection>
    </DocPage>
  );
}

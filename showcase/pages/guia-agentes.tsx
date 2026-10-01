import { Callout } from "@g4ai/ds";
import { CodeBlock, DocPage, DocSection, type PageMeta } from "../kit";
import { GuideTable } from "./_guia-table";

export const meta: PageMeta = {
  title: "Agentes de IA",
  group: "Começar",
  order: 2.5,
  description: "O DS se descreve para agentes: servidor MCP local, llms.txt e Markdown no site, guia ai/ dentro do pacote e skills para o Claude Code. Escolha o que o seu agente consegue usar.",
};

const SITE = "https://gestao-quatro-ponto-zero.github.io/G4OS-DS/";

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Qual caminho usar" rule="MCP quando o agente suporta (é o mais preciso e lê a versão instalada). URLs quando ele só navega. Arquivos do pacote como base em qualquer caso.">
        <GuideTable
          head={["Caminho", "Para", "Como"]}
          rows={[
            ["MCP", "Claude Code, Codex, Cursor, VS Code, Gemini CLI, Zed, Windsurf, qualquer cliente MCP", "npx -y @g4ai/ds mcp (stdio, sem rede) · --http para URL"],
            ["llms.txt", "agentes que leem URLs, chats com busca na web", `${SITE}llms.txt`],
            ["ai/ no pacote", "qualquer agente com acesso ao repositório", "node_modules/@g4ai/ds/ai/core.md"],
            ["Plugin", "Claude Code: skills que disparam pelos pedidos", "/plugin install g4os-ds@g4os"],
          ]}
        />
      </DocSection>

      <DocSection title="1. Servidor MCP" rule="Roda local a partir do pacote: responde com a mesma versão de componentes e blocos que o projeto usa.">
        <CodeBlock
          code={`# Claude Code
claude mcp add g4os-ds -- npx -y @g4ai/ds mcp

# Codex
codex mcp add g4os-ds -- npx -y @g4ai/ds mcp

# Gemini CLI
gemini mcp add -s user g4os-ds npx -y @g4ai/ds mcp`}
        />
        <CodeBlock
          code={`// Cursor (.cursor/mcp.json), Claude Desktop, Windsurf, Cline, Kiro, JetBrains, pi (pi-mcp-adapter)
{ "mcpServers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }

// VS Code (.vscode/mcp.json): chave "servers"
{ "servers": { "g4os-ds": { "type": "stdio", "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }

// Zed (settings.json): chave "context_servers"
{ "context_servers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }`}
        />
        <CodeBlock
          code={`# ~/.codex/config.toml
[mcp_servers.g4os-ds]
command = "npx"
args = ["-y", "@g4ai/ds", "mcp"]
startup_timeout_sec = 60`}
        />
        <Callout tone="info" title="Outros clientes, Windows e modo HTTP">
          Continue, Goose, opencode, Amp, pi, a variante <code className="font-mono">cmd /c npx</code> para Windows, o modo HTTP (<code className="font-mono">npx -y @g4ai/ds mcp --http</code> → <code className="font-mono">http://127.0.0.1:3845/mcp</code>) e problemas comuns:{" "}
          <a className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue" href={`${SITE}docs/guias/mcp.md`}>
            docs/guias/mcp.md
          </a>
          . Compatível com os protocolos MCP 2024-11-05 a 2025-11-25; os schemas das ferramentas funcionam com Claude, GPT e Gemini.
        </Callout>
        <GuideTable
          head={["Ferramenta", "O que devolve"]}
          rows={[
            ["search", "componentes, blocos e guias por palavra-chave (\"funil de vendas\", \"aprovação\")"],
            ["get_component", "props, regras e exemplos de um componente ou módulo, com a linha de import"],
            ["list_blocks", "catálogo de telas prontas por categoria, com o objetivo de cada uma"],
            ["get_block", "conceito do bloco (objetivo, padrões, o que adaptar) e, com include_source, o código"],
            ["get_guide", "guias, padrões, receitas e fundamentos em Markdown (core e tokens também)"],
            ["get_tokens", "tokens semânticos, presets de marca e de tipografia"],
            ["theme_from_colors", "CSS de marca de cliente (claro e escuro) com contraste WCAG conferido"],
            ["audit", "o que foge do DS numa pasta do projeto, com a troca sugerida"],
            ["doctor", "se o projeto atende aos pré-requisitos (React 19, Tailwind 4, CSS, tema, fonte)"],
          ]}
        />
        <p className="m-0 text-[12.5px] text-muted">
          Prompts prontos: <code className="font-mono">criar-tela</code>, <code className="font-mono">revisar-tela</code> e <code className="font-mono">adaptar-projeto</code> (viram comandos / no Claude Code, VS Code e Zed). Respostas longas vêm em partes, com o <code className="font-mono">offset</code> para continuar. Também expõe recursos <code className="font-mono">g4os-ds://core</code>, <code className="font-mono">g4os-ds://components/&lt;módulo&gt;</code>, <code className="font-mono">g4os-ds://blocks/&lt;slug&gt;</code> e <code className="font-mono">g4os-ds://guides/&lt;slug&gt;</code>.
        </p>
      </DocSection>

      <DocSection title="2. Endereços para agentes" rule="Publicados com o site a cada versão. Texto puro, feito para caber no contexto.">
        <GuideTable
          head={["Endereço", "Conteúdo"]}
          rows={[
            [`${SITE}llms.txt`, "índice: guias, padrões, receitas, componentes e blocos com links"],
            [`${SITE}llms-full.txt`, "tudo essencial num arquivo: regras, tokens, anatomia, instalação, catálogos"],
            [`${SITE}ai/core.md`, "porta de entrada: regras, tokens, módulos, qual bloco usar"],
            [`${SITE}ai/components/<módulo>.md`, "props e exemplos de um módulo (charts, forms, overlays…)"],
            [`${SITE}ai/blocks/<slug>.md`, "conceito e componentes de um bloco (crm-pipeline, ai-chat…)"],
            [`${SITE}ai/manifest.json`, "catálogo estruturado de exports e blocos"],
            [`${SITE}docs/`, "fundamentos, padrões, receitas e guias em Markdown"],
          ]}
        />
      </DocSection>

      <DocSection title="3. No projeto, sem nada instalado no agente" rule="Cole o trecho no AGENTS.md (ou CLAUDE.md, .cursorrules) do app: o agente passa a ler o guia da versão instalada.">
        <CodeBlock
          code={`## Design system: G4OS-DS
Este projeto usa @g4ai/ds. Antes de criar ou editar interface, leia
node_modules/@g4ai/ds/ai/core.md (ou ${SITE}llms.txt).
Antes de concluir: npx g4os-ds audit <pastas alteradas> com 0 erros.`}
        />
        <p className="m-0 text-[12.5px] text-muted">
          Versão completa: <code className="font-mono">templates/AGENTS.snippet.md</code>.
        </p>
      </DocSection>

      <DocSection title="4. Plugin do Claude Code" rule="Cinco skills que disparam sozinhas: g4os-ds (base), ds-create, ds-migrate, ds-review, ds-theme.">
        <CodeBlock
          code={`/plugin marketplace add Gestao-Quatro-Ponto-Zero/G4OS-DS
/plugin install g4os-ds@g4os

# atualizar
/plugin marketplace update g4os`}
        />
      </DocSection>

      <DocSection title="Pedidos que funcionam">
        <GuideTable
          mono={[]}
          head={["Você pede", "O agente faz"]}
          rows={[
            ["\"Adapte este projeto ao G4OS-DS\"", "doctor → instala → audit como linha de base → MIGRATION.md → migra casca e telas uma a uma"],
            ["\"Crie a tela de contas a receber com o design system\"", "acha o bloco mais próximo (fin-receivables), adapta aos dados reais, cinco estados, audita"],
            ["\"Revise esta tela\"", "audit + checklist de padrões, relatório por gravidade"],
            ["\"Tema do cliente Acme: azul #0b5cff\"", "deriva claro e escuro com contraste AA e aplica data-brand"],
            ["\"Atualize o @g4ai/ds e ajuste o código\"", "lê o CHANGELOG e ai/renames.json, aplica, audita"],
          ]}
        />
        <Callout tone="info" title="Verificação">
          Todo fluxo termina com <code className="font-mono text-[12px]">npx g4os-ds audit</code> sem erros e o typecheck verde. Guia completo: <code className="font-mono text-[12px]">docs/guias/usar-com-ia.md</code>.
        </Callout>
      </DocSection>
    </DocPage>
  );
}

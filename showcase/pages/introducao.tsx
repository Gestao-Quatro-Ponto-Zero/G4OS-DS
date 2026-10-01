import { Blocks, BookOpen, Bot, ChartArea, LayoutDashboard, Puzzle, Sparkles } from "lucide-react";
import { Card } from "@g4ai/ds";
import { CodeBlock, DocPage, DocSection, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Introdução", group: "Começar", order: 0, description: "Um design system para construir qualquer aplicação G4 OS — CRM, ATS, ERP, financeiro, portais — com a mesma linguagem visual." };

export default function Page() {
  return (
    <DocPage title="G4OS-DS" kicker="Começar" description={meta.description}>
      <DocSection title="O que tem aqui" rule="Três camadas. Use a mais alta que resolver o seu caso: bloco pronto > composição de componentes > token.">
        <div className="grid gap-3 md:grid-cols-3">
          <Card href="#/blocos/saas">
            <Blocks className="mb-2 h-5 w-5 text-muted" />
            <div className="text-[14px] font-medium">Blocos</div>
            <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">Telas inteiras de CRM, ATS, ERP, financeiro, login, configurações. Copie e troque os dados.</p>
          </Card>
          <Card href="#/p/base-acoes">
            <Puzzle className="mb-2 h-5 w-5 text-muted" />
            <div className="text-[14px] font-medium">Componentes</div>
            <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">React + Base UI + Tailwind v4. Acessíveis, responsivos, em português.</p>
          </Card>
          <Card href="#/p/base-fundamentos">
            <Sparkles className="mb-2 h-5 w-5 text-muted" />
            <div className="text-[14px] font-medium">Tokens</div>
            <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">Cor, tipo, forma, sombra, movimento, camadas. CSS e TypeScript.</p>
          </Card>
        </div>
      </DocSection>
      <DocSection title="Instalar em um projeto" rule="Pacote @g4ai/ds no npm: JavaScript compilado, tipos e CSS. Funciona em Next.js e Vite sem configuração extra.">
        <CodeBlock
          code={`# 1. dependências
pnpm add @g4ai/ds @base-ui/react lucide-react      # ou npm i / yarn add
pnpm add -D tailwindcss @tailwindcss/postcss       # Vite: @tailwindcss/vite

/* 2. app/globals.css */
@import "tailwindcss";
@import "@g4ai/ds/styles.css";

// 3. app/layout.tsx: <html lang="pt-BR" className="ds-app" data-theme="system"> + themeScript + Figtree

// 4. use
import { AppShell, Sidebar, PageHeading, KpiCard, AreaChart } from "@g4ai/ds";`}
        />
      </DocSection>
      <DocSection title="Com agentes de IA" rule="O DS se descreve para agentes: servidor MCP local, llms.txt no site e skills para o Claude Code.">
        <CodeBlock
          code={`claude mcp add g4os-ds -- npx -y @g4ai/ds mcp

# ou, para agentes que leem URLs
https://gestao-quatro-ponto-zero.github.io/G4OS-DS/llms.txt`}
        />
        <Card href="#/p/guia-agentes">
          <Bot className="mb-2 h-5 w-5 text-muted" />
          <div className="text-[14px] font-medium">Agentes de IA</div>
          <p className="m-0 mt-1 text-[12.5px] text-muted">MCP no Claude Code, Cursor e VS Code, endereços para agentes, plugin e pedidos que funcionam.</p>
        </Card>
      </DocSection>
      <DocSection title="Por onde seguir">
        <div className="grid gap-3 md:grid-cols-3">
          <Card href="#/p/guia-principios">
            <BookOpen className="mb-2 h-5 w-5 text-muted" />
            <div className="text-[14px] font-medium">Princípios e regras</div>
            <p className="m-0 mt-1 text-[12.5px] text-muted">As decisões que fazem tudo parecer da mesma família.</p>
          </Card>
          <Card href="#/p/graficos-galeria">
            <ChartArea className="mb-2 h-5 w-5 text-muted" />
            <div className="text-[14px] font-medium">Gráficos</div>
            <p className="m-0 mt-1 text-[12.5px] text-muted">Do sparkline ao sankey, sem dependência.</p>
          </Card>
          <Card href="#/blocos/crm">
            <LayoutDashboard className="mb-2 h-5 w-5 text-muted" />
            <div className="text-[14px] font-medium">Montar um CRM</div>
            <p className="m-0 mt-1 text-[12.5px] text-muted">Pipeline, contato, dashboard de vendas.</p>
          </Card>
        </div>
      </DocSection>
    </DocPage>
  );
}

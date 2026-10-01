import { BarChart3, Briefcase, Building2, FilePlus2, FileText, Home, LogOut, Moon, Search, Settings, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Button, CommandPalette, Kbd, notify, useCommandShortcut, type Command } from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Paleta de comandos",
  group: "Sobreposições",
  order: 40,
  description: "⌘K de qualquer lugar: navegar, criar e encontrar registros pelo teclado. Busca sem acento, tolerante a abreviação, com recentes e atalhos visíveis.",
};

const go = (label: string) => () => notify(`Abrindo ${label}`, undefined, "info");
export const demoCommands: Command[] = [
  { id: "inicio", group: "Navegar", label: "Início", icon: <Home />, shortcut: ["G", "I"], onSelect: go("Início") },
  { id: "negocios", group: "Navegar", label: "Negócios", icon: <Briefcase />, shortcut: ["G", "N"], keywords: ["pipeline", "deals", "oportunidades"], onSelect: go("Negócios") },
  { id: "contatos", group: "Navegar", label: "Contatos", icon: <Users />, shortcut: ["G", "C"], keywords: ["pessoas", "leads"], onSelect: go("Contatos") },
  { id: "relatorios", group: "Navegar", label: "Relatórios", icon: <BarChart3 />, keywords: ["dashboard", "métricas"], onSelect: go("Relatórios") },
  { id: "novo-negocio", group: "Criar", label: "Novo negócio", icon: <FilePlus2 />, shortcut: ["⌘", "N"], onSelect: go("novo negócio") },
  { id: "novo-contato", group: "Criar", label: "Novo contato", icon: <UserPlus />, onSelect: go("novo contato") },
  { id: "acme", group: "Empresas", label: "Acme Logística", hint: "São Paulo · 3 negócios", icon: <Building2 />, onSelect: go("Acme Logística") },
  { id: "vertice", group: "Empresas", label: "Vértice Saúde", hint: "Belo Horizonte · 1 negócio", icon: <Building2 />, onSelect: go("Vértice Saúde") },
  { id: "horizonte", group: "Empresas", label: "Rede Horizonte Farmácias", hint: "Curitiba · 2 negócios", icon: <Building2 />, onSelect: go("Rede Horizonte") },
  { id: "proposta", group: "Documentos", label: "Proposta comercial — Acme", hint: "PDF · ontem", icon: <FileText />, onSelect: go("proposta") },
  { id: "tema", group: "Preferências", label: "Alternar tema escuro", icon: <Moon />, onSelect: go("tema") },
  { id: "config", group: "Preferências", label: "Configurações", icon: <Settings />, shortcut: ["⌘", ","], onSelect: go("Configurações") },
  { id: "sair", group: "Preferências", label: "Sair", icon: <LogOut />, onSelect: go("sair") },
];

export default function Page() {
  const [open, setOpen] = useState(false);
  useCommandShortcut(() => setOpen(true));
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Exemplo" rule={<>Aperte <Kbd>⌘</Kbd> <Kbd>K</Kbd> (ou Ctrl+K) nesta página, ou use o botão. Tente “ngc”, “saude”, “pipeline”.</>}>
        <Demo code={`const [open, setOpen] = useState(false);
useCommandShortcut(() => setOpen(true));

<CommandPalette open={open} onClose={() => setOpen(false)} commands={commands} recent={["negocios", "acme"]} />`}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 w-full max-w-[320px] items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] text-muted hover:border-line-strong"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Buscar ou executar…</span>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Abrir paleta</Button>
        </Demo>
        <CommandPalette open={open} onClose={() => setOpen(false)} commands={demoCommands} recent={["negocios", "acme", "novo-negocio"]} />
      </DocSection>

      <DocSection title="Comandos" rule="Cada comando tem grupo, rótulo, ícone e ação. `keywords` cobre sinônimos (“deals” → Negócios); `hint` dá contexto à direita; `shortcut` ensina o atalho.">
        <CodeBlock code={`const commands: Command[] = [
  { id: "negocios", group: "Navegar", label: "Negócios", icon: <Briefcase />,
    shortcut: ["G", "N"], keywords: ["pipeline", "deals"], onSelect: () => router.push("/negocios") },
  { id: "acme", group: "Empresas", label: "Acme Logística", hint: "São Paulo · 3 negócios",
    icon: <Building2 />, onSelect: () => router.push("/empresas/acme") },
];`} />
        <PropsTable
          rows={[
            ["commands", "Command[]", "—", "Tudo que a paleta encontra. Registros podem vir de busca no servidor."],
            ["recent", "string[]", "[]", "Ids exibidos primeiro quando a busca está vazia."],
            ["placeholder", "string", '"Buscar ou executar um comando…"', "Diga o que dá para buscar."],
            ["useCommandShortcut(fn, key?)", "hook", 'key="k"', "Registra ⌘/Ctrl + tecla no window."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Toda ação da paleta também existe na interface visível.", dont: "Funcionalidade só acessível pela paleta." },
            { do: "Verbos para ações (“Novo negócio”), substantivos para lugares (“Contatos”).", dont: "Misturar “Ir para contatos” com “Contatos”." },
            { do: "Até ~8 itens por grupo sem busca; o resto aparece ao digitar.", dont: "Listar os 5.000 contatos com a busca vazia." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

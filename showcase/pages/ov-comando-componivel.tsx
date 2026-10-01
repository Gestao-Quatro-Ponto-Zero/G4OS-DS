import { Building2, Calculator, Calendar, CreditCard, FilePlus2, Mail, Settings, Smile, User, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandMenu,
  CommandSeparator,
  KbdGroup,
  notify,
  useCommandShortcut,
} from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Command componível",
  group: "Sobreposições",
  order: 61,
  description:
    "CommandMenu e suas partes (CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty, CommandLoading, CommandSeparator) montam um seletor de ação com busca: inline num painel, menu de “/” num editor, troca de workspace, ou dentro de CommandDialog. A paleta ⌘K pronta continua sendo CommandPalette.",
  shadcn: "command",
};

const ok = (m: string) => () => notify(m, undefined, "info");

const empresas = ["Acme Indústria", "Nortec Sistemas", "Vale Verde Agro", "Banco Atlântico", "Grupo Horizonte", "Loja Ponto Sul", "Construtora Aliança", "Clínica Bem Viver", "Escola Futuro", "Transportes Rota", "Farmácia Saúde+", "Hotel Mirante"];

function ServerSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = window.setTimeout(() => {
      setResults(empresas.filter((e) => e.toLowerCase().includes(q.toLowerCase())));
      setLoading(false);
    }, 500);
    return () => window.clearTimeout(t);
  }, [q]);
  return (
    <CommandMenu label="Buscar empresa" value={q} onValueChange={setQ} filter={false} className="max-w-md">
      <CommandInput placeholder="Buscar empresa no CRM…" />
      <CommandList>
        {loading ? (
          <CommandLoading>Buscando empresas…</CommandLoading>
        ) : !q.trim() ? (
          <p className="m-0 px-3 py-6 text-center text-[12.5px] text-muted">Digite o nome, CNPJ ou cidade.</p>
        ) : (
          <>
            <CommandEmpty>Nenhuma empresa com “{q}”</CommandEmpty>
            <CommandGroup heading="Empresas">
              {results.map((e) => (
                <CommandItem key={e} icon={<Building2 />} onSelect={ok(`Abrir ${e}`)}>
                  {e}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandMenu>
  );
}

export default function Page() {
  const [open, setOpen] = useState(false);
  useCommandShortcut(() => setOpen(true), "j");
  const run = (m: string) => () => {
    setOpen(false);
    notify(m, undefined, "info");
  };
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Básico" rule="Busca sem acento e sem caixa; ↑ ↓ mudam o item, Enter executa, Ctrl+Home/End vão às pontas. Grupos que ficam vazios somem.">
        <Demo
          code={`<CommandMenu label="Sugestões">
  <CommandInput placeholder="Digite um comando ou busque…" />
  <CommandList>
    <CommandEmpty>Nada encontrado</CommandEmpty>
    <CommandGroup heading="Sugestões">
      <CommandItem icon={<Calendar />} onSelect={…}>Agenda</CommandItem>
      <CommandItem icon={<Smile />} onSelect={…}>Buscar emoji</CommandItem>
      <CommandItem icon={<Calculator />} disabled>Calculadora</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Configurações">
      <CommandItem icon={<User />} shortcut={["mod", "P"]} onSelect={…}>Perfil</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandMenu>`}
        >
          <CommandMenu label="Sugestões" className="max-w-md">
            <CommandInput placeholder="Digite um comando ou busque…" />
            <CommandList>
              <CommandEmpty>Nada encontrado</CommandEmpty>
              <CommandGroup heading="Sugestões">
                <CommandItem icon={<Calendar />} onSelect={ok("Agenda")}>
                  Agenda
                </CommandItem>
                <CommandItem icon={<Smile />} onSelect={ok("Emoji")}>
                  Buscar emoji
                </CommandItem>
                <CommandItem icon={<Calculator />} disabled>
                  Calculadora
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Configurações">
                <CommandItem icon={<User />} shortcut={["mod", "P"]} onSelect={ok("Perfil")}>
                  Perfil
                </CommandItem>
                <CommandItem icon={<CreditCard />} shortcut={["mod", "B"]} onSelect={ok("Cobrança")}>
                  Cobrança
                </CommandItem>
                <CommandItem icon={<Settings />} shortcut={["mod", "S"]} onSelect={ok("Configurações")}>
                  Configurações
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandMenu>
        </Demo>
      </DocSection>

      <DocSection title="Grupos, descrições e sinônimos" rule="`keywords` acrescenta termos que a busca encontra (sigla, nome antigo). `description` e `meta` dão contexto sem poluir o rótulo.">
        <Demo code={`<CommandItem icon={<FilePlus2 />} keywords={["oportunidade", "deal"]} description="Abre o formulário no painel lateral">Novo negócio</CommandItem>`}>
          <CommandMenu label="Criar" className="max-w-md">
            <CommandInput placeholder="O que você quer criar? (tente “deal” ou “candidato”)" />
            <CommandList>
              <CommandEmpty />
              <CommandGroup heading="Criar">
                <CommandItem icon={<FilePlus2 />} keywords={["oportunidade", "deal"]} description="Abre o formulário no painel lateral" onSelect={ok("Novo negócio")}>
                  Novo negócio
                </CommandItem>
                <CommandItem icon={<UserPlus />} keywords={["candidato", "pessoa", "lead"]} description="Contato de uma empresa existente" onSelect={ok("Novo contato")}>
                  Novo contato
                </CommandItem>
                <CommandItem icon={<Mail />} keywords={["email", "mensagem"]} meta="Gmail" onSelect={ok("Novo e-mail")}>
                  Escrever e-mail
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Empresas recentes">
                {empresas.slice(0, 3).map((e) => (
                  <CommandItem key={e} icon={<Building2 />} meta="Empresa" onSelect={ok(e)}>
                    {e}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandMenu>
        </Demo>
      </DocSection>

      <DocSection title="Lista longa (rolagem)" rule="CommandList rola sozinha (320 px por padrão, `maxHeight` muda); o item ativo sempre fica à vista.">
        <Demo code={`<CommandList maxHeight={220}>…</CommandList>`}>
          <CommandMenu label="Empresas" className="max-w-md">
            <CommandInput placeholder="Buscar empresa…" />
            <CommandList maxHeight={220}>
              <CommandEmpty />
              <CommandGroup heading="Todas as empresas">
                {empresas.map((e) => (
                  <CommandItem key={e} icon={<Building2 />} onSelect={ok(e)}>
                    {e}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandMenu>
        </Demo>
      </DocSection>

      <DocSection title="Busca no servidor" rule="`filter={false}` e busca controlada (`value`/`onValueChange`): você filtra os itens. CommandLoading enquanto responde, CommandEmpty quando não achou.">
        <Demo code={`<CommandMenu label="Buscar empresa" value={q} onValueChange={setQ} filter={false}>\n  …{loading ? <CommandLoading /> : <CommandEmpty />}…\n</CommandMenu>`}>
          <ServerSearch />
        </Demo>
      </DocSection>

      <DocSection title="Em diálogo" rule="CommandDialog monta a paleta à mão quando a CommandPalette pronta não basta. Feche no `onSelect`.">
        <Demo
          code={`<CommandDialog open={open} onOpenChange={setOpen} label="Ações rápidas">
  <CommandInput placeholder="Buscar ação…" autoFocus />
  <CommandList>…</CommandList>
</CommandDialog>`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setOpen(true)}>Abrir ações rápidas</Button>
            <span className="text-[12.5px] text-muted">
              ou <KbdGroup keys={["mod", "J"]} />
            </span>
          </div>
          <CommandDialog open={open} onOpenChange={setOpen} label="Ações rápidas">
            <CommandInput placeholder="Buscar ação…" autoFocus />
            <CommandList>
              <CommandEmpty />
              <CommandGroup heading="Ações">
                <CommandItem icon={<FilePlus2 />} shortcut={["N"]} onSelect={run("Novo negócio")}>
                  Novo negócio
                </CommandItem>
                <CommandItem icon={<UserPlus />} shortcut={["C"]} onSelect={run("Novo contato")}>
                  Novo contato
                </CommandItem>
                <CommandItem icon={<Settings />} shortcut={["mod", ","]} onSelect={run("Configurações")}>
                  Configurações
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </Demo>
      </DocSection>

      <DocSection title="API">
        <PropsTable
          rows={[
            ["CommandMenu.label", "string", "—", "Nome acessível do seletor."],
            ["CommandMenu.value / onValueChange", "string / (v) => void", "—", "Busca controlada."],
            ["CommandMenu.filter", "boolean | (texto, busca) => boolean", "true", "`false` quando a busca é no servidor."],
            ["CommandMenu.loop", "boolean", "true", "↓ no último volta ao primeiro."],
            ["CommandItem.value / keywords", "string / string[]", "children", "Texto usado na busca e sinônimos."],
            ["CommandItem.icon / description / meta / shortcut", "ReactNode / ReactNode / ReactNode / string[]", "—", "Ícone, segunda linha, contexto à direita e atalho (\"mod\" = ⌘ ou Ctrl)."],
            ["CommandItem.onSelect / disabled", "(value) => void / boolean", "—", "Executa no clique ou Enter."],
            ["CommandList.maxHeight", "number", "320", "Altura antes de rolar."],
            ["CommandEmpty.hint", "ReactNode", "dica padrão", "Segunda linha do vazio."],
            ["CommandDialog.open / onOpenChange / label", "boolean / (o) => void / string", "—", "Command dentro de um diálogo."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "CommandPalette para o ⌘K do app; CommandMenu para seletores de ação dentro de telas e editores.", dont: "Duas paletas ⌘K no mesmo app." },
            { do: "Itens com verbo + objeto (“Novo negócio”) e atalho visível quando existir.", dont: "Lista sem busca acima de 12 itens." },
            { do: "Busca no servidor com CommandLoading e debounce.", dont: "Filtrar no cliente uma lista paginada (resultados faltando)." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

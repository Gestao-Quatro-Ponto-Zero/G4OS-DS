import { Globe, KeyRound, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import {
  ActionMenu,
  Badge,
  Breadcrumb,
  Button,
  Card,
  ChipRow,
  EntityMark,
  FilterChip,
  HealthDot,
  IconButton,
  ListRow,
  RecordSection,
  RowList,
  Section,
  SettingsSection,
  Slider,
  StatCell,
  StatGrid,
  Switch,
  Tabs,
  TextField,
  ThemeToggle,
  formatNumber,
  formatRelative,
  notify,
  useIsMobile,
} from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Seções, listas e faixas",
  group: "Ações e exibição",
  order: 35,
  description: "As peças que montam o corpo de uma página de registro ou de configuração: seção com título e explicação, lista de linhas com ações, faixa de números, abas em uma linha, chips que rolam e trilha com voltar.",
  shadcn: false,
};

const tabs = ["Visão geral", "Atividade", "Membros", "Regras", "Conhecimento", "Conexões", "Automações", "Chaves", "Uso e limites", "Auditoria"].map((label, i) => ({ id: `t${i}`, label, count: i === 2 ? 12 : undefined }));
const categories = ["Todos", "Vendas", "Financeiro", "Atendimento", "Marketing", "Pessoas", "Jurídico", "Operações", "Dados", "Engenharia"];
const now = Date.now();
const domains = [
  { id: "1", name: "g4educacao.com", note: "Domínio principal · 214 pessoas", ok: true },
  { id: "2", name: "g4scale.com.br", note: "Verificado em 12/08 · 38 pessoas", ok: true },
  { id: "3", name: "parceiros.g4.com", note: "Aguardando o registro TXT no DNS", ok: false },
];

export default function Page() {
  const [tab, setTab] = useState("t0");
  const [cat, setCat] = useState("Todos");
  const [sso, setSso] = useState({ "1": true, "2": false, "3": false } as Record<string, boolean>);
  const [limit, setLimit] = useState(60);
  const [saved, setSaved] = useState(60);
  const [name, setName] = useState("G4 Educação");
  const mobile = useIsMobile();
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Seção com título e explicação" rule="Todo título de seção vem de um componente, nunca de um `<h2>` solto com classes de tipo. `description` explica a seção em uma linha; `id` ancora (#id) e liga a um SectionNav; `action` fica à direita.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo title="Section · conteúdo de página" className="block" code={`<Section id="dominios" title="Domínios" description="Quem entra com um e-mail destes domínios cai neste workspace." action={<Button size="sm">Adicionar</Button>}>
  …
</Section>`}>
            <Section title="Domínios" description="Quem entra com um e-mail destes domínios cai neste workspace." action={<Button size="sm" variant="ghost"><Plus /> Adicionar</Button>}>
              <RowList label="Domínios">
                {domains.slice(0, 2).map((d) => (
                  <ListRow key={d.id} leading={<Globe className="h-4 w-4 text-muted" />} title={d.name} description={d.note} />
                ))}
              </RowList>
            </Section>
          </Demo>
          <Demo title="RecordSection · painel de registro" className="block" code={`<RecordSection title="Chaves de API" description="…" action={<button>Criar chave</button>}>…</RecordSection>`}>
            <RecordSection className="border-t-0 pt-0" title="Chaves de API" description="Cada chave acessa só o que este agente acessa. Revogue quando a integração sair do ar." action={<button type="button" onClick={() => notify("Chave criada")}>Criar chave</button>}>
              <RowList label="Chaves de API">
                <ListRow leading={<KeyRound className="h-4 w-4 text-muted" />} title="Integração do CRM" description="Usada há 5 minutos" meta="sk-…9f2a" />
              </RowList>
            </RecordSection>
          </Demo>
        </div>
        <Demo title="SettingsSection · rótulo à esquerda, campos à direita" className="block" code={`<SettingsSection id="limites" title="Limite mensal" description="…">
  <Slider label="Créditos por mês" value={limit} onChange={setLimit} onValueCommit={save} />
</SettingsSection>`}>
          <SettingsSection id="limites" title="Limite mensal" description="Quando o time chega ao limite, os agentes param e avisam os administradores.">
            <Slider label="Créditos por mês (em milhares)" value={limit} onChange={setLimit} onValueCommit={(v) => { setSaved(v); notify(`Limite salvo: ${formatNumber(v)} mil créditos por mês`); }} min={10} max={200} step={10} marks={[10, 100, 200]} />
            <p className="m-0 -mt-2 text-[12.5px] text-muted">Salvo: {formatNumber(saved)} mil. <code className="font-mono text-[11.5px]">onChange</code> acompanha o arraste; <code className="font-mono text-[11.5px]">onValueCommit</code> salva uma vez, ao soltar.</p>
          </SettingsSection>
          <SettingsSection title="Nome do workspace" description="Aparece no seletor e nos convites.">
            <TextField label="Nome" value={name} onChange={setName} />
          </SettingsSection>
        </Demo>
      </DocSection>

      <DocSection title="Lista de linhas com ações" rule="`RowList` é a lista padrão de configuração e de registro: superfície, borda de 1 px e divisórias. Cada `ListRow` tem marca, título, uma linha muda, meta e `actions`. Com `href` ou `onClick` a linha inteira é o alvo, e as ações continuam clicáveis por conta própria.">
        <Demo className="block" code={`<RowList label="Domínios">
  <ListRow
    href={\`/dominios/\${d.id}\`}
    leading={<EntityMark name={d.name} />}
    title={d.name}
    description={d.note}
    meta={<HealthDot tone="ok" label="Verificado" />}
    actions={<>
      <Switch label="Exigir SSO" hideLabel checked={…} onCheckedChange={…} />
      <ActionMenu actions={[…]} />
    </>}
  />
</RowList>`}>
          <RowList label="Domínios da empresa">
            {domains.map((d) => (
              <ListRow
                key={d.id}
                onClick={() => notify(`Abrir ${d.name}`, undefined, "info")}
                leading={<EntityMark name={d.name} />}
                title={d.name}
                description={d.note}
                meta={<HealthDot tone={d.ok ? "ok" : "warn"} label={d.ok ? "Verificado" : "Pendente"} />}
                actions={
                  <>
                    <Switch label={`Exigir SSO em ${d.name}`} hideLabel checked={sso[d.id]} onCheckedChange={(c) => setSso((s) => ({ ...s, [d.id]: c }))} disabled={!d.ok} />
                    <ActionMenu actions={[{ label: "Copiar registro TXT", onSelect: () => notify("Registro copiado") }, { label: "Remover domínio", tone: "danger", icon: <Trash2 />, separator: true }]} />
                  </>
                }
              />
            ))}
          </RowList>
        </Demo>
        <Demo title="Linha simples" description="Sem alvo e sem ações, a linha só informa. `meta` alinha à direita com números tabulares." className="block" code={`<ListRow leading={…} kicker="Time de vendas" title="Marina Couto" meta={formatRelative(date, { short: true })} />`}>
          <RowList label="Atividade recente">
            <ListRow leading={<Users className="h-4 w-4 text-muted" />} kicker="Time de vendas" title="Marina Couto entrou no workspace" meta={formatRelative(now - 5 * 60e3, { short: true })} />
            <ListRow leading={<KeyRound className="h-4 w-4 text-muted" />} kicker="Integrações" title="Chave do CRM renovada" meta={formatRelative(now - 3 * 3600e3, { short: true })} actions={<IconButton label="Ver detalhes" size="sm"><Plus /></IconButton>} />
            <ListRow leading={<Globe className="h-4 w-4 text-muted" />} kicker="Domínios" title="g4scale.com.br verificado" meta={formatRelative(now - 2 * 86400e3, { short: true })} />
          </RowList>
        </Demo>
      </DocSection>

      <DocSection title="Faixa de números" rule="`StatGrid` vai de 2 a 6 colunas. `dense` mantém a grade no celular (3 por linha) em vez de empilhar: é a faixa de números no topo de um registro. Em `StatCell`, `short` é o rótulo curto do celular e `of` é a base do número.">
        <Demo className="block" bare code={`<StatGrid cols={5} dense>
  <StatCell label="Tarefas concluídas" short="Feitas" value={18} of="de 24" />
  <StatCell label="Aguardando você" short="Com você" value={3} tone="warn" />
  …
</StatGrid>`}>
          <StatGrid cols={5} dense>
            <StatCell label="Tarefas concluídas" short="Feitas" value={18} of="de 24" />
            <StatCell label="Aguardando você" short="Com você" value={3} tone="warn" />
            <StatCell label="Em execução" short="Rodando" value={2} />
            <StatCell label="Falharam" short="Falhas" value={1} tone="bad" />
            <StatCell label="Créditos usados" short="Créditos" value={formatNumber(4820)} hint="62 % do mês" />
          </StatGrid>
        </Demo>
      </DocSection>

      <DocSection title="Abas em uma linha e chips que rolam" rule="Abas e chips que não cabem não devem quebrar em três linhas no celular. `Tabs overflow=&quot;scroll&quot;` mantém uma linha, esmaece a borda que tem mais itens e traz a aba ativa para a vista. `ChipRow` faz o mesmo com filtros: quebra no desktop, rola no celular.">
        <Demo title="Tabs overflow=&quot;scroll&quot;" className="block" code={`<Tabs label="Seções do agente" overflow="scroll" items={tabs} value={tab} onChange={setTab} />`}>
          <div className="max-w-[560px] border-b border-line">
            <Tabs label="Seções do agente" overflow="scroll" items={tabs} value={tab} onChange={setTab} />
          </div>
          <p className="m-0 mt-3 text-[12.5px] text-muted">Aba ativa: {tabs.find((t) => t.id === tab)?.label}</p>
        </Demo>
        <Demo title="ChipRow" description="`FilterChip shape=&quot;pill&quot;` é a pílula de categoria; `count` mostra quantos itens o filtro tem." className="block" code={`<ChipRow label="Categorias">
  {categories.map((c) => (
    <FilterChip key={c} shape="pill" on={c === cat} onClick={() => setCat(c)} count={…}>{c}</FilterChip>
  ))}
</ChipRow>`}>
          <div className="max-w-[560px]">
            <ChipRow label="Categorias" wrap={false}>
              {categories.map((c, i) => (
                <FilterChip key={c} shape="pill" on={c === cat} onClick={() => setCat(c)} count={i ? 4 + ((i * 7) % 19) : 142}>
                  {c}
                </FilterChip>
              ))}
            </ChipRow>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Trilha com voltar" rule="A trilha continua só com ancestrais. `back` acrescenta o botão de voltar para a tela de onde a pessoa veio, que nem sempre é o ancestral (uma busca, um quadro filtrado).">
        <Demo code={`<Breadcrumb back={{ label: "Voltar para Entregas", href: "/entregas" }} items={[{ label: "Entregas", href: "/entregas" }, { label: "Relatórios", href: "/entregas/relatorios" }]} />`}>
          <Breadcrumb back={{ label: "Voltar para Entregas", onClick: () => notify("Voltar para Entregas", undefined, "info") }} items={[{ label: "Entregas", href: "#/p/estrutura-pagina-e-listas" }, { label: "Relatórios", href: "#/p/estrutura-pagina-e-listas" }]} />
        </Demo>
      </DocSection>

      <DocSection title="Card com o respiro certo" rule="`padding` cobre os quatro casos sem `p-0!` nem classe por cima: `sm` para card denso, `md` (padrão), `lg` para formulário ou destaque e `none` quando o conteúdo traz o próprio respiro (lista, tabela, mídia).">
        <Demo className="block" code={`<Card padding="lg">…</Card>
<Card padding="none"><ListRow … /><ListRow … /></Card>`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["sm", "md", "lg"] as const).map((p) => (
              <Card key={p} padding={p}>
                <div className="text-[12px] text-muted">padding="{p}"</div>
                <div className="mt-1 text-[15px] font-medium">Plano Scale</div>
                <Badge className="mt-2">Ativo</Badge>
              </Card>
            ))}
            <Card padding="none">
              <div className="divide-y divide-line">
                <ListRow title='padding="none"' description="Conteúdo com respiro próprio" />
                <ListRow title="Plano Scale" meta="Ativo" />
              </div>
            </Card>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Tema em menu e largura em JS" rule="`ThemeToggle variant=&quot;menu&quot;` cabe em barra de topo e rail, onde o alternador de três posições não cabe. `useIsMobile()` devolve `true` abaixo de 768 px (o corte do `md:` e da navegação de celular): use para trocar a superfície (Popover no desktop, Sheet no celular), nunca para esconder conteúdo, que é trabalho do CSS.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo title="ThemeToggle" code={`<ThemeToggle variant="menu" />`}>
            <div className="flex items-center gap-4">
              <ThemeToggle variant="menu" />
              <ThemeToggle compact />
            </div>
          </Demo>
          <Demo title="useIsMobile" code={`const mobile = useIsMobile();
return mobile ? <Sheet …>{filtros}</Sheet> : <Popover …>{filtros}</Popover>;`}>
            <HealthDot tone={mobile ? "warn" : "ok"} label={mobile ? "Abaixo de 768 px: abrir como Sheet" : "768 px ou mais: abrir como Popover"} />
          </Demo>
        </div>
      </DocSection>

      <DocSection title="Props novas">
        <PropsTable
          rows={[
            ["Section / RecordSection / SettingsSection", "description, id, title: ReactNode", "—", "Explicação da seção, âncora e título com marcação."],
            ["ListRow", "description, actions, className", "—", "Linha muda e controles à direita que não navegam junto com a linha."],
            ["RowList", "label", "—", "Lista com borda e divisórias; filhos são ListRow."],
            ["StatGrid", "cols: 2–6, dense", "2, false", "Mais colunas e grade no celular."],
            ["StatCell", "short, of", "—", "Rótulo curto no celular e base do número."],
            ["Tabs", 'overflow: "wrap" | "scroll"', '"wrap"', "Uma linha com rolagem e esmaecido."],
            ["FilterChip", 'shape: "default" | "pill", count', '"default"', "Pílula de categoria e contagem."],
            ["Breadcrumb", "back: { label, href?, onClick? }", "—", "Botão de voltar antes da trilha."],
            ["Card", 'padding: "none" | "sm" | "md" | "lg"', '"md"', "Respiro interno."],
            ["Slider", "onValueCommit", "—", "Chamado uma vez ao soltar."],
            ["ThemeToggle", 'variant: "segmented" | "menu"', '"segmented"', "Botão de ícone que abre as três opções."],
          ]}
        />
      </DocSection>

      <Rules
        items={[
          { do: "Lista de configuração: RowList + ListRow, com ações em `actions`.", dont: "`<ul className=\"divide-y …\">` montado à mão em cada tela." },
          { do: "Salvar no `onValueCommit` do Slider.", dont: "Chamar a API a cada movimento do arraste." },
          { do: "Abas e chips em uma linha que rola no celular.", dont: "Três linhas de abas empurrando o conteúdo para baixo da dobra." },
        ]}
      />
    </DocPage>
  );
}

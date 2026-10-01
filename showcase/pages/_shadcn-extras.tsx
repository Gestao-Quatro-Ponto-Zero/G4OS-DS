// Exemplos espelhando as seções da documentação do shadcn/ui (base) para
// Menu, Carousel, Collapsible e NavigationMenu. Importados pelas páginas.
import {
  BarChart3,
  BookOpen,
  ChevronsUpDown,
  CircleDashed,
  CircleDot,
  Cloud,
  CreditCard,
  File,
  Folder,
  Keyboard,
  LifeBuoy,
  LogOut,
  Mail,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Plus,
  Settings,
  Sun,
  Trash2,
  User,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import {
  AspectFrame,
  Avatar,
  Button,
  Carousel,
  Collapsible,
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
  IconButton,
  Menu,
  NavigationMenu,
  Switch,
  navigationMenuTriggerClass,
  notify,
  type CarouselApi,
  type MenuEntry,
} from "@g4ai/ds";
import { Demo, DocSection } from "../kit";
import { art, gallery } from "./_media-data";

const n = (m: string) => () => notify(m, undefined, "info");

/* ------------------------------- Menu ------------------------------- */

export function MenuShadcnExamples() {
  const [bars, setBars] = useState({ status: true, activity: false, panel: false });
  const [notifs, setNotifs] = useState({ email: true, push: false, sms: false });
  const [position, setPosition] = useState("bottom");
  const [theme, setTheme] = useState("system");

  const basic: MenuEntry[] = [
    { type: "label", label: "Minha conta" },
    { label: "Perfil", onSelect: n("Perfil") },
    { label: "Cobrança", onSelect: n("Cobrança") },
    { label: "Configurações", onSelect: n("Configurações") },
    { type: "separator" },
    { label: "Sair", onSelect: n("Sair") },
  ];
  const submenu: MenuEntry[] = [
    { label: "Equipe", icon: <Users />, onSelect: n("Equipe") },
    { type: "submenu", label: "Convidar pessoas", icon: <UserPlus />, items: [{ label: "E-mail", icon: <Mail />, onSelect: n("Convite por e-mail") }, { label: "Mensagem", icon: <MessageSquare />, onSelect: n("Convite por mensagem") }, { type: "separator" }, { label: "Mais…", icon: <Plus />, onSelect: n("Mais opções") }] },
    { label: "Nova equipe", icon: <Plus />, shortcut: ["mod", "T"], onSelect: n("Nova equipe") },
  ];
  const shortcuts: MenuEntry[] = [
    { label: "Perfil", shortcut: ["shift", "mod", "P"], onSelect: n("Perfil") },
    { label: "Cobrança", shortcut: ["mod", "B"], onSelect: n("Cobrança") },
    { label: "Configurações", shortcut: ["mod", "S"], onSelect: n("Configurações") },
    { label: "Atalhos de teclado", shortcut: ["mod", "K"], onSelect: n("Atalhos") },
  ];
  const icons: MenuEntry[] = [
    { label: "Perfil", icon: <User />, onSelect: n("Perfil") },
    { label: "Cobrança", icon: <CreditCard />, onSelect: n("Cobrança") },
    { label: "Configurações", icon: <Settings />, onSelect: n("Configurações") },
    { label: "Atalhos de teclado", icon: <Keyboard />, onSelect: n("Atalhos") },
    { type: "separator" },
    { label: "Documentação", icon: <BookOpen />, href: "#/p/ov-menus" },
    { label: "Suporte", icon: <LifeBuoy />, href: "#/p/ov-menus" },
    { label: "API", icon: <Cloud />, disabled: true },
  ];
  const checks: MenuEntry[] = [
    { type: "label", label: "Aparência" },
    { type: "checkbox", label: "Barra de status", checked: bars.status, onCheckedChange: (v) => setBars({ ...bars, status: v }) },
    { type: "checkbox", label: "Barra de atividade", checked: bars.activity, onCheckedChange: (v) => setBars({ ...bars, activity: v }), disabled: true, description: "Disponível no plano Pro" },
    { type: "checkbox", label: "Painel lateral", checked: bars.panel, onCheckedChange: (v) => setBars({ ...bars, panel: v }) },
  ];
  const checkIcons: MenuEntry[] = [
    { type: "label", label: "Notificações" },
    { type: "checkbox", label: "E-mail", icon: <Mail />, checked: notifs.email, onCheckedChange: (v) => setNotifs({ ...notifs, email: v }) },
    { type: "checkbox", label: "Push no celular", icon: <MessageSquare />, checked: notifs.push, onCheckedChange: (v) => setNotifs({ ...notifs, push: v }) },
    { type: "checkbox", label: "SMS", icon: <MessageSquare />, checked: notifs.sms, onCheckedChange: (v) => setNotifs({ ...notifs, sms: v }) },
  ];
  const radio: MenuEntry[] = [
    { type: "label", label: "Posição do painel" },
    { type: "radio", value: position, onValueChange: setPosition, options: [{ value: "top", label: "Em cima" }, { value: "bottom", label: "Embaixo" }, { value: "right", label: "À direita" }] },
  ];
  const radioIcons: MenuEntry[] = [
    { type: "label", label: "Tema" },
    {
      type: "radio",
      value: theme,
      onValueChange: setTheme,
      options: [
        { value: "light", label: "Claro", icon: <Sun /> },
        { value: "dark", label: "Escuro", icon: <Moon /> },
        { value: "system", label: "Do sistema", icon: <CircleDashed />, description: "Segue o sistema operacional" },
      ],
    },
  ];
  const destructive: MenuEntry[] = [
    { label: "Editar", onSelect: n("Editar") },
    { label: "Duplicar", onSelect: n("Duplicar") },
    { type: "separator" },
    { label: "Excluir negócio", icon: <Trash2 />, tone: "danger", onSelect: n("Excluir pede ConfirmDialog") },
  ];
  const complex: MenuEntry[] = [
    { type: "header", content: <div className="flex items-center gap-2.5"><Avatar name="Ana Lopes" src={art(3)} tint="#184560" size="sm" /><div className="min-w-0"><div className="truncate text-[13px] font-medium">Ana Lopes</div><div className="truncate text-[12px] text-muted">Plano Pro · Acme</div></div></div> },
    { label: "Perfil", icon: <User />, shortcut: ["shift", "mod", "P"], onSelect: n("Perfil") },
    { label: "Cobrança", icon: <CreditCard />, description: "Próxima fatura em 12/10", onSelect: n("Cobrança") },
    { type: "submenu", label: "Tema", icon: <Sun />, items: radioIcons },
    { type: "submenu", label: "Notificações", icon: <Mail />, items: checkIcons },
    { type: "separator" },
    { label: "Workspace novo", icon: <Plus />, onSelect: n("Workspace novo") },
    { type: "separator" },
    { label: "Sair", icon: <LogOut />, shortcut: ["shift", "mod", "Q"], onSelect: n("Sair") },
  ];

  const cases: [string, MenuEntry[], string][] = [
    ["Básico", basic, "Rótulo de grupo, itens e separador."],
    ["Submenu", submenu, "`type: \"submenu\"` abre ao lado."],
    ["Atalhos", shortcuts, '`shortcut: ["mod", "B"]`: ⌘ no Mac, Ctrl nos outros.'],
    ["Ícones", icons, "Ícone de 16 px; link com `href`; item desabilitado legível."],
    ["Marcações", checks, "Não fecha ao clicar; desabilitado com motivo em `description`."],
    ["Marcações com ícone", checkIcons, "Ícone à esquerda, check à direita."],
    ["Escolha única", radio, "Ponto indica a escolhida."],
    ["Escolha única com ícone", radioIcons, "Com ícone, o check vai à direita."],
    ["Destrutivo", destructive, "`tone: \"danger\"` por último; a ação pede ConfirmDialog."],
  ];

  return (
    <DocSection id="exemplos-shadcn" title="Exemplos (como no shadcn/ui)" rule="Os mesmos casos da documentação do Dropdown Menu, com a API do Menu (lista de entradas).">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map(([title, items, desc]) => (
          <Demo key={title} title={title} description={desc} code={`<Menu label="${title}" trigger="Abrir" items={…} />`}>
            <Menu label={title} trigger="Abrir" items={items} />
          </Demo>
        ))}
        <Demo title="Avatar como gatilho" description="`triggerVariant=&quot;bare&quot;`." code={`<Menu label="Conta" triggerVariant="bare" trigger={<Avatar name="Ana Lopes" />} items={…} />`}>
          <Menu label="Conta de Ana Lopes" triggerVariant="bare" trigger={<Avatar name="Ana Lopes" src={art(3)} tint="#184560" />} items={basic} />
        </Demo>
        <Demo title="Completo" description="Cabeçalho da conta, descrição, submenus com escolha e marcações." code={`<Menu label="Conta" triggerVariant="ghost" trigger={…} width={260} items={[{ type: "header", content: … }, …]} />`}>
          <Menu
            label="Conta e preferências"
            triggerVariant="ghost"
            width={260}
            trigger={
              <>
                <Avatar name="Ana Lopes" src={art(3)} tint="#184560" size="xs" /> Ana Lopes <ChevronsUpDown className="text-muted" />
              </>
            }
            items={complex}
          />
        </Demo>
        <Demo title="Gatilho de ícone" description="`triggerVariant=&quot;icon&quot;` (32 px)." code={`<Menu label="Mais ações" triggerVariant="icon" trigger={<MoreHorizontal />} items={…} />`}>
          <Menu label="Mais ações" triggerVariant="icon" trigger={<MoreHorizontal />} items={destructive} />
        </Demo>
      </div>
    </DocSection>
  );
}

/* ------------------------------ Carousel ----------------------------- */

function Slide({ i, label }: { i: number; label?: string }) {
  return (
    <AspectFrame ratio={16 / 9}>
      <img src={gallery[i % gallery.length].src} alt={gallery[i % gallery.length].alt} />
      {label && <span className="absolute bottom-2 left-2 rounded-md bg-popover/90 px-2 py-0.5 text-[12px] text-ink">{label}</span>}
    </AspectFrame>
  );
}

function ApiExample() {
  const [api, setApi] = useState<CarouselApi>();
  const [events, setEvents] = useState<string[]>([]);
  return (
    <div className="w-full min-w-0 space-y-3">
      <Carousel label="Fotos com controle externo" setApi={setApi} onIndexChange={(i) => setEvents((e) => [`select → ${i + 1}`, ...e].slice(0, 3))} dots={false} arrows={false}>
        {gallery.slice(0, 5).map((_, i) => (
          <Slide key={i} i={i} />
        ))}
      </Carousel>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" disabled={!api?.canPrev} onClick={() => api?.prev()}>
          Anterior
        </Button>
        <span className="text-[12.5px] tabular-nums text-muted" aria-live="polite">
          {api ? `${api.index + 1} de ${api.count}` : "—"}
        </span>
        <Button size="sm" variant="ghost" disabled={!api?.canNext} onClick={() => api?.next()}>
          Próximo
        </Button>
        <span className="ml-auto text-[11.5px] text-muted">Eventos: {events.join(" · ") || "role ou use os botões"}</span>
      </div>
    </div>
  );
}

export function CarouselShadcnExamples() {
  return (
    <DocSection id="exemplos-shadcn" title="Exemplos (como no shadcn/ui)" rule="Tamanhos e espaçamento por `perView`/`gap`, orientação vertical, `loop`, controle por API e eventos, autoplay e miniaturas.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Demo title="Tamanhos e espaçamento" description="3 por vez (2 em espaço estreito), 24 px entre itens." code={`<Carousel label="…" perView={3} perViewMobile={2} gap={24}>…</Carousel>`}>
          <Carousel label="Modelos de proposta" perView={3} perViewMobile={2} gap={24}>
            {gallery.slice(0, 6).map((_, i) => (
              <Slide key={i} i={i} label={`Modelo ${i + 1}`} />
            ))}
          </Carousel>
        </Demo>
        <Demo title="Vertical" description="`orientation=&quot;vertical&quot;` com `height`; ↑/↓ quando focado." code={`<Carousel label="…" orientation="vertical" height={220}>…</Carousel>`}>
          <Carousel label="Avisos" orientation="vertical" height={220} dots={false}>
            {gallery.slice(0, 4).map((_, i) => (
              <Slide key={i} i={i + 2} label={`Aviso ${i + 1}`} />
            ))}
          </Carousel>
        </Demo>
        <Demo title="Loop e contador" description="Depois do último volta ao primeiro; “2 de 5” no canto." code={`<Carousel label="…" loop counter>…</Carousel>`}>
          <Carousel label="Fotos do evento" loop counter>
            {gallery.slice(0, 5).map((_, i) => (
              <Slide key={i} i={i + 1} />
            ))}
          </Carousel>
        </Demo>
        <Demo title="API e eventos" description="`setApi` dá index, count, next e prev; `onIndexChange` é o evento de seleção." code={`const [api, setApi] = useState<CarouselApi>();\n<Carousel label="…" setApi={setApi} onIndexChange={(i) => …}>…</Carousel>\n<Button onClick={() => api?.next()}>Próximo</Button>`}>
          <ApiExample />
        </Demo>
        <Demo title="Autoplay" description="Pausa no hover e no foco; desliga com “reduzir movimento”." code={`<Carousel label="…" autoplay={4000}>…</Carousel>`}>
          <Carousel label="Destaques rotativos" autoplay={4000}>
            {gallery.slice(2, 6).map((_, i) => (
              <Slide key={i} i={i + 2} />
            ))}
          </Carousel>
        </Demo>
        <Demo title="Miniaturas" description="`thumbnails` no lugar dos pontos (galeria de produto, imóvel)." code={`<Carousel label="…" thumbnails={fotos.map((f) => <img src={f.src} alt="" />)}>…</Carousel>`}>
          <Carousel label="Fotos do imóvel" thumbnails={gallery.slice(0, 5).map((g) => <img key={g.src} src={g.src} alt="" />)}>
            {gallery.slice(0, 5).map((_, i) => (
              <Slide key={i} i={i} />
            ))}
          </Carousel>
        </Demo>
      </div>
    </DocSection>
  );
}

/* ----------------------------- Collapsible ---------------------------- */

const files = [
  { name: "propostas", children: [{ name: "acme-v3.pdf" }, { name: "nortec-v1.pdf" }] },
  { name: "contratos", children: [{ name: "modelos", children: [{ name: "padrao-24m.docx" }, { name: "pme.docx" }] }, { name: "assinados.zip" }] },
  { name: "LEIA-ME.md" },
];
type Node = { name: string; children?: Node[] };

function FileNode({ node }: { node: Node }) {
  if (!node.children)
    return (
      <div className="flex items-center gap-2 rounded-md py-1 pl-6 pr-2 text-[13px] text-ink-soft">
        <File className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
        {node.name}
      </div>
    );
  return (
    <CollapsibleRoot defaultOpen={node.name === "propostas"}>
      <CollapsibleTrigger className="w-full px-1 py-1 text-[13px] text-ink hover:bg-soft">
        <Folder className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
        {node.name}
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-3 border-l border-line pl-1.5">
        {node.children.map((c) => (
          <FileNode key={c.name} node={c} />
        ))}
      </CollapsibleContent>
    </CollapsibleRoot>
  );
}

export function CollapsibleShadcnExamples() {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState({ auto: true, digest: false, sla: true });
  return (
    <DocSection id="exemplos-shadcn" title="Collapsible: mais formas" rule="`variant` muda o gatilho (inline, linha, card); `open`/`onOpenChange` controlam; CollapsibleRoot + Trigger + Content montam gatilhos próprios (árvore de arquivos).">
      <div className="grid gap-6 lg:grid-cols-2">
        <Demo title="Controlado" description="O estado fica com você (abrir por outro botão, salvar a preferência)." code={`<Collapsible label="Ver 4 itens ocultos" open={open} onOpenChange={setOpen}>…</Collapsible>`}>
          <div className="space-y-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
              {open ? "Esconder" : "Mostrar"} por fora
            </Button>
            <Collapsible label="Ver 4 negócios arquivados" meta="R$ 180 mil" open={open} onOpenChange={setOpen}>
              <ul className="m-0 list-disc space-y-1 pl-5 text-[13px] text-ink-soft">
                <li>Loja Ponto Sul · R$ 42 mil</li>
                <li>Hotel Mirante · R$ 38 mil</li>
                <li>Escola Futuro · R$ 55 mil</li>
                <li>Transportes Rota · R$ 45 mil</li>
              </ul>
            </Collapsible>
          </div>
        </Demo>
        <Demo title="Painel de configurações" description="`variant=&quot;card&quot;` com descrição, contagem e ação." code={`<Collapsible variant="card" label="Automações" description="Regras que rodam sozinhas" meta="3 ativas" actions={<IconButton …/>}>…</Collapsible>`}>
          <Collapsible
            variant="card"
            icon={<Workflow />}
            label="Automações do pipeline"
            description="Regras que rodam quando um negócio muda de etapa"
            meta="2 ativas"
            defaultOpen
            actions={
              <IconButton label="Nova automação" size="sm" onClick={n("Nova automação")}>
                <Plus />
              </IconButton>
            }
          >
            <div className="space-y-3">
              <Switch label="Criar tarefa de follow-up ao entrar em Proposta" checked={vals.auto} onCheckedChange={(v) => setVals({ ...vals, auto: v })} />
              <Switch label="Resumo diário por e-mail para o gestor" checked={vals.digest} onCheckedChange={(v) => setVals({ ...vals, digest: v })} />
              <Switch label="Alertar quando passar do SLA da etapa" checked={vals.sla} onCheckedChange={(v) => setVals({ ...vals, sla: v })} />
            </div>
          </Collapsible>
        </Demo>
        <Demo title="Linhas" description="`variant=&quot;row&quot;` em listas de seções." code={`<Collapsible variant="row" label="Faturamento" description="CNPJ, endereço, e-mail da nota">…</Collapsible>`}>
          <div>
            <Collapsible variant="row" label="Faturamento" description="CNPJ, endereço e e-mail da nota fiscal">
              CNPJ 12.345.678/0001-90 · financeiro@acme.com.br
            </Collapsible>
            <Collapsible variant="row" label="Contato principal" description="Quem recebe propostas e contratos">
              Ana Lopes · ana@acme.com.br · (11) 98765-4321
            </Collapsible>
            <Collapsible variant="row" label="Integrações" description="ERP e assinatura eletrônica" disabled>
              —
            </Collapsible>
          </div>
        </Demo>
        <Demo title="Árvore de arquivos" description="Collapsible aninhado com gatilho próprio. Para teclado de árvore completo, TreeView." code={`<CollapsibleRoot>\n  <CollapsibleTrigger><Folder /> propostas</CollapsibleTrigger>\n  <CollapsibleContent>…</CollapsibleContent>\n</CollapsibleRoot>`}>
          <div className="rounded-xl border border-line bg-surface p-2">
            {files.map((f) => (
              <FileNode key={f.name} node={f} />
            ))}
          </div>
        </Demo>
      </div>
    </DocSection>
  );
}

/* --------------------------- NavigationMenu --------------------------- */

export function NavigationMenuShadcnExamples() {
  return (
    <DocSection id="exemplos-shadcn" title="NavigationMenu: ícones, indicador e celular" rule="`icon` nos itens, `indicator` aponta o painel para o item aberto e, abaixo de 768 px, `mobile=&quot;menu&quot;` (padrão) troca a barra por um botão Menu com todos os links. `navigationMenuTriggerClass` dá o mesmo visual a um link solto.">
      <Demo
        code={`<NavigationMenu label="Navegação do portal" indicator items={[
  { label: "Produto", icon: <BarChart3 />, links: […] },
  { label: "Recursos", icon: <BookOpen />, links: […] },
  { label: "Preços", href: "/precos", icon: <CreditCard /> },
]} />
<a className={navigationMenuTriggerClass} href="/contato">Contato</a>`}
      >
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-line bg-surface px-2 py-1.5">
          <NavigationMenu
            label="Navegação do portal"
            indicator
            items={[
              {
                label: "Produto",
                icon: <BarChart3 />,
                links: [
                  { title: "Painéis", href: "#/p/nav-menus-de-site", description: "Indicadores do time em tempo real", icon: <BarChart3 /> },
                  { title: "Automações", href: "#/p/nav-menus-de-site", description: "Regras que rodam sozinhas", icon: <Workflow /> },
                ],
              },
              {
                label: "Recursos",
                icon: <BookOpen />,
                links: [
                  { title: "Central de ajuda", href: "#/p/nav-menus-de-site", description: "Guias passo a passo", icon: <LifeBuoy /> },
                  { title: "Status", href: "#/p/nav-menus-de-site", description: "Disponibilidade do serviço", icon: <CircleDot /> },
                ],
              },
              { label: "Preços", href: "#/p/nav-menus-de-site", icon: <CreditCard /> },
            ]}
          />
          <a className={navigationMenuTriggerClass} href="#/p/nav-menus-de-site">
            Contato
          </a>
        </div>
      </Demo>
    </DocSection>
  );
}

import { Clock, Download, Folder, FolderOpen, LayoutGrid, List, Link2, Share2, Star, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ActionMenu,
  Avatar,
  Button,
  DataTable,
  Empty,
  FileCard,
  FileIcon,
  Meter,
  PropertyList,
  SearchInput,
  SegmentedControl,
  Sheet,
  Skeleton,
  TreeView,
  formatBytes,
  cn,
  normalize,
  notify,
  type Column,
  type TreeNode } from "@g4ai/ds";
import { me } from "./data/workspace";
import { AtlasShell, atlasRoutes } from "./shells/atlas-shell";
import { saveSample } from "./shells/download";
import { setFrameQuery, useFrameParam, useFrameQuery } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Gerenciador de arquivos",
  description: "Pastas em árvore, arquivos em grade ou lista, busca, envio com progresso e prévia em sheet com detalhes e ações.",
  category: "Aplicação",
  order: 5,
  height: 860,
  concept: {
    goal: "Organizar, achar e prever arquivos do time em pastas, com envio e detalhes sem trocar de tela.",
    patterns: [
      "Anatomia G · App de altura total: árvore de pastas à esquerda, conteúdo rola",
      "Grade ou lista (SegmentedControl), busca, envio com progresso",
      "Prévia em Sheet com detalhes e ações",
    ],
    adapt: [
      "Documentos de cliente no CRM, currículos no ATS, notas e XMLs no ERP",
    ],
    avoid: [
      "Abrir arquivo em nova página para só ver detalhes",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Item = { id: string; name: string; size: number; folder: string; owner: string; initials: string; updated: string; preview?: string };

// ds-audit-ignore-start hex-color: miniaturas de exemplo são imagens (conteúdo), não interface
const thumb = (a: string, b: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><circle cx="290" cy="110" r="70" fill="#b9915b" opacity=".6"/></svg>`)}`;
// ds-audit-ignore-end

const folders: TreeNode[] = [
  { id: "comercial", label: "Comercial", icon: <Folder />, children: [{ id: "propostas", label: "Propostas", icon: <Folder /> }, { id: "contratos", label: "Contratos", icon: <Folder /> }] },
  { id: "financeiro", label: "Financeiro", icon: <Folder />, children: [{ id: "notas", label: "Notas fiscais", icon: <Folder /> }, { id: "extratos", label: "Extratos", icon: <Folder /> }] },
  { id: "marketing", label: "Marketing", icon: <Folder /> },
  { id: "rh", label: "Pessoas", icon: <Folder /> },
];

const seedFiles: Item[] = [
  { id: "1", name: "proposta-acme-logistica.pdf", size: 482_000, folder: "propostas", owner: "Carla Nogueira", initials: "CN", updated: "ontem" },
  { id: "2", name: "proposta-vertice-saude-v3.docx", size: 96_000, folder: "propostas", owner: "Joana Ribeiro", initials: "JR", updated: "há 2 dias" },
  { id: "3", name: "apresentacao-comercial-2026.pptx", size: 8_200_000, folder: "propostas", owner: "Bruno Takeda", initials: "BT", updated: "12/09" },
  { id: "4", name: "tabela-precos-q4.xlsx", size: 214_000, folder: "propostas", owner: "Joana Ribeiro", initials: "JR", updated: "hoje" },
  { id: "5", name: "contrato-acme-assinado.pdf", size: 1_240_000, folder: "contratos", owner: "Elisa Monteiro", initials: "EM", updated: "03/09" },
  { id: "6", name: "fachada-cliente-horizonte.jpg", size: 1_350_000, folder: "propostas", owner: "Diego Araújo", initials: "DA", updated: "há 5 dias", preview: thumb("#031a26", "#184560") },
  { id: "7", name: "nf-1043-vertice.pdf", size: 88_000, folder: "notas", owner: "Sistema", initials: "SI", updated: "hoje" },
  { id: "8", name: "extrato-setembro.csv", size: 42_000, folder: "extratos", owner: "Sistema", initials: "SI", updated: "01/10" },
  { id: "9", name: "campanha-outubro.zip", size: 34_000_000, folder: "marketing", owner: "Ana Lopes", initials: "AL", updated: "há 1 semana" },
  { id: "10", name: "evento-clientes.mp4", size: 128_000_000, folder: "marketing", owner: "Ana Lopes", initials: "AL", updated: "20/09", preview: thumb("#842e20", "#b9915b") },
  { id: "11", name: "politica-home-office.pdf", size: 310_000, folder: "rh", owner: "Rafael Queiroz", initials: "RQ", updated: "02/08" },
];
const label = (id: string): string => {
  const walk = (ns: TreeNode[]): string | undefined => {
    for (const n of ns) {
      if (n.id === id) return n.label;
      const c = n.children && walk(n.children);
      if (c) return c;
    }
  };
  return walk(folders) ?? id;
};
const descendants = (id: string): string[] => {
  const find = (ns: TreeNode[]): TreeNode | undefined => ns.find((n) => n.id === id) ?? ns.map((n) => n.children && find(n.children)).find(Boolean);
  const node = find(folders);
  const out: string[] = [id];
  const add = (n?: TreeNode) => n?.children?.forEach((c) => { out.push(c.id); add(c); });
  add(node);
  return out;
};

/* ------------------------------------------------------------------ */

const copyLink = (f: Item) => {
  const url = `${location.origin}${location.pathname}#/frame/app-file-manager?id=${f.id}`;
  void navigator.clipboard?.writeText(url).catch(() => undefined);
  notify("Link copiado");
};

export default function FileManagerBlock() {
  // ?estado=carregando|vazio|erro simula os estados da lista.
  const estado = useFrameParam("estado");
  const [files, setFiles] = useState<Item[]>(() => (estado === "vazio" ? [] : seedFiles));
  const [folder, setFolder] = useState("comercial");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  // Detalhe aberto vem da URL (?id=5): notificações e a paleta linkam direto para um arquivo.
  const query = useFrameQuery();
  const open = files.find((f) => f.id === query.get("id")) ?? null;
  const setOpen = (f: Item | null) => setFrameQuery({ id: f?.id });
  const [shortcut, setShortcut] = useState<"recentes" | "favoritos" | "compartilhados" | null>(null);
  const [favorites, setFavorites] = useState<string[]>(["3", "5"]);
  const [uploads, setUploads] = useState<{ id: string; name: string; progress: number }[]>([]);

  const shown = useMemo(() => {
    if (q) return files.filter((f) => normalize(f.name).includes(normalize(q)));
    if (shortcut === "recentes") return files.filter((f) => /hoje|ontem|há/.test(f.updated));
    if (shortcut === "favoritos") return files.filter((f) => favorites.includes(f.id));
    if (shortcut === "compartilhados") return files.filter((f) => f.owner !== me.name && f.owner !== "Sistema");
    const scope = descendants(folder);
    return files.filter((f) => scope.includes(f.folder));
  }, [files, folder, q, shortcut, favorites]);

  const remove = (f: Item) => {
    const at = files.findIndex((x) => x.id === f.id);
    setFiles((xs) => xs.filter((x) => x.id !== f.id));
    if (open?.id === f.id) setOpen(null);
    notify(`${f.name} movido para a lixeira`, () => setFiles((xs) => (xs.some((x) => x.id === f.id) ? xs : [...xs.slice(0, at), f, ...xs.slice(at)])));
  };
  const clearFilters = () => {
    setQ("");
    setShortcut(null);
  };

  const upload = () => {
    const id = String(Date.now());
    setUploads((u) => [...u, { id, name: "relatorio-comissoes-set.xlsx", progress: 0 }]);
    let p = 0;
    const t = setInterval(() => {
      p += 17;
      setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: Math.min(100, p) } : x)));
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => setUploads((u) => u.filter((x) => x.id !== id)), 400);
        const target = shortcut || q ? "comercial" : folder;
        setFiles((xs) => [{ id, name: "relatorio-comissoes-set.xlsx", size: 186_000, folder: target, owner: me.name, initials: me.initials, updated: "agora" }, ...xs]);
        notify(`relatorio-comissoes-set.xlsx enviado para ${label(target)}`);
      }
    }, 350);
  };

  // Arquivo de exemplo gerado no navegador (no app real, a URL assinada do storage).
  const download = (f: Item) => {
    const saved = saveSample(f.name, [f.name, `Pasta: ${label(f.folder)}`, `Dono: ${f.owner}`, `Atualizado: ${f.updated}`, `Tamanho original: ${formatBytes(f.size)}`]);
    notify(`${saved} baixado`);
  };

  const menu = (f: Item) => (
    <ActionMenu
      actions={[
        { label: "Abrir detalhes", onSelect: () => setOpen(f) },
        { label: "Baixar", icon: <Download />, onSelect: () => download(f) },
        { label: "Copiar link", icon: <Link2 />, onSelect: () => copyLink(f) },
        { label: favorites.includes(f.id) ? "Remover dos favoritos" : "Favoritar", icon: <Star />, onSelect: () => setFavorites((fs) => (fs.includes(f.id) ? fs.filter((x) => x !== f.id) : [...fs, f.id])) },
        { label: "Excluir", icon: <Trash2 />, tone: "danger", separator: true, onSelect: () => remove(f) },
      ]}
    />
  );

  const cols: Column<Item>[] = [
    { key: "nome", header: "Nome", primary: true, cell: (f) => <span className="flex min-w-0 items-center gap-2.5"><FileIcon name={f.name} size="sm" /><span className="truncate">{f.name}</span></span> },
    { key: "dono", header: "Dono", cell: (f) => <span className="inline-flex items-center gap-2"><Avatar initials={f.initials} size="sm" name={f.owner} />{f.owner.split(" ")[0]}</span>, mobileHidden: true },
    { key: "pasta", header: "Pasta", cell: (f) => label(f.folder), mobileHidden: true },
    { key: "tam", header: "Tamanho", cell: (f) => formatBytes(f.size), align: "right", nowrap: true },
    { key: "data", header: "Alterado", cell: (f) => f.updated, nowrap: true },
    { key: "acoes", header: "", cell: (f) => menu(f), action: true },
  ];

  return (
    <AtlasShell current={atlasRoutes.files}>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[240px] shrink-0 flex-col border-r border-line bg-rail/60 lg:flex">
          <div className="p-3">
            <Button className="w-full" size="sm" onClick={upload}>
              <Upload /> Enviar arquivo
            </Button>
          </div>
          <nav aria-label="Atalhos" className="px-3 pb-2 text-[12.5px]">
            {(
              [
                ["recentes", Clock, "Recentes"],
                ["favoritos", Star, "Favoritos"],
                ["compartilhados", Share2, "Compartilhados comigo"],
              ] as const
            ).map(([id, Icon, l]) => (
              <button
                key={id}
                type="button"
                aria-pressed={shortcut === id}
                onClick={() => { setShortcut(id); setQ(""); }}
                className={cn("flex h-8 w-full items-center gap-2 rounded-lg px-2 hover:bg-soft hover:text-ink", shortcut === id ? "bg-soft font-medium text-ink" : "text-ink-soft")}
              >
                <Icon className="h-4 w-4 text-muted" /> {l}
              </button>
            ))}
          </nav>
          <p className="m-0 px-5 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[0.1em] text-muted">Pastas</p>
          <div className="min-h-0 flex-1 overflow-y-auto px-3">
            <TreeView label="Pastas" nodes={folders} selected={folder} onSelect={(n) => { setFolder(n.id); setQ(""); setShortcut(null); }} defaultExpanded={["comercial", "financeiro"]} />
          </div>
          <div className="border-t border-line p-4">
            <div className="mb-2 flex justify-between text-[12px]">
              <span className="text-muted">Armazenamento</span>
              <span className="tabular-nums">18,4 de 50 GB</span>
            </div>
            <Meter value={37} thick label="Armazenamento usado" />
          </div>
        </aside>

        <div className="page-inset min-w-0 flex-1 overflow-y-auto" data-ds-content="">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[12px] text-muted">Arquivos</p>
              <h1 className="m-0 flex items-center gap-2 text-[22px] font-semibold tracking-[-0.03em]">
                <FolderOpen className="h-5 w-5 text-muted" />
                {q ? "Resultados da busca" : shortcut === "recentes" ? "Recentes" : shortcut === "favoritos" ? "Favoritos" : shortcut === "compartilhados" ? "Compartilhados comigo" : label(folder)}
              </h1>
            </div>
            <Button size="sm" className="lg:hidden" onClick={upload}>
              <Upload /> Enviar
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <SearchInput value={q} onChange={setQ} placeholder="Buscar em todos os arquivos…" className="min-w-[220px] flex-1" />
            <SegmentedControl
              label="Visualização"
              value={view}
              onChange={setView}
              options={[
                { value: "grid", label: "Grade", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
                { value: "list", label: "Lista", icon: <List className="h-3.5 w-3.5" /> },
              ]}
            />
            <span className="ml-auto text-[12px] tabular-nums text-muted" aria-live="polite">
              {shown.length} {shown.length === 1 ? "arquivo" : "arquivos"}
            </span>
          </div>

          {uploads.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {uploads.map((u) => (
                <FileCard key={u.id} name={u.name} progress={u.progress} />
              ))}
            </div>
          )}

          <div className="mt-4">
            {estado === "carregando" ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" aria-busy aria-label="Carregando arquivos">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="rounded-xl border border-line bg-surface p-3">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="mt-3 h-4 w-3/4" />
                    <Skeleton className="mt-2 h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : estado === "erro" ? (
              <Empty title="Não foi possível carregar os arquivos" hint="O armazenamento não respondeu. Seus arquivos continuam salvos." action={<Button size="sm" onClick={() => setFrameQuery({ estado: undefined })}>Tentar novamente</Button>} />
            ) : files.length === 0 ? (
              <Empty icon={<FolderOpen />} title="Nenhum arquivo no workspace" hint="Envie propostas, contratos e planilhas para o time encontrar tudo num lugar só." action={<Button size="sm" onClick={upload}><Upload /> Enviar arquivo</Button>} />
            ) : shown.length === 0 ? (
              q || shortcut ? (
                <Empty
                  title={q ? `Nada encontrado para “${q}”` : shortcut === "favoritos" ? "Nenhum favorito ainda" : "Nada por aqui"}
                  hint={q ? "Tente outro nome ou parte dele." : "Volte para as pastas para ver todos os arquivos."}
                  action={<Button size="sm" variant="ghost" onClick={clearFilters}>Limpar busca</Button>}
                />
              ) : (
                <Empty title="Pasta vazia" hint="Arraste arquivos para cá ou use Enviar arquivo." action={<Button size="sm" variant="ghost" onClick={upload}><Upload /> Enviar arquivo</Button>} />
              )
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {shown.map((f) => (
                  <FileCard key={f.id} variant="tile" name={f.name} size={f.size} meta={f.updated} preview={f.preview} onOpen={() => setOpen(f)} selected={open?.id === f.id} actions={menu(f)} />
                ))}
              </div>
            ) : (
              <DataTable rows={shown} columns={cols} rowKey={(f) => f.id} onRowClick={setOpen} rowLabel={(f) => `Abrir ${f.name}`} />
            )}
          </div>
        </div>
      </div>

      <Sheet
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.name ?? ""}
        description={open ? `${label(open.folder)} · ${formatBytes(open.size)}` : undefined}
        footer={
          <>
            <Button size="sm" variant="ghost" onClick={() => open && copyLink(open)}>
              <Link2 /> Copiar link
            </Button>
            <Button size="sm" onClick={() => open && download(open)}>
              <Download /> Baixar
            </Button>
          </>
        }
      >
        {open && (
          <>
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-line bg-soft/60">
              {open.preview ? <img src={open.preview} alt={`Prévia de ${open.name}`} className="h-full w-full object-cover" /> : <FileIcon name={open.name} size="lg" />}
            </div>
            <PropertyList
              className="mt-5"
              items={[
                { label: "Dono", value: <span className="inline-flex items-center gap-2"><Avatar initials={open.initials} size="sm" name={open.owner} />{open.owner}</span> },
                { label: "Pasta", value: label(open.folder) },
                { label: "Tamanho", value: formatBytes(open.size) },
                { label: "Alterado", value: open.updated },
                { label: "Compartilhado com", value: "Time Comercial (8)" },
                { label: "Descrição" },
              ]}
            />
          </>
        )}
      </Sheet>
    </AtlasShell>
  );
}

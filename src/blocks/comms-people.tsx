import { Copy, LayoutGrid, List, MessageSquare, Network } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  Drawer,
  Empty,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  LocationTag,
  Page,
  PageHeading,
  PageToolbar,
  PropertyList,
  SegmentedControl,
  StackedList,
  TableSearch,
  TreeView,
  formatDate,
  formatNumber,
  notify,
  plural,
  useFilters,
  type Column,
  type FilterField,
  type TreeNode,
} from "@g4ai/ds";
import { areaLabel, areas, cities, cityById, firstName, me, now, org, people, personById, type Person, type Presence } from "./data/comms";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { CommsShell, LoadError, LoadingShape, useListState } from "./shells/comms-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Mural · pessoas",
  description: "Diretório de pessoas: busca, filtros por área, cidade e presença, cards com cidade e hora local, lista, organograma, “Online agora” e perfil em gaveta com contato, gestão, equipe e habilidades.",
  category: "Comunicação",
  order: 5,
  height: 1100,
  concept: {
    goal: "Achar quem pode ajudar, saber onde a pessoa está e se é uma boa hora para chamar.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (filtros e busca); cards, lista ou organograma",
      "LocationTag com hora local: time em 4 fusos (Manaus, Cuiabá, Recife/São Paulo, Lisboa)",
      "StackedList “Online agora” com o diretório completo no mesmo cartão",
      "Perfil em Drawer pela URL (?pessoa=): não perde a lista; gestão e equipe navegam dentro da gaveta",
      "Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar",
    ],
    adapt: [
      "Diretório de franqueados, de fornecedores, de alunos e professores",
    ],
    avoid: [
      "Mostrar presença só com cor (sempre com palavra: Online, Em reunião, Visto há…)",
      "Abrir o perfil em página nova e perder o filtro",
    ],
  },
} as const;

const presenceLabel: Record<Presence, string> = { online: "Online", away: "Ausente", busy: "Ocupado", offline: "Offline" };
const presenceTone = { online: "ok", away: "warn", busy: "bad", offline: "neutral" } as const;
const presenceText = (p: Person) => p.presence ?? presenceLabel[p.status];

const fields: FilterField<Person>[] = [
  { key: "area", label: "Área", type: "enum", quick: true, accessor: (p) => p.area, options: areas.map((a) => ({ value: a.id, label: a.label })) },
  { key: "city", label: "Cidade", type: "enum", quick: true, accessor: (p) => p.city, options: cities.map((c) => ({ value: c.id, label: c.label })) },
  { key: "status", label: "Presença", type: "enum", accessor: (p) => p.status, options: (Object.keys(presenceLabel) as Presence[]).map((s) => ({ value: s, label: presenceLabel[s] })) },
  { key: "since", label: "Na empresa desde", type: "date", accessor: (p) => p.since },
];

function orgTree(): TreeNode[] {
  const node = (p: Person): TreeNode => {
    const reports = people.filter((x) => x.managerId === p.id);
    return { id: p.id, label: p.name, meta: <span className="text-[11.5px] text-muted">{p.role}</span>, children: reports.length ? reports.map(node) : undefined };
  };
  return people.filter((p) => !p.managerId).map(node);
}

function PersonCard({ p, q, onOpen }: { p: Person; q: string; onOpen: () => void }) {
  const city = cityById(p.city);
  return (
    <li className="flex flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong">
      <button type="button" onClick={onOpen} className="-m-1 flex items-center gap-3 rounded-lg p-1 text-left hover:bg-soft">
        <Avatar initials={p.initials} tint={p.tint} name={p.name} size="lg" status={p.status} />
        <span className="min-w-0 leading-tight">
          <Highlight text={p.name} query={q} className="block truncate text-[14px] font-semibold" />
          <Highlight text={p.role} query={q} className="mt-0.5 block truncate text-[12.5px] text-ink-soft" />
          <span className="mt-0.5 block truncate text-[12px] text-muted">{areaLabel(p.area)}</span>
        </span>
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <LocationTag place={city.place} timeZone={city.timeZone} />
      </div>
      <p className="m-0 mt-2 flex items-center gap-1.5 text-[12px] text-muted">
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${p.status === "online" ? "bg-ok" : p.status === "busy" ? "bg-rose" : p.status === "away" ? "bg-amber" : "bg-line-strong"}`} />
        {presenceText(p)}
      </p>
      <div className="mt-auto flex gap-2 pt-3">
        {p.id === me.id ? (
          <Badge>Você</Badge>
        ) : (
          <Button size="sm" variant="ghost" href={frameHref("comms-channels", { canal: `dm-${p.id}` })}>
            <MessageSquare /> Mensagem
          </Button>
        )}
      </div>
    </li>
  );
}

export default function CommsPeople() {
  const estado = useListState();
  const pessoa = useFrameParam("pessoa");
  const [view, setView] = useState<"cards" | "lista" | "organograma">("cards");
  const filters = useFilters(people, { fields, search: (p) => [p.name, p.role, p.email, areaLabel(p.area), cityById(p.city).label, ...p.skills], url: "p_", now });
  const q = filters.state.query;
  const open = (id: string) => setFrameQuery({ pessoa: id });
  const selected = pessoa ? personById(pessoa) : null;
  const tree = useMemo(orgTree, []);

  const columns: Column<Person>[] = [
    {
      key: "name",
      header: "Pessoa",
      primary: true,
      cell: (p) => (
        <span className="flex items-center gap-2.5">
          <Avatar initials={p.initials} tint={p.tint} name={p.name} size="sm" status={p.status} />
          <span className="min-w-0 leading-tight">
            <Highlight text={p.name} query={q} className="block truncate font-medium" />
            <Highlight text={p.role} query={q} className="block truncate text-[12px] text-muted" />
          </span>
        </span>
      ),
    },
    { key: "area", header: "Área", cell: (p) => areaLabel(p.area) },
    { key: "city", header: "Cidade e hora local", cell: (p) => <LocationTag place={cityById(p.city).place} timeZone={cityById(p.city).timeZone} /> },
    { key: "status", header: "Presença", nowrap: true, cell: (p) => <Badge tone={presenceTone[p.status]}>{presenceText(p)}</Badge> },
    { key: "phone", header: "Telefone", nowrap: true, mobileHidden: true, cell: (p) => <span className="tabular-nums text-ink-soft">{p.phone}</span> },
  ];

  const body =
    estado === "carregando" ? (
      <LoadingShape variant={view === "lista" ? "rows" : "cards"} rows={view === "lista" ? 8 : 6} label="Carregando pessoas" />
    ) : estado === "erro" ? (
      <LoadError what="o diretório de pessoas" />
    ) : estado === "vazio" ? (
      <Empty title="O diretório ainda está vazio" hint="As pessoas aparecem aqui assim que a integração com o sistema de RH sincronizar. Isso leva até uma hora." action={<Button variant="ghost" href={frameHref("comms-home")}>Voltar ao início</Button>} />
    ) : view === "organograma" ? (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-xl border border-line bg-surface p-3">
          <TreeView label="Organograma" nodes={tree} selected={pessoa ?? undefined} onSelect={(n) => open(n.id)} defaultExpanded={["otavio", "rodrigo", "beatriz", "felipe"]} />
        </div>
        <p className="m-0 text-[12.5px] text-muted">Use ↑ ↓ para navegar, → para abrir uma equipe e Enter para ver o perfil. Mostrando lideranças e uma amostra das equipes.</p>
      </div>
    ) : !filters.rows.length ? (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyFilterResult filters={filters} noun="pessoa" gender="f" />
      </div>
    ) : view === "lista" ? (
      <DataTable label="Pessoas" rows={filters.rows} columns={columns} rowKey={(p) => p.id} rowLabel={(p) => p.name} onRowClick={(p) => open(p.id)} rowSelected={(p) => p.id === pessoa} />
    ) : (
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 2xl:grid-cols-3">
        {filters.rows.map((p) => (
          <PersonCard key={p.id} p={p} q={q} onOpen={() => open(p.id)} />
        ))}
      </ul>
    );

  const reports = selected ? people.filter((x) => x.managerId === selected.id) : [];
  const manager = selected?.managerId ? personById(selected.managerId) : null;
  const years = selected ? now.getFullYear() - Number(selected.since.slice(0, 4)) : 0;

  return (
    <CommsShell section="pessoas">
      <Page>
        <PageHeading
          title="Pessoas"
          description={`${formatNumber(org.headcount)} pessoas em ${cities.length} cidades. Veja quem faz o quê, onde está e se é uma boa hora para chamar.`}
          actions={
            <SegmentedControl
              label="Visualização"
              value={view}
              onChange={setView}
              options={[
                { value: "cards", label: "Cards", icon: <LayoutGrid /> },
                { value: "lista", label: "Lista", icon: <List /> },
                { value: "organograma", label: "Organograma", icon: <Network /> },
              ]}
            />
          }
        />
        {view !== "organograma" && estado !== "vazio" && (
          <PageToolbar>
            <FilterBar filters={filters} noun="pessoa" search={<TableSearch value={q} onChange={filters.setQuery} total={filters.total} noun="pessoa" searchIn="nome, cargo, área, cidade e habilidades" />} />
          </PageToolbar>
        )}
        <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">{body}</div>
          <aside className="min-w-0 space-y-4" aria-label="Presença">
            <StackedList
              title="Online agora"
              items={people.map((p) => ({ id: p.id, name: p.name, initials: p.initials, tint: p.tint, status: p.status, description: `${p.role} · ${cityById(p.city).label}`, keywords: `${p.email} ${areaLabel(p.area)}`, onClick: () => open(p.id) }))}
              directoryLabel="Todas as pessoas"
              directoryHint={plural(people.length, "pessoa")}
              height={480}
            />
            <section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="fusos">
              <h2 id="fusos" className="m-0 text-[13px] font-medium">
                Agora em cada unidade
              </h2>
              <ul className="m-0 mt-3 list-none space-y-2 p-0">
                {cities.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <LocationTag place={c.place} timeZone={c.timeZone} />
                    <span className="text-[12px] tabular-nums text-muted">{plural(c.headcount, "pessoa")}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </Page>

      <Drawer
        open={!!selected}
        onClose={() => setFrameQuery({ pessoa: undefined })}
        title={selected?.name ?? "Pessoa"}
        kicker={selected ? areaLabel(selected.area) : undefined}
        footer={
          selected && (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard?.writeText(selected.email);
                  notify("E-mail copiado", undefined, "info");
                }}
              >
                <Copy /> Copiar e-mail
              </Button>
              <Button onClick={() => go("comms-channels", { canal: `dm-${selected.id}` })} disabled={selected.id === me.id} disabledReason="É você.">
                <MessageSquare /> Enviar mensagem
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar initials={selected.initials} tint={selected.tint} name={selected.name} size="xl" status={selected.status} />
              <div className="min-w-0 leading-tight">
                <p className="m-0 text-[15px] font-semibold">{selected.role}</p>
                {selected.pronouns && <p className="m-0 mt-0.5 text-[12.5px] text-muted">{selected.pronouns}</p>}
                <p className="m-0 mt-2">
                  <Badge tone={presenceTone[selected.status]}>{presenceText(selected)}</Badge>
                </p>
              </div>
            </div>
            <LocationTag place={cityById(selected.city).place} timeZone={cityById(selected.city).timeZone} />
            {selected.bio && <p className="m-0 text-[13.5px] leading-relaxed text-ink-soft">{selected.bio}</p>}
            <PropertyList
              items={[
                { label: "Unidade", value: cityById(selected.city).site },
                { label: "E-mail", value: selected.email },
                { label: "Telefone", value: <span className="tabular-nums">{selected.phone}</span> },
                {
                  label: "Gestão",
                  value: manager ? (
                    <button type="button" onClick={() => open(manager.id)} className="underline-offset-2 hover:underline">
                      {manager.name}
                    </button>
                  ) : (
                    "—"
                  ),
                },
                { label: "Na Vértice desde", value: formatDate(selected.since), hint: years > 0 ? plural(years, "ano") : "Chegou este ano" },
                { label: "Aniversário", value: `${selected.birthday.slice(3)}/${selected.birthday.slice(0, 2)}` },
              ]}
            />
            <section>
              <h3 className="m-0 text-[12.5px] font-medium text-muted">Pode ajudar com</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selected.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </section>
            {reports.length > 0 && (
              <section>
                <h3 className="m-0 text-[12.5px] font-medium text-muted">Equipe direta · {reports.length}</h3>
                <ul className="m-0 mt-2 list-none space-y-1 p-0">
                  {reports.map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => open(r.id)} className="-mx-1 flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left hover:bg-soft">
                        <Avatar initials={r.initials} tint={r.tint} name={r.name} size="sm" status={r.status} />
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block truncate text-[13px] font-medium">{r.name}</span>
                          <span className="block truncate text-[12px] text-muted">
                            {r.role} · {cityById(r.city).label}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {selected.id !== me.id && <p className="m-0 text-[12px] text-muted">Dica: {firstName(selected)} está em {cityById(selected.city).label}. Confira a hora local antes de ligar.</p>}
          </div>
        )}
      </Drawer>
    </CommsShell>
  );
}

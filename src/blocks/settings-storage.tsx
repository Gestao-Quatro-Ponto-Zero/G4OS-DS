import { Archive, ExternalLink, FileText, History, Image, Paperclip, Trash2, Video } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  ActionMenu,
  BarList,
  Button,
  CapacityBreakdown,
  Empty,
  ErrorState,
  FileCard,
  Select,
  Skeleton,
  formatStorage,
  notify,
  type CapacitySegment,
  type CapacitySuggestion,
} from "@g4ai/ds";
import { org } from "./data/workspace";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Armazenamento",
  description: "Uso da cota de 1 TB do workspace por categoria, com varredura ao abrir, barra segmentada ligada à legenda, recomendações de limpeza uma por vez (com confirmação quando é irreversível), maiores arquivos e uso por equipe.",
  category: "Configurações",
  order: 7.7,
  height: 1180,
  concept: {
    goal: "Mostrar o que ocupa a cota e liberar espaço com segurança, sem o administrador ter de caçar arquivo por arquivo.",
    patterns: [
      "Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)",
      "CapacityBreakdown: total, linha de status, barra segmentada e legenda ligadas pelo mesmo realce",
      "Uma recomendação por vez, com o tamanho na frase e verbo + objeto no botão; a próxima aparece quando a anterior termina",
      "Irreversível (versões antigas, lixeira) passa por ConfirmDialog; reversível (arquivo frio) vai direto e o toast oferece Desfazer",
      "Maiores arquivos com filtro por equipe e uso por equipe em BarList, para achar quem cuidar",
    ],
    adapt: ["Cota de e-mails ou de envio (SaaS)", "Assentos por plano (Configurações › Plano)", "Espaço do portal do cliente"],
    avoid: ["Mais de 6 categorias com cor (agrupe em Outros)", "Usar a barra para série temporal", "Apagar sem dizer quanto e o quê"],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo (troque pela sua API)                              */
/* ------------------------------------------------------------------ */

const GB = 1e9;
const QUOTA = 1e12;

type CategoryId = "docs" | "gravacoes" | "anexos" | "midia" | "versoes" | "lixeira";

const initialSizes: Record<CategoryId, number> = {
  docs: 182.4 * GB,
  gravacoes: 236.9 * GB,
  anexos: 96.3 * GB,
  midia: 121.7 * GB,
  versoes: 74.8 * GB,
  lixeira: 41.2 * GB,
};

const categories: { id: CategoryId; label: string; icon: ReactNode; description: string }[] = [
  { id: "gravacoes", label: "Gravações de reunião", icon: <Video />, description: "1.126 reuniões gravadas; 412 têm mais de 6 meses." },
  { id: "docs", label: "Documentos", icon: <FileText />, description: "18.402 textos, planilhas e PDFs no Drive das equipes." },
  { id: "midia", label: "Imagens e mídia", icon: <Image />, description: "Fotos de campo, peças de marketing e vídeos de treinamento." },
  { id: "anexos", label: "Anexos de e-mail", icon: <Paperclip />, description: "Anexos guardados das caixas compartilhadas (comercial@, financeiro@)." },
  { id: "versoes", label: "Versões antigas", icon: <History />, description: "Histórico de edições. As versões com mais de 90 dias somam 61,5 GB." },
  { id: "lixeira", label: "Lixeira", icon: <Trash2 />, description: "Arquivos excluídos nos últimos 30 dias. Depois disso, somem sozinhos." },
];

const scanPaths = [
  "Drive › Comercial › Propostas 2026",
  "Drive › Financeiro › Notas fiscais › 2025",
  "Reuniões › Gravações › Setembro",
  "E-mail › comercial@ › Anexos",
  "Drive › Marketing › Campanha de fim de ano",
  "Drive › Operações › Fotos de campo",
  "Histórico › Versões › Contratos",
  "Lixeira › Excluídos por Diego Araújo",
];

type BigFile = { id: string; name: string; size: number; team: string; owner: string; where: string };
const bigFiles: BigFile[] = [
  { id: "f1", name: "Kickoff Distribuidora Andrade – gravação.mp4", size: 8.4 * GB, team: "Comercial", owner: "Ana Lopes", where: "Reuniões" },
  { id: "f2", name: "Treinamento de integração 2026.mp4", size: 6.9 * GB, team: "Pessoas", owner: "Juliana Rocha", where: "Drive › Pessoas" },
  { id: "f3", name: "Backup CRM 2025-12.zip", size: 5.2 * GB, team: "Operações", owner: "Bruno Takeda", where: "Drive › Operações" },
  { id: "f4", name: "Campanha fim de ano – brutos.zip", size: 4.7 * GB, team: "Marketing", owner: "Renata Farias", where: "Drive › Marketing" },
  { id: "f5", name: "Revisão trimestral Q3 – gravação.mp4", size: 3.8 * GB, team: "Diretoria", owner: "Joana Ribeiro", where: "Reuniões" },
  { id: "f6", name: "Fotos de campo – obra Recife.zip", size: 3.1 * GB, team: "Operações", owner: "Marcos Vieira", where: "Drive › Operações" },
  { id: "f7", name: "Notas fiscais 2025.zip", size: 2.6 * GB, team: "Financeiro", owner: "Carla Nogueira", where: "Drive › Financeiro" },
  { id: "f8", name: "Vídeo institucional 4K.mov", size: 2.4 * GB, team: "Marketing", owner: "Renata Farias", where: "Drive › Marketing" },
  { id: "f9", name: "Demo produto – cliente Polar.mp4", size: 1.9 * GB, team: "Comercial", owner: "Diego Araújo", where: "Reuniões" },
  { id: "f10", name: "Planilha de comissões 2019-2025.xlsx", size: 1.2 * GB, team: "Financeiro", owner: "Carla Nogueira", where: "Drive › Financeiro" },
];

const teamUsage = [
  { label: "Comercial", value: 241.6 * GB },
  { label: "Operações", value: 168.3 * GB },
  { label: "Marketing", value: 139.9 * GB },
  { label: "Financeiro", value: 92.4 * GB },
  { label: "Pessoas", value: 61.8 * GB },
  { label: "Diretoria", value: 49.3 * GB },
];

const teamOptions = [{ value: "todas", label: "Todas as equipes" }, ...["Comercial", "Diretoria", "Financeiro", "Jurídico", "Marketing", "Operações", "Pessoas"].map((t) => ({ value: t, label: t }))];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */

function Section({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="m-0 text-[15px] font-medium">{title}</h2>
          {description && <p className="m-0 text-[12.5px] leading-relaxed text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StorageSkeleton() {
  return (
    <div role="status" aria-label="Carregando o armazenamento" className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid gap-2 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-7" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function SettingsStorageBlock() {
  // ?estado=carregando|vazio|filtro|erro simula os cinco estados.
  const estado = useFrameParam("estado");
  const [sizes, setSizes] = useState(initialSizes);
  const [team, setTeam] = useState(estado === "filtro" ? "Jurídico" : "todas");

  const segments: CapacitySegment[] = categories.map((c) => ({ ...c, value: sizes[c.id] }));

  const shrink = (id: CategoryId, by: number) => setSizes((s) => ({ ...s, [id]: Math.max(0, s[id] - by) }));

  const suggestions: CapacitySuggestion[] = [
    {
      id: "versoes",
      category: "versoes",
      text: "Versões com mais de 90 dias ocupam 61,5 GB. A versão atual de cada arquivo fica.",
      actionLabel: "Apagar versões antigas",
      busyLabel: "Apagando versões…",
      destructive: true,
      confirm: {
        title: "Apagar 61,5 GB de versões antigas?",
        description: "Some o histórico com mais de 90 dias de 3.214 arquivos. A versão atual de cada um fica intacta. Não dá para desfazer.",
        confirmLabel: "Apagar versões",
      },
      onAction: async () => {
        await wait(1400);
        shrink("versoes", 61.5 * GB);
        return { freed: 61.5 * GB };
      },
    },
    {
      id: "lixeira",
      category: "lixeira",
      text: `A lixeira guarda ${formatStorage(sizes.lixeira)} de arquivos que a equipe já excluiu.`,
      actionLabel: "Esvaziar lixeira",
      busyLabel: "Esvaziando…",
      destructive: true,
      confirm: {
        title: "Esvaziar a lixeira?",
        description: "Os 2.087 arquivos excluídos nos últimos 30 dias somem de vez, para todas as equipes. Não dá para desfazer.",
        confirmLabel: "Esvaziar lixeira",
      },
      onAction: async () => {
        await wait(1200);
        const freed = sizes.lixeira;
        shrink("lixeira", freed);
        return { freed };
      },
    },
    {
      id: "arquivo-frio",
      category: "gravacoes",
      text: "Gravações com mais de 6 meses somam 148,2 GB. No arquivo frio continuam pesquisáveis e voltam em até 12 horas.",
      actionLabel: "Mover para arquivo frio",
      busyLabel: "Movendo…",
      doneMessage: "Gravações antigas movidas para o arquivo frio",
      undo: () => setSizes((s) => ({ ...s, gravacoes: s.gravacoes + 148.2 * GB })),
      onAction: async () => {
        await wait(1400);
        shrink("gravacoes", 148.2 * GB);
        return { freed: 148.2 * GB };
      },
    },
  ];

  const files = team === "todas" ? bigFiles : bigFiles.filter((f) => f.team === team);
  const clearFilter = () => {
    setTeam("todas");
    if (estado === "filtro") setFrameQuery({ estado: undefined });
  };

  let body: ReactNode;
  if (estado === "carregando") body = <StorageSkeleton />;
  else if (estado === "erro")
    body = (
      <div className="rounded-xl border border-line bg-surface">
        <ErrorState
          title="Não foi possível calcular o armazenamento"
          description="A varredura não respondeu. Nada foi apagado; tente de novo em instantes."
          onRetry={() => setFrameQuery({ estado: undefined })}
          details="GET /api/v1/storage/usage · 504 Gateway Timeout · req_9e21b7"
        />
      </div>
    );
  else if (estado === "vazio")
    body = (
      <Empty
        icon={<Archive />}
        title="Nada guardado ainda"
        hint={`O workspace da ${org.name} tem 1 TB. Quando a equipe enviar arquivos ou gravar reuniões, o uso aparece aqui por categoria.`}
        action={<Button variant="ghost" onClick={() => notify("Abrimos o Drive em outra aba", undefined, "info")}>Abrir o Drive</Button>}
      />
    );
  else
    body = (
      <div className="flex flex-col gap-10">
        <CapacityBreakdown
          label={`Armazenamento do workspace ${org.name}`}
          segments={segments}
          total={QUOTA}
          suggestions={suggestions}
          simulateScan={{ duration: 2800, paths: scanPaths }}
        />

        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:gap-8">
          <Section
            title="Maiores arquivos"
            description="Os 10 maiores do workspace. Mova para o arquivo frio o que ninguém abre há meses."
            action={<Select label="Equipe" hideLabel size="compact" options={teamOptions} value={team} onValueChange={setTeam} />}
          >
            {files.length ? (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {files.map((f) => (
                  <li key={f.id}>
                    <FileCard
                      name={f.name}
                      meta={
                        <>
                          <span className="tabular-nums">{formatStorage(f.size)}</span> · {f.team} · {f.owner}
                        </>
                      }
                      actions={
                        <ActionMenu
                          label={`Ações de ${f.name}`}
                          actions={[
                            { label: "Abrir no Drive", icon: <ExternalLink />, onSelect: () => notify(`Abrimos ${f.where}`, undefined, "info") },
                            { label: "Mover para arquivo frio", icon: <Archive />, onSelect: () => notify(`${f.name} movido para o arquivo frio`, () => notify("Movimentação desfeita", undefined, "info")) },
                          ]}
                        />
                      }
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty
                title={`Nenhum arquivo grande de ${team}`}
                hint="Os maiores arquivos do workspace são de outras equipes."
                action={
                  <Button variant="ghost" size="sm" onClick={clearFilter}>
                    Limpar filtro
                  </Button>
                }
              />
            )}
          </Section>

          <Section title="Uso por equipe" description="Soma do que cada equipe guarda no Drive, nas reuniões e nos anexos.">
            <BarList items={teamUsage} format={(n) => formatStorage(n)} showShare />
          </Section>
        </div>
      </div>
    );

  return (
    <SettingsShell slug="settings-storage" title="Armazenamento" description={`Quanto o workspace da ${org.name} ocupa da cota de 1 TB e o que dá para liberar sem perder trabalho.`}>
      {body}
    </SettingsShell>
  );
}

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button, DataTable, LoadingOverlay, LoadingState, Skeleton, Spinner, type Column } from "@g4os/ds";
import { Demo, DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Carregando",
  group: "Feedback e estados",
  order: 40,
  description: "Esqueleto quando a forma do conteúdo é conhecida; spinner quando não é; véu quando o conteúdo anterior continua útil enquanto atualiza.",
};

type R = { id: string; nome: string; etapa: string; valor: string };
const rows: R[] = [
  { id: "1", nome: "Acme Logística", etapa: "Proposta", valor: "R$ 48.000" },
  { id: "2", nome: "Vértice Saúde", etapa: "Negociação", valor: "R$ 120.500" },
  { id: "3", nome: "Rede Horizonte", etapa: "Qualificação", valor: "R$ 22.900" },
];
const cols: Column<R>[] = [
  { key: "nome", header: "Conta", cell: (r) => r.nome, primary: true },
  { key: "etapa", header: "Etapa", cell: (r) => r.etapa },
  { key: "valor", header: "Valor", cell: (r) => r.valor, align: "right" },
];

export default function Page() {
  const [busy, setBusy] = useState(false);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Skeleton: a forma do que vem" rule="Primeira carga de uma tela ou card com layout previsível. O esqueleto imita linhas, avatares e números — não um retângulo cinza genérico.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo title="Card de KPI" className="block" code={`<Skeleton className="h-3 w-24" />
<Skeleton className="mt-3 h-7 w-32" />
<Skeleton className="mt-3 h-3 w-40" />`}>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-xl border border-line px-4 py-3.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-3 h-7 w-28" />
                  <Skeleton className="mt-3 h-3 w-36" />
                </div>
              ))}
            </div>
          </Demo>
          <Demo title="Lista com avatar" className="block">
            <div className="divide-y divide-line rounded-xl border border-line">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="mt-2 h-2.5 w-1/3" />
                  </div>
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          </Demo>
        </div>
      </DocSection>

      <DocSection title="Spinner e LoadingState" rule="Quando não dá para prever a forma (resultado de busca externa, geração por IA) ou dentro de um botão/linha.">
        <Demo code={`<Spinner size="xs" /> <Spinner size="sm" /> <Spinner /> <Spinner size="lg" />
<LoadingState label="Gerando relatório…" hint="Costuma levar uns 20 segundos." />`}>
          <Spinner size="xs" />
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" />
          <span className="mx-2 h-6 w-px bg-line" />
          <Button size="sm" disabled>
            <Spinner size="sm" className="border-white/30 border-t-white" /> Salvando…
          </Button>
        </Demo>
        <Demo className="block p-0">
          <LoadingState label="Gerando relatório de comissões…" hint="Costuma levar uns 20 segundos. Pode sair desta tela." />
        </Demo>
      </DocSection>

      <DocSection title="LoadingOverlay: atualizando sem apagar" rule="Trocou filtro, página ou período: mantenha os dados anteriores visíveis sob um véu. O pai precisa de `relative`.">
        <Demo
          className="block"
          code={`<div className="relative">
  <DataTable rows={rows} columns={cols} rowKey={(r) => r.id} />
  <LoadingOverlay show={isFetching} />
</div>`}
        >
          <div className="mb-3">
            <Button size="sm" variant="ghost" onClick={() => { setBusy(true); setTimeout(() => setBusy(false), 1800); }}>
              <RefreshCw /> Trocar período
            </Button>
          </div>
          <div className="relative">
            <DataTable rows={rows} columns={cols} rowKey={(r) => r.id} />
            <LoadingOverlay show={busy} />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Até ~300 ms não mostre nada; depois, esqueleto ou spinner.", dont: "Piscar um spinner por 80 ms a cada clique." },
            { do: "Ao salvar, quem informa é o botão (“Salvando…”).", dont: "Spinner de página inteira para salvar um campo." },
            { do: "Diga quanto costuma demorar em esperas longas.", dont: "Barra de progresso falsa que trava em 99 %." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

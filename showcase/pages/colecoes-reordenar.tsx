import { useState } from "react";
import { Badge, SortableList, formatPercent, notify } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Reordenar lista",
  group: "Coleções",
  order: 40,
  description: "SortableList reordena uma lista curta arrastando a alça (mouse ou toque) ou pelo teclado, anunciando cada movimento para leitores de tela.",
};

type Etapa = { id: string; nome: string; prob: number };

const inicial: Etapa[] = [
  { id: "prospeccao", nome: "Prospecção", prob: 0.1 },
  { id: "qualificacao", nome: "Qualificação", prob: 0.2 },
  { id: "diagnostico", nome: "Diagnóstico", prob: 0.35 },
  { id: "proposta", nome: "Proposta enviada", prob: 0.55 },
  { id: "negociacao", nome: "Negociação", prob: 0.75 },
];

export default function Page() {
  const [etapas, setEtapas] = useState(inicial);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="SortableList" rule="Etapas do pipeline, campos de um formulário, prioridade de fila, ordem de colunas. Mouse/toque: arraste a alça. Teclado: Tab até a alça, Espaço pega, ↑/↓ movem, Espaço solta, Esc cancela.">
        <Demo
          className="max-w-xl"
          code={`<SortableList
  label="Etapas do pipeline"
  items={etapas}
  getKey={(e) => e.id}
  getLabel={(e) => e.nome}
  onReorder={(next) => { setEtapas(next); notify("Ordem das etapas salva"); }}
  renderItem={(e, { index }) => (
    <div className="flex items-center justify-between gap-3">
      <span>{index + 1}. {e.nome}</span>
      <Badge>{formatPercent(e.prob, 0)}</Badge>
    </div>
  )}
/>`}
        >
          <SortableList
            label="Etapas do pipeline"
            items={etapas}
            getKey={(e) => e.id}
            getLabel={(e) => e.nome}
            onReorder={(next) => {
              setEtapas(next);
              notify("Ordem das etapas salva");
            }}
            renderItem={(e, { index }) => (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="truncate text-[13.5px]">
                  <span className="mr-2 tabular-nums text-muted">{index + 1}</span>
                  {e.nome}
                </span>
                <Badge>chance de {formatPercent(e.prob, 0)}</Badge>
              </div>
            )}
          />
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Lista curta (até ~20 itens) e ordem com significado (prioridade, sequência).", dont: "Arrastar em tabelas longas: ofereça ordenação por coluna." },
            { do: "Salvar ao soltar e confirmar com toast curto; ofereça Desfazer quando a ordem afeta outras pessoas.", dont: "Arraste como única forma de mudar ordem sem teclado (o componente já suporta: não remova a alça)." },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["items / onReorder", "T[] / (items: T[]) => void", "—", "Lista e callback com a nova ordem (ao soltar)."],
            ["getKey / getLabel", "(item) => string", "—", "Chave estável e nome usado nos anúncios."],
            ["renderItem", "(item, { dragging, index }) => ReactNode", "—", "Conteúdo da linha; a alça vem à esquerda."],
            ["label", "string", "—", "Nome acessível da lista."],
            ["disabled", "boolean", "false", "Desliga a reordenação."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

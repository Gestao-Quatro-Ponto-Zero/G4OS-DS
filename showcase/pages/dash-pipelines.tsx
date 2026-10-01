import { useState } from "react";
import { Avatar, Badge, EntityMark, KanbanBoard, KanbanColumn, RecordCard, StagePath, formatCurrency } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Pipelines e etapas",
  group: "Dashboards",
  order: 40,
  description: "Qualquer fluxo de registros por etapas: negócios (CRM), candidatos (ATS), pedidos e compras (ERP), tickets. StagePath mostra a etapa de UM registro; RecordCard + KanbanColumn montam o quadro.",
};

const stages = [
  { id: "qualificacao", label: "Qualificação" },
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "proposta", label: "Proposta" },
  { id: "negociacao", label: "Negociação" },
  { id: "fechamento", label: "Fechamento" },
];

export default function Page() {
  const [current, setCurrent] = useState("proposta");
  return (
    <DocPage title={meta.title} kicker="Dashboards" description={meta.description}>
      <DocSection title="StagePath" rule="Topo da página do registro. Concluídas em ink com check, atual com moldura dourada, futuras neutras. Clicável com onSelect; outcome fecha como ganho/perdido.">
        <Demo
          className="grid gap-4"
          code={`<StagePath stages={stages} current={current} onSelect={setCurrent} label="Etapa do negócio" />
<StagePath stages={stages} current="negociacao" outcome={{ tone: "ok", label: "Ganho" }} />
<StagePath stages={stages} current="diagnostico" outcome={{ tone: "bad", label: "Perdido" }} />`}
        >
          <StagePath stages={stages} current={current} onSelect={setCurrent} label="Etapa do negócio" />
          <StagePath stages={stages} current="fechamento" outcome={{ tone: "ok", label: "Ganho" }} label="Negócio ganho" />
          <StagePath stages={stages} current="diagnostico" outcome={{ tone: "bad", label: "Perdido" }} label="Negócio perdido" />
        </Demo>
        <PropsTable
          rows={[
            ["stages", "{ id, label }[]", "—", "Etapas na ordem. 3–7 cabem sem rolar."],
            ["current", "string", "—", "Id da etapa atual."],
            ["onSelect", "(id) => void", "—", "Torna as etapas clicáveis (mover o registro)."],
            ["outcome", '{ tone: "ok" | "bad", label }', "—", "Encerra o caminho (ganho, perdido, contratado, reprovado)."],
          ]}
        />
      </DocSection>

      <DocSection title="RecordCard" rule="Card genérico de quadro: título, subtítulo, valor, etiquetas, dono e meta. tone=warn para parado há muito tempo, bad para bloqueado.">
        <Demo
          className="grid gap-3 sm:grid-cols-3"
          code={`<RecordCard
  title="Grupo Aurora Alimentos"
  subtitle="Licenças anuais · 240 usuários"
  value={formatCurrency(460800, { cents: false })}
  leading={<EntityMark name="Grupo Aurora" tint="#842e20" className="h-7 w-7 text-[11px]" />}
  tags={<><Badge>Indicação</Badge><Badge tone="accent">Prioridade</Badge></>}
  owner={{ name: "Ana Lopes", initials: "AL" }}
  meta="12 dias na etapa"
  onOpen={() => router.push("/negocios/d1")}
  onDragStart={(e) => e.dataTransfer.setData("text/plain", "d1")}
/>`}
        >
          <RecordCard
            title="Grupo Aurora Alimentos"
            subtitle="Licenças anuais · 240 usuários"
            value={formatCurrency(460_800, { cents: false })}
            leading={<EntityMark name="Grupo Aurora" tint="#842e20" className="h-7 w-7 text-[11px]" />}
            tags={
              <>
                <Badge>Indicação</Badge>
                <Badge tone="accent">Prioridade</Badge>
              </>
            }
            owner={{ name: "Ana Lopes", initials: "AL" }}
            meta="12 dias na etapa"
            draggable={false}
            onOpen={() => undefined}
          />
          <RecordCard
            title="Larissa Mendes"
            subtitle="Back-end Sênior · Nubank"
            leading={<Avatar initials="LM" tint="#842e20" name="Larissa Mendes" />}
            tags={<Badge>LinkedIn</Badge>}
            meta="2 dias na etapa"
            draggable={false}
          />
          <RecordCard
            title="Agro Cerrado"
            subtitle="Implantação completa"
            value={formatCurrency(312_000, { cents: false })}
            tone="warn"
            owner={{ name: "Carla Nogueira", initials: "CN" }}
            meta={<span className="font-medium text-amber">45 dias parado</span>}
            draggable={false}
          />
        </Demo>
      </DocSection>

      <DocSection title="Quadro com totais por etapa" rule="KanbanColumn aceita meta (soma de valor, média de nota, limite de WIP) e width. Mova com arrastar + notify com desfazer; veja o bloco CRM › Pipeline.">
        <Demo
          bare
          code={`<KanbanBoard>
  {stages.map((st) => {
    const list = deals.filter((d) => d.stage === st.id);
    return (
      <KanbanColumn key={st.id} title={st.label} count={list.length}
        meta={formatCurrency(sum(list), { compact: true })}
        onDrop={drop(st.id)} width={240}>
        {list.map((d) => <RecordCard key={d.id} … />)}
      </KanbanColumn>
    );
  })}
</KanbanBoard>`}
        >
          <div className="rounded-xl border border-line bg-surface p-4">
            <KanbanBoard>
              {stages.slice(0, 3).map((st, i) => (
                <KanbanColumn key={st.id} title={st.label} count={2 - (i % 2)} meta={formatCurrency([114_900, 141_000, 478_400][i], { compact: true })} width={240}>
                  <RecordCard title={["Clínica Bem Viver", "Metalúrgica Santa Clara", "Vértice Logística"][i]} subtitle="Negócio de exemplo" value={formatCurrency([18_900, 86_400, 128_000][i], { cents: false })} owner={{ name: "Ana Lopes", initials: "AL" }} draggable={false} />
                </KanbanColumn>
              ))}
            </KanbanBoard>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Mudar de etapa arrastando ou no StagePath do registro, sempre com toast de desfazer.", dont: "Select de etapa dentro do card do quadro." },
            { do: "Card com 3–5 informações: quem, quanto, desde quando, de onde.", dont: "Card que repete todas as colunas da tabela." },
            { do: "Destacar parados (tone=warn) com o motivo escrito (“45 dias parado”).", dont: "Borda colorida sem texto que explique." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

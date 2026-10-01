import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { ActivitySection, Avatar, FilesList, NotesTable, PriorityIcon, PropertyPill, PropertyPills, RecordPanel, RecordSection, SectionAddButton, StatusPill, TagPill, notify } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Painel lateral de registro",
  group: "Coleções",
  order: 40,
  description: "Abre um registro ao lado da lista (sem perder o lugar): navegação ‹ ›, título editável, propriedades em pílulas, arquivos, notas e atividade. No celular vira folha.",
};

export default function Page() {
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState("098 - Autenticação: proteção CSRF no login");
  return (
    <DocPage title={meta.title} kicker="Coleções" description={meta.description}>
      <DocSection title="RecordPanel" rule="Coloque ao lado do DataGrid (flex). ⌥↑/⌥↓ navegam, Esc fecha. Veja o bloco “Rastreador de registros”.">
        <Demo
          bare
          code={`<div className="flex gap-4">
  <DataGrid … onRowOpen={(r) => setAberto(r.id)} />
  <RecordPanel open={!!aberto} title={r.titulo} onTitleChange={…} position="3 de 18"
    onPrev={…} onNext={…} onDelete={…} onClose={() => setAberto(null)}
    properties={<PropertyPills><PropertyPill … /></PropertyPills>}>
    <RecordSection title="Arquivos" action={<SectionAddButton onClick={…} />}><FilesList files={…} /></RecordSection>
    <RecordSection title="Notas do documento"><NotesTable columns={…} rows={…} /></RecordSection>
    <ActivitySection items={…} />
  </RecordPanel>
</div>`}
        >
          <div className="flex h-[640px] justify-end rounded-2xl bg-soft/60 p-3">
            {!open && (
              <button type="button" onClick={() => setOpen(true)} className="m-auto rounded-lg px-3 py-2 text-[13px] ring-1 ring-line hover:bg-surface">
                Abrir registro
              </button>
            )}
            <RecordPanel
              open={open}
              title={title}
              onTitleChange={setTitle}
              description="Verificar se o login rejeita requisições sem token CSRF válido."
              position="1 de 18"
              onNext={() => notify("Próximo registro", undefined, "info")}
              onDelete={() => notify("Excluído", () => undefined)}
              onClose={() => setOpen(false)}
              properties={
                <PropertyPills>
                  <PropertyPill value={<TagPill size="sm" color="purple" className="-mx-1">Autenticação</TagPill>} placeholder="Categoria" />
                  <PropertyPill value={<StatusPill size="sm" status="em-andamento" className="-mx-1" />} placeholder="Status" />
                  <PropertyPill icon={<PriorityIcon priority="alta" />} value="Alta" placeholder="Prioridade" />
                  <PropertyPill icon={<Avatar initials="EB" size="sm" name="Eduardo Barros" />} value="Eduardo" placeholder="Responsável" className="pl-1" />
                  <PropertyPill icon={<CalendarDays className="text-muted" />} value="11/06/2026" placeholder="Prazo" />
                </PropertyPills>
              }
            >
              <RecordSection title="Arquivos" action={<SectionAddButton />}>
                <FilesList files={[{ id: "1", name: "Notas de teste de agosto", kind: "pdf" }, { id: "2", name: "test-case-098.js", kind: "github" }]} />
              </RecordSection>
              <RecordSection title="Notas do documento" action={<button type="button">Ver tudo</button>}>
                <NotesTable columns={["#", "Caso", "Resultado esperado"]} rows={[["1", "Sem token", "403"], ["2", "Token antigo", "Recusado"], ["3", "Após logout", "Pede login"], ["4", "2 h aberto", "Renova"]]} />
              </RecordSection>
              <ActivitySection items={[{ id: "a", actor: { name: "Carla Nogueira", initials: "CN" }, action: "comentou", time: "ontem", quote: "Reproduzi no Safari." }]} />
            </RecordPanel>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["open · onClose", "boolean · () => void", "—", ""],
            ["title · onTitleChange", "string · (v) => void", "—", "Sem onTitleChange o título é só leitura"],
            ["position · onPrev · onNext", "string · () => void", "—", "Sem handler o botão fica desabilitado"],
            ["properties", "ReactNode", "—", "Use PropertyPills + PropertyPill (com items para menu)"],
            ["width", "number", "460", "Largura no desktop"],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Painel lateral para revisar vários registros em sequência (‹ ›).", dont: "Navegar para outra página e perder filtro e rolagem." },
            { do: "Propriedade vazia mostra o nome dela em cinza (“Rótulos”), clicável.", dont: "Esconder propriedades vazias: a pessoa não descobre que existem." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

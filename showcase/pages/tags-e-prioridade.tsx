import { useState } from "react";
import { PriorityIcon, PriorityPill, StatusPill, TagPill, tagColors, type Priority, type TaskStatus } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Etiquetas, status e prioridade",
  group: "Ações e exibição",
  order: 30,
  description: "Etiquetas coloridas no estilo banco de dados (9 matizes com contraste AA nos dois temas), status com cor fixa por estado e prioridade em barras.",
};

const names: Record<string, string> = { gray: "Cinza", brown: "Marrom", orange: "Laranja", yellow: "Amarelo", green: "Verde", blue: "Azul", purple: "Roxo", pink: "Rosa", red: "Vermelho" };

export default function Page() {
  const [tags, setTags] = useState(["Autenticação", "Busca", "Integração", "Permissões"]);
  return (
    <DocPage title={meta.title} kicker="Ações e exibição" description={meta.description}>
      <DocSection title="TagPill" rule="Cor agrupa categorias; o texto é quem significa. Sem `color`, a cor vem do texto (a mesma categoria tem a mesma cor em qualquer tela).">
        <Demo
          className="flex flex-wrap gap-2"
          code={`<TagPill color="purple">Autenticação</TagPill>
<TagPill>Busca</TagPill>                    // cor derivada do texto
<TagPill variant="dot" color="blue">Melhoria</TagPill>
<TagPill onRemove={() => remover("Busca")}>Busca</TagPill>`}
        >
          {tagColors.map((c) => (
            <TagPill key={c} color={c}>
              {names[c]}
            </TagPill>
          ))}
        </Demo>
        <Demo title="Variantes" className="flex flex-wrap items-center gap-2" code={`<TagPill variant="dot" color="purple">Funcionalidade</TagPill>\n<TagPill size="sm" color="green">Pago</TagPill>`}>
          <TagPill variant="dot" color="blue">Melhoria</TagPill>
          <TagPill variant="dot" color="purple">Funcionalidade</TagPill>
          <TagPill variant="dot" color="red">Bug</TagPill>
          <TagPill size="sm" color="green">Pago</TagPill>
          {tags.map((t) => (
            <TagPill key={t} onRemove={() => setTags((x) => x.filter((y) => y !== t))}>
              {t}
            </TagPill>
          ))}
        </Demo>
        <PropsTable
          rows={[
            ["color", "TagColor", "derivada do texto", "gray · brown · orange · yellow · green · blue · purple · pink · red"],
            ["variant", '"soft" | "dot"', '"soft"', "dot = contorno neutro + bolinha (listas densas)"],
            ["size", '"sm" | "md"', '"md"', "sm em cards de quadro e células compactas"],
            ["onRemove", "() => void", "—", "Mostra × com rótulo acessível"],
          ]}
        />
      </DocSection>
      <DocSection title="StatusPill" rule="Cor fixa por estado em todo o produto: não iniciado (vermelho suave), em andamento (amarelo), em revisão (azul), concluído (verde).">
        <Demo className="flex flex-wrap gap-2" code={`<StatusPill status="em-andamento" />\n<StatusPill status="concluido" label="Entregue" />`}>
          {(["nao-iniciado", "em-andamento", "em-revisao", "concluido", "bloqueado", "sem-status"] as TaskStatus[]).map((s) => (
            <StatusPill key={s} status={s} />
          ))}
        </Demo>
      </DocSection>
      <DocSection title="Prioridade" rule="Três barras crescentes; urgente é um quadrado com exclamação. Ícone sempre com rótulo ao lado ou em aria-label.">
        <Demo className="flex flex-wrap items-center gap-3" code={`<PriorityIcon priority="alta" />\n<PriorityPill priority="media" />`}>
          {(["urgente", "alta", "media", "baixa", "sem"] as Priority[]).map((p) => (
            <PriorityPill key={p} priority={p} />
          ))}
          <span className="inline-flex items-center gap-2 text-[13px] text-muted">
            só ícone: <PriorityIcon priority="alta" /> <PriorityIcon priority="urgente" />
          </span>
        </Demo>
      </DocSection>
      <DocSection title="Tokens">
        <p className="m-0 text-[13px] text-muted">
          <code>--ds-tag-{"{cor}"}-bg</code> e <code>--ds-tag-{"{cor}"}-fg</code> (utilitários <code>bg-tag-blue-bg text-tag-blue-fg</code>). Contraste mínimo 5,7:1 no claro e 7,2:1 no escuro.
        </p>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Uma cor por valor, a mesma em todas as telas (use o default derivado do texto ou um mapa fixo).", dont: "Cor diferente para a mesma categoria em telas diferentes." },
            { do: "Status com os presets do StatusPill.", dont: "Vermelho para categoria neutra: vermelho lê como problema." },
            { do: "variant=\"dot\" quando há muitas etiquetas na mesma linha.", dont: "Mais de 3 etiquetas coloridas lado a lado." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

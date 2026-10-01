import { useState } from "react";
import { InlineEdit, Rating, TagInput } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Tags, nota e edição inline", group: "Formulários", order: 26, description: "TagInput para listas livres, Rating para scorecards e avaliações, InlineEdit para editar no lugar." };

const skills = ["React", "TypeScript", "Node.js", "SQL", "Gestão de times", "Negociação", "Salesforce", "HubSpot", "Excel avançado", "Inglês fluente"];

export default function Page() {
  const [tags, setTags] = useState(["React", "Negociação"]);
  const [emails, setEmails] = useState<string[]>(["ana@empresa.com"]);
  const [r1, setR1] = useState<number | null>(4);
  const [r2, setR2] = useState<number | null>(3);
  const [title, setTitle] = useState("Renovação anual · Rede Horizonte");
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="TagInput" rule="Enter ou vírgula adiciona, Backspace no vazio remove a última. Sugestões filtram sem acento. `validate` recusa com mensagem (e-mails, domínios).">
        <Demo
          className="grid gap-x-6 sm:grid-cols-2"
          code={`<TagInput label="Competências" value={tags} onChange={setTags} suggestions={skills} max={8} />
<TagInput label="Convidar" value={emails} onChange={setEmails}
  validate={(t) => (/.+@.+\\..+/.test(t) ? null : \`“\${t}” não é um e-mail.\`)} />`}
        >
          <TagInput label="Competências" value={tags} onChange={setTags} suggestions={skills} max={8} hint="Até 8." />
          <TagInput label="Convidar por e-mail" value={emails} onChange={setEmails} placeholder="nome@empresa.com" validate={(t) => (/.+@.+\..+/.test(t) ? null : `“${t}” não é um e-mail.`)} />
        </Demo>
      </DocSection>
      <DocSection title="Rating" rule="Estrelas (douradas) para avaliação pública/qualitativa. Escala numerada (ink) para scorecard interno — lê como critério, não como gosto. Mostre a palavra da nota.">
        <Demo className="flex flex-col items-start gap-4" code={`<Rating value={r} onChange={setR} showLabel />
<Rating variant="scale" value={r} onChange={setR} showLabel label="Comunicação" />
<Rating value={4} readOnly size="sm" />`}>
          <Rating value={r1} onChange={setR1} showLabel label="Avaliação geral" />
          <Rating variant="scale" value={r2} onChange={setR2} showLabel label="Comunicação" />
          <div className="flex items-center gap-6">
            <Rating value={4} readOnly size="sm" label="Nota média" />
            <Rating variant="scale" value={3} readOnly size="sm" label="Técnica" />
          </div>
        </Demo>
      </DocSection>
      <DocSection title="InlineEdit" rule="Para campo que se edita com frequência e sozinho (título de negócio, nome de vaga). Enter salva, Esc cancela. Formulário com vários campos → Drawer.">
        <Demo code={`<InlineEdit label="Título" value={title} onSave={setTitle} textClassName="text-[18px] font-semibold" />`}>
          <InlineEdit label="Título do negócio" value={title} onSave={setTitle} textClassName="text-[18px] font-semibold tracking-tight" />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Scorecard com critério nomeado e escala descrita (1 = muito fraco … 5 = excepcional).", dont: "Nota solta sem critério — vira opinião." }]} />
      </DocSection>
      <DocSection title="Props · Rating">
        <PropsTable
          rows={[
            ["value / onChange", "number | null", "—", "Sem onChange (ou readOnly) vira exibição."],
            ["variant", '"stars" | "scale"', '"stars"', "Estrelas douradas ou quadrados numerados."],
            ["max", "number", "5", "Tamanho da escala."],
            ["showLabel / labels", "boolean / string[]", "false / pt-BR", "Palavra da nota (Muito fraco … Excepcional)."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

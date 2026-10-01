import { Download, Globe, RotateCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
  formatBytes,
  notify,
  type AttachmentState,
} from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { art } from "./_media-data";

export const meta: PageMeta = {
  title: "Anexos",
  group: "Mídia e conteúdo",
  order: 41,
  description:
    "Attachment é o anexo componível: mídia (ícone do tipo ou miniatura), título, descrição, ações e gatilho que abre a prévia. Estados de envio, processamento e erro; tamanhos para composer, mensagem e formulário. Para o cartão de arquivo pronto, FileCard.",
  shadcn: "attachment",
};

function Uploading() {
  const [p, setP] = useState(8);
  useEffect(() => {
    const t = window.setInterval(() => setP((x) => (x >= 100 ? 8 : x + 7)), 350);
    return () => window.clearInterval(t);
  }, []);
  return (
    <Attachment state={p >= 100 ? "processing" : "uploading"} progress={p}>
      <AttachmentMedia name="contrato-acme.pdf" />
      <AttachmentContent>
        <AttachmentTitle>contrato-acme.pdf</AttachmentTitle>
        <AttachmentDescription />
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction label="Cancelar envio">
          <X />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}

const states: { state: AttachmentState; name: string; desc?: string }[] = [
  { state: "idle", name: "planilha-metas.xlsx", desc: "Pronto para enviar · 84 KB" },
  { state: "processing", name: "apresentacao-q3.pptx" },
  { state: "error", name: "video-demo.mov", desc: "Maior que 25 MB. Comprima ou envie um link." },
  { state: "done", name: "proposta-v3.pdf", desc: `PDF · ${formatBytes(2_400_000)}` },
];

export default function Page() {
  const [files, setFiles] = useState(["briefing.docx", "logo-acme.png", "orcamento.xlsx", "ata-reuniao.pdf"]);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Anatomia" rule="Mídia à esquerda, nome (truncado) e tipo · tamanho, ações de ícone à direita com `label`. O tipo vem da extensão em `name`.">
        <Demo
          code={`<Attachment>
  <AttachmentMedia name="proposta-v3.pdf" />
  <AttachmentContent>
    <AttachmentTitle>proposta-v3.pdf</AttachmentTitle>
    <AttachmentDescription>PDF · 2,4 MB</AttachmentDescription>
  </AttachmentContent>
  <AttachmentActions>
    <AttachmentAction label="Baixar"><Download /></AttachmentAction>
  </AttachmentActions>
</Attachment>`}
        >
          <div className="max-w-sm">
            <Attachment>
              <AttachmentMedia name="proposta-v3.pdf" />
              <AttachmentContent>
                <AttachmentTitle>proposta-v3.pdf</AttachmentTitle>
                <AttachmentDescription>PDF · {formatBytes(2_400_000)}</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction label="Baixar proposta-v3.pdf" onClick={() => notify("Download iniciado", undefined, "info")}>
                  <Download />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Imagem e link" rule="`variant=&quot;image&quot;` com `src` mostra a miniatura; na vertical (`orientation`) ela fica em cima, para grades de imagens. Um link usa o ícone que você passar.">
        <Demo
          code={`<Attachment orientation="vertical">
  <AttachmentMedia variant="image" src={url} alt="Fachada do escritório" />
  <AttachmentContent><AttachmentTitle>fachada.jpg</AttachmentTitle></AttachmentContent>
</Attachment>
<Attachment>
  <AttachmentMedia><Globe /></AttachmentMedia>
  <AttachmentContent><AttachmentTitle>Relatório no Notion</AttachmentTitle><AttachmentDescription>notion.so</AttachmentDescription></AttachmentContent>
</Attachment>`}
        >
          <div className="flex flex-wrap items-start gap-3">
            <Attachment orientation="vertical">
              <AttachmentMedia variant="image" src={art(0)} alt="Fachada do escritório" />
              <AttachmentContent>
                <AttachmentTitle>fachada.jpg</AttachmentTitle>
                <AttachmentDescription>Imagem · 1,2 MB</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction label="Remover fachada.jpg">
                  <X />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
            <Attachment orientation="vertical" state="uploading" progress={45}>
              <AttachmentMedia variant="image" src={art(2)} alt="Painel de indicadores" />
              <AttachmentContent>
                <AttachmentTitle>painel.png</AttachmentTitle>
                <AttachmentDescription />
              </AttachmentContent>
            </Attachment>
            <div className="w-full max-w-xs">
              <Attachment>
                <AttachmentMedia>
                  <Globe />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>Relatório de adoção · setembro</AttachmentTitle>
                  <AttachmentDescription>notion.so</AttachmentDescription>
                </AttachmentContent>
                {/* eslint-disable-next-line jsx-a11y/anchor-has-content -- nome acessível vem de `label` */}
                <AttachmentTrigger label="Abrir relatório de adoção" render={<a href="#/p/midia-anexos" />} />
              </Attachment>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Estados" rule="`idle` (borda tracejada: escolhido, não enviado), `uploading` com `progress`, `processing` (lendo, indexando), `error` com a causa e a saída, `done`.">
        <Demo code={`<Attachment state="uploading" progress={42}>…<AttachmentDescription /></Attachment>\n<Attachment state="error">…<AttachmentDescription>Maior que 25 MB…</AttachmentDescription></Attachment>`}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Uploading />
            {states.map((s) => (
              <Attachment key={s.state} state={s.state}>
                <AttachmentMedia name={s.name} />
                <AttachmentContent>
                  <AttachmentTitle>{s.name}</AttachmentTitle>
                  <AttachmentDescription>{s.desc}</AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  {s.state === "error" && (
                    <AttachmentAction label={`Tentar de novo ${s.name}`}>
                      <RotateCw />
                    </AttachmentAction>
                  )}
                  <AttachmentAction label={`Remover ${s.name}`}>
                    <X />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Tamanhos" rule="`default` em formulários e listas, `sm` em mensagens, `xs` como chip no composer (sem descrição).">
        <Demo code={`<Attachment size="sm">…</Attachment>\n<Attachment size="xs">…</Attachment>`}>
          <div className="flex flex-wrap items-center gap-3">
            {(["default", "sm", "xs"] as const).map((size) => (
              <Attachment key={size} size={size} className="w-60">
                <AttachmentMedia name="ata-reuniao.pdf" />
                <AttachmentContent>
                  <AttachmentTitle>ata-reuniao.pdf</AttachmentTitle>
                  <AttachmentDescription>PDF · 180 KB</AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction label="Remover ata-reuniao.pdf">
                    <X />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Grupo" rule="`layout=&quot;row&quot;` rola na horizontal (composer de IA, resposta de e-mail); `grid` para galeria; `list` para formulário.">
        <Demo
          code={`<AttachmentGroup layout="row" label="Anexos da mensagem">
  {files.map((f) => <Attachment key={f} size="sm">…</Attachment>)}
</AttachmentGroup>`}
        >
          <div className="w-full min-w-0 space-y-4">
            <AttachmentGroup layout="row" label="Anexos da mensagem">
              {files.map((f) => (
                <Attachment key={f} size="sm">
                  <AttachmentMedia name={f} />
                  <AttachmentContent>
                    <AttachmentTitle>{f}</AttachmentTitle>
                    <AttachmentDescription>{formatBytes(f.length * 23_000)}</AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction label={`Remover ${f}`} onClick={() => setFiles((all) => all.filter((x) => x !== f))}>
                      <X />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
            <AttachmentGroup layout="grid" label="Fotos da visita">
              {[1, 3, 4, 6].map((i) => (
                <Attachment key={i} orientation="vertical">
                  <AttachmentMedia variant="image" src={art(i)} alt={`Foto ${i} da visita`} />
                  <AttachmentContent>
                    <AttachmentTitle>{`visita-${i}.jpg`}</AttachmentTitle>
                  </AttachmentContent>
                  <AttachmentTrigger label={`Abrir visita-${i}.jpg`} onClick={() => notify("Abrir prévia", undefined, "info")} />
                </Attachment>
              ))}
            </AttachmentGroup>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="API">
        <PropsTable
          rows={[
            ["Attachment.state", '"idle" | "uploading" | "processing" | "error" | "done"', '"done"', "Estado do arquivo."],
            ["Attachment.progress", "number", "—", "0–100 durante uploading (barra na base e texto na descrição)."],
            ["Attachment.size", '"default" | "sm" | "xs"', '"default"', "Densidade."],
            ["Attachment.orientation", '"horizontal" | "vertical"', '"horizontal"', "Vertical: miniatura em cima."],
            ["AttachmentMedia.variant / name / src", '"icon" | "image"', '"icon"', "Ícone pelo tipo (extensão) ou miniatura."],
            ["AttachmentAction.label", "string", "—", "Obrigatório: nome do botão de ícone."],
            ["AttachmentTrigger.label / render", "string / ReactElement", "—", "Torna o anexo todo clicável (abrir prévia, link)."],
            ["AttachmentGroup.layout", '"row" | "grid" | "list"', '"row"', "Composição do conjunto."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Mostre tipo e tamanho; no erro, a causa e a saída (comprimir, enviar link).", dont: "“Erro no upload” sem motivo." },
            { do: "Ações de ícone com `label` que diz o arquivo (“Remover proposta.pdf”).", dont: "Vários botões de ícone sem nome." },
            { do: "AttachmentTrigger para abrir a prévia; as ações ficam por cima dele.", dont: "Envolver o anexo inteiro num `<button>` com botões dentro." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

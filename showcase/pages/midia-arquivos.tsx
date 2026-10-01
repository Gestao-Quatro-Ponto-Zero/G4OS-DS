import { Download, MoreHorizontal, RotateCw, Trash2 } from "lucide-react";
import { ActionMenu, FileCard, FileIcon, IconButton } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { art } from "./_media-data";

export const meta: PageMeta = {
  title: "Arquivos",
  group: "Mídia e conteúdo",
  order: 40,
  description: "FileCard mostra tipo, nome, tamanho e quem/quando — em linha (anexos) ou em bloco (gerenciador). Estados de envio e falha. Tipo detectado pela extensão.",
};

const menu = <ActionMenu actions={[{ label: "Baixar", icon: <Download /> }, { label: "Excluir", icon: <Trash2 />, tone: "danger", separator: true }]} trigger={<MoreHorizontal className="h-4 w-4" />} />;

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Em linha" rule="Anexos de um registro (proposta, contrato, currículo). Nome é o link; ações ficam no ⋯.">
        <Demo className="grid gap-2 md:grid-cols-2" code={`<FileCard name="proposta-acme.pdf" size={482000} meta="Carla · ontem" href="/files/…" actions={<ActionMenu … />} />
<FileCard name="base-clientes.xlsx" size={2400000} progress={64} />
<FileCard name="contrato.docx" error="Falhou: arquivo acima de 20 MB" actions={<IconButton label="Tentar de novo"><RotateCw /></IconButton>} />`}>
          <FileCard name="proposta-acme-logistica.pdf" size={482000} meta="Carla · ontem" href="#" actions={menu} />
          <FileCard name="curriculo-rafael-moura.docx" size={96000} meta="Portal de vagas · 2 dias" href="#" actions={menu} />
          <FileCard name="base-clientes-2026.xlsx" size={2400000} progress={64} />
          <FileCard name="contrato-vertice-assinado.pdf" size={31000000} error="Falhou: arquivo acima de 20 MB" actions={<IconButton label="Tentar de novo" size="sm"><RotateCw /></IconButton>} />
        </Demo>
      </DocSection>
      <DocSection title="Em bloco" rule="Gerenciador de arquivos e anexos com prévia. Imagens usam a própria miniatura.">
        <Demo className="grid grid-cols-2 gap-3 md:grid-cols-4" code={`<FileCard variant="tile" name="fachada.jpg" preview={url} size={…} />`}>
          <FileCard variant="tile" name="apresentacao-q3.pptx" size={8200000} meta="Diretoria" onOpen={() => undefined} actions={menu} />
          <FileCard variant="tile" name="fachada-loja.jpg" size={1350000} preview={art(1)} onOpen={() => undefined} actions={menu} />
          <FileCard variant="tile" name="extrato-setembro.csv" size={42000} onOpen={() => undefined} actions={menu} />
          <FileCard variant="tile" name="onboarding.mp4" size={128000000} progress={32} />
        </Demo>
      </DocSection>
      <DocSection title="Ícones de tipo">
        <Demo code={`<FileIcon name="nota.pdf" />`}>
          {["a.pdf", "a.xlsx", "a.docx", "a.png", "a.mp4", "a.zip", "a.pptx", "a.bin"].map((n) => (
            <span key={n} className="inline-flex items-center gap-2 text-[12px] text-muted">
              <FileIcon name={n} /> .{n.split(".")[1]}
            </span>
          ))}
        </Demo>
        <PropsTable
          rows={[
            ["name", "string", "—", "Com extensão (define o tipo)."],
            ["size", "number (bytes)", "—", "Formatado com formatBytes → “1,5 MB”."],
            ["meta", "ReactNode", "—", "Quem enviou · quando."],
            ["href / onOpen", "string / () => void", "—", "Link de download ou abrir prévia."],
            ["progress", "0–100", "—", "Enviando; barra fina abaixo do nome."],
            ["error", "string", "—", "Falha com motivo; borda rosa."],
            ["variant", '"row" | "tile"', '"row"', "Linha para anexos; bloco para gerenciador."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Erro de envio diz o motivo e oferece tentar de novo.", dont: "“Erro no upload.”" }, { do: "Nome completo no title quando truncar.", dont: "Esconder a extensão." }]} />
      </DocSection>
    </DocPage>
  );
}

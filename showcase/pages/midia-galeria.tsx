import { AspectFrame, ImageGallery } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { art, gallery } from "./_media-data";

export const meta: PageMeta = {
  title: "Galeria e imagens",
  group: "Mídia e conteúdo",
  order: 30,
  description: "ImageGallery monta a grade e abre o Lightbox; AspectFrame garante proporção fixa para imagem, vídeo ou mapa sem pular layout.",
};

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="ImageGallery" rule="Recorte uniforme (4:3 padrão), 2 colunas no celular. Clique abre em tela cheia com navegação.">
        <Demo bare code={`<ImageGallery images={[{ src, alt: "Fachada do escritório", caption: "São Paulo" }, …]} columns={4} />`}>
          <ImageGallery images={gallery} columns={4} />
        </Demo>
      </DocSection>
      <DocSection title="AspectFrame" rule="Reserve o espaço antes da imagem carregar. Imagem filha preenche com object-cover.">
        <Demo className="grid gap-4 sm:grid-cols-3" code={`<AspectFrame ratio={16 / 9}><img src={…} alt="…" /></AspectFrame>`}>
          {[[16 / 9, "16:9"], [4 / 3, "4:3"], [1, "1:1"]].map(([r, l], i) => (
            <figure key={l as string} className="m-0">
              <AspectFrame ratio={r as number}>
                <img src={art(i + 2)} alt="" />
              </AspectFrame>
              <figcaption className="mt-2 font-mono text-[11.5px] text-muted">{l}</figcaption>
            </figure>
          ))}
        </Demo>
        <PropsTable
          rows={[
            ["ImageGallery.images", "{ src, alt, caption? }[]", "—", "alt obrigatório."],
            ["ImageGallery.columns", "2 | 3 | 4 | 5", "4", "Colunas no desktop."],
            ["ImageGallery.ratio", "number", "4/3", "Recorte das miniaturas."],
            ["AspectFrame.ratio", "number", "16/9", "Proporção."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "alt descreve o que importa na foto (“Fachada do escritório em SP”).", dont: "alt=\"imagem\" ou nome do arquivo." }, { do: "Mesma proporção em toda a grade.", dont: "Miniaturas com alturas diferentes que desalinham a grade." }]} />
      </DocSection>
    </DocPage>
  );
}

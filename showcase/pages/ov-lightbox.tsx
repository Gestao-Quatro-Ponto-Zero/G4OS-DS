import { useState } from "react";
import { Lightbox } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, type PageMeta } from "../kit";
import { gallery } from "./_media-data";

export const meta: PageMeta = {
  title: "Lightbox",
  group: "Sobreposições",
  order: 60,
  description: "Imagem em tela cheia sobre fundo escuro, com ←/→, contador e legenda. Para grade de fotos pronta, use ImageGallery (Mídia e conteúdo).",
};

export default function Page() {
  const [i, setI] = useState<number | null>(null);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Exemplo" rule="Controlado por índice: null fecha. Clique numa miniatura.">
        <Demo code={`const [index, setIndex] = useState<number | null>(null);
<Lightbox images={fotos} index={index} onIndexChange={setIndex} />`}>
          {gallery.slice(0, 5).map((g, n) => (
            <button key={g.src} type="button" onClick={() => setI(n)} className="h-20 w-28 overflow-hidden rounded-lg border border-line" aria-label={`Ampliar: ${g.alt}`}>
              <img src={g.src} alt={g.alt} className="h-full w-full object-cover" />
            </button>
          ))}
        </Demo>
        <Lightbox images={gallery.slice(0, 5)} index={i} onIndexChange={setI} />
        <PropsTable
          rows={[
            ["images", "{ src, alt, caption? }[]", "—", "alt é obrigatório; caption aparece no rodapé."],
            ["index", "number | null", "—", "Imagem aberta; null = fechado."],
            ["onIndexChange", "(i: number | null) => void", "—", "Navegação e fechamento."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

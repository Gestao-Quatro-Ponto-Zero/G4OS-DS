import { useState } from "react";
import { BeforeAfter, CopyButton, ImageSphere, ImageWithFallback, KeyCombo, Lightbox, NumberTicker, formatCurrency } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { art } from "./_media-data";
import { sphereImages } from "./_ia-data";

export const meta: PageMeta = {
  title: "Imagens e microinterações",
  group: "IA e interação",
  order: 50,
  description: "ImageSphere (galeria 3D), BeforeAfter (comparação), ImageWithFallback, CopyButton, KeyCombo e NumberTicker.",
};

export default function Page() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="ImageSphere" rule="Imagens em esfera (Fibonacci). Arraste para girar, inércia ao soltar, setas do teclado. Gira sozinha devagar e para no hover; parada com movimento reduzido. Para vitrines, não para dados.">
        <Demo
          code={`<ImageSphere images={[{ src, alt }, …]} size={420} itemSize={64} onSelect={(i) => abrirLightbox(i)} />`}
          className="flex justify-center"
        >
          <ImageSphere images={sphereImages} onSelect={setOpen} label="Clientes e eventos" />
          <Lightbox images={sphereImages.map((s) => ({ src: s.src, alt: s.alt }))} index={open} onIndexChange={setOpen} />
        </Demo>
        <PropsTable
          rows={[
            ["images", "{ src, alt }[]", "—", "20–60 imagens funcionam melhor."],
            ["size · itemSize", "number", "420 · 64", "Diâmetro máximo e lado de cada imagem (px)."],
            ["autoRotate", "boolean", "true", "Rotação lenta; desligada com movimento reduzido."],
            ["onSelect", "(i) => void", "—", "Clique (sem arrastar) numa imagem."],
          ]}
        />
      </DocSection>
      <DocSection title="BeforeAfter" rule="Compare duas versões arrastando a alça (ou ← →).">
        <Demo bare code={`<BeforeAfter before={{ src: antigo, alt: "Painel antigo" }} after={{ src: novo, alt: "Painel novo" }} />`}>
          <BeforeAfter before={{ src: art(6, "Antes"), alt: "Versão anterior" }} after={{ src: art(2, "Depois"), alt: "Versão nova" }} className="max-w-[760px]" />
        </Demo>
      </DocSection>
      <DocSection title="ImageWithFallback" rule="Esqueleto enquanto carrega; iniciais ou ícone se falhar. Nunca o ícone quebrado do navegador.">
        <Demo code={`<ImageWithFallback src={url} alt="Renata Farias" fallback="Renata Farias" className="h-12 w-12 rounded-full" />`}>
          <ImageWithFallback src={art(1)} alt="Foto" className="h-12 w-12 rounded-full" />
          <ImageWithFallback src="/nao-existe.png" alt="Renata Farias" fallback="Renata Farias" className="h-12 w-12 rounded-full" />
          <ImageWithFallback src="/nao-existe.png" alt="Capa do produto" className="h-12 w-20 rounded-lg" />
          <ImageWithFallback src={art(5)} alt="Capa" className="h-12 w-20 rounded-lg" />
        </Demo>
      </DocSection>
      <DocSection title="Microinterações">
        <Demo code={`<CopyButton value="NFE-3526…" />  <KeyCombo keys={["⌘", "K"]} />  <NumberTicker value={4218000} format={(n) => formatCurrency(n, { compact: true })} />`}>
          <CopyButton value="3526 0912 3456 7800 0190 5500 1000 0012 3410 0012 3456" label="Copiar chave" />
          <CopyButton value="NEG-2291" iconOnly />
          <KeyCombo keys={["⌘", "K"]} />
          <KeyCombo keys={["⌘", "⇧", "P"]} />
          <span className="text-[24px] font-semibold tracking-tight">
            <NumberTicker value={4218000} format={(n) => formatCurrency(n, { compact: true })} />
          </span>
          <span className="text-[24px] font-semibold tracking-tight">
            <NumberTicker value={1284} />
          </span>
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Toda imagem com alt descritivo; decorativas com alt vazio.", dont: "Alt “imagem1.png”." }, { do: "Contagem animada só na primeira vez que o número aparece.", dont: "Número que recomeça a contar a cada re-render." }]} />
      </DocSection>
    </DocPage>
  );
}

import { useEffect, useState } from "react";
import { AudioPlayer } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Áudio",
  group: "Mídia e conteúdo",
  order: 6,
  description: "AudioPlayer para gravação de ligação (CRM), entrevista (ATS) e mensagem de voz: play/pausa, forma de onda navegável por teclado, tempo e velocidade.",
};

/** WAV curto gerado no navegador (o showcase não carrega arquivos de áudio). */
function useToneUrl(seconds: number) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const rate = 8000;
    const n = rate * seconds;
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);
    const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, "RIFF");
    v.setUint32(4, 36 + n * 2, true);
    w(8, "WAVEfmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    w(36, "data");
    v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) {
      const t = i / rate;
      const env = 0.5 + 0.5 * Math.sin(t * 2.1);
      v.setInt16(44 + i * 2, Math.sin(2 * Math.PI * 220 * t) * 2400 * env, true);
    }
    const u = URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [seconds]);
  return url;
}

export default function Page() {
  const call = useToneUrl(24);
  const voice = useToneUrl(8);
  return (
    <DocPage title={meta.title} kicker="Mídia e conteúdo" description={meta.description}>
      <DocSection title="Gravação" rule="Título diz o que é e quando (“Ligação com Ana Lopes · 12/09”). ←/→ voltam e avançam 5 s; Espaço toca e pausa.">
        <Demo code={`<AudioPlayer src={gravacao.url} title="Ligação com Ana Lopes · 12/09" duration={gravacao.segundos} peaks={gravacao.picos} />`}>
          <div className="max-w-xl">{call && <AudioPlayer src={call} title="Ligação com Ana Lopes · 12/09" duration={24} />}</div>
        </Demo>
      </DocSection>
      <DocSection title="Mensagem de voz" rule="compact: bolha sem título nem velocidade, para conversas.">
        <Demo code={`<AudioPlayer compact src={msg.url} title="Mensagem de voz de Bruno" duration={8} />`}>
          <div className="max-w-xs">{voice && <AudioPlayer compact src={voice} title="Mensagem de voz de Bruno" duration={8} />}</div>
        </Demo>
        <PropsTable
          rows={[
            ["src", "string", "—", "URL do arquivo (mp3, m4a, wav, ogg)."],
            ["title", "string", "—", "Rótulo visível e nome acessível dos controles."],
            ["peaks", "number[]", "—", "Amplitudes 0–1 calculadas no servidor. Sem elas, a forma de onda é decorativa."],
            ["duration", "number", "—", "Segundos, para mostrar antes de carregar o arquivo."],
            ["compact", "boolean", "false", "Bolha de mensagem de voz."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Transcrição ou resumo ao lado da gravação, quando houver (a forma de onda não diz o conteúdo).", dont: "Tocar áudio sozinho ao abrir a tela." },
            { do: "Duração visível antes de tocar.", dont: "Player nativo do navegador, que muda de visual em cada sistema." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

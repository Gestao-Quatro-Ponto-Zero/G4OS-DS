import { useRef, useState } from "react";
import { AudioPlayer, MomentCitation, TranscriptView, type AudioPlayerHandle } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { turns, useSilentAudio } from "./_meeting-data";

export const meta: PageMeta = {
  title: "Transcrição e citação de momento",
  group: "IA e interação",
  order: 72,
  description: "TranscriptView mostra a reunião por falante, sincronizada com o áudio (AudioPlayer com currentTime/onTimeUpdate/seekTo) e com busca. MomentCitation leva de um bullet ao momento exato.",
};

export default function Page() {
  const [time, setTime] = useState(0);
  const [query, setQuery] = useState("");
  const player = useRef<AudioPlayerHandle>(null);
  const src = useSilentAudio(1932);
  const seek = (t: number) => {
    setTime(t);
    player.current?.seekTo(t);
  };
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Sincronizada com o áudio" rule="Um estado de tempo para os dois: o player informa a posição (onTimeUpdate), a transcrição marca o trecho e clicar num horário leva o player até lá.">
        <Demo
          code={`const player = useRef<AudioPlayerHandle>(null);
const [t, setT] = useState(0);
const seek = (s: number) => { setT(s); player.current?.seekTo(s); };

<AudioPlayer ref={player} src={gravacao} title="Gravação da reunião" duration={1932}
  currentTime={t} onTimeUpdate={setT} markers={[{ t: 724, label: "Decisão: desconto" }]} />
<TranscriptView turns={trechos} currentTime={t} onSeek={seek}
  query={busca} onQueryChange={setBusca} className="h-96" />`}
        >
          <div className="grid gap-3">
            {src && <AudioPlayer ref={player} src={src} title="Gravação da reunião" duration={1932} currentTime={time} onTimeUpdate={setTime} markers={[{ t: 724, label: "Decisão: desconto do Vila" }]} />}
            <TranscriptView turns={turns} currentTime={time > 0 ? time : undefined} onSeek={seek} query={query} onQueryChange={setQuery} className="h-80" />
          </div>
        </Demo>
      </DocSection>
      <DocSection title="Ao vivo" rule="live: acompanha o fim enquanto a pessoa não rola para cima; o último trecho pode vir provisório (partial).">
        <Demo code={`<TranscriptView live turns={[...trechos, { ...ultimo, partial: true }]} className="h-64" />`}>
          <TranscriptView live turns={[...turns.slice(0, 4), { ...turns[4], partial: true, text: "Eu falo com a Dra. Paula" }]} className="h-64" />
        </Demo>
        <PropsTable
          rows={[
            ["turns", "TranscriptTurn[]", "—", "`{ id, speaker: { name, kind: 'me' | 'other', tint?, src? }, start, end?, text, partial? }` (segundos)."],
            ["currentTime", "number", "—", "Posição do áudio: marca e acompanha o trecho."],
            ["onSeek", "(t) => void", "—", "Clique no horário. Sem ele, horários são texto."],
            ["activeTurnId", "string", "—", "Força o trecho ativo."],
            ["highlight", "string[]", "—", "Trechos citados em destaque."],
            ["query / onQueryChange", "string / (q) => void", "—", "Destaque da busca; com `onQueryChange` aparece o campo."],
            ["live", "boolean", "false", "Gravação em andamento."],
            ["labels", "Partial<TranscriptViewLabels>", "transcriptViewLabels", "Textos."],
          ]}
        />
      </DocSection>
      <DocSection title="MomentCitation" rule="Ao lado de cada frase escrita pela IA. Hover ou foco mostra o trecho citado; clique pula o áudio. Diferente do CitationChip (fonte numerada): aponta para tempo.">
        <Demo code={`Grupo Vila: 15 % com contrato de 24 meses. <MomentCitation t={724} turn={trecho} onSeek={seek} />`}>
          <p className="m-0 text-[15px] leading-relaxed text-ink-soft">
            Grupo Vila: 15 % de desconto com contrato de 24 meses.
            <MomentCitation t={724} turn={turns[7]} onSeek={seek} active={time >= 724 && time < 740} className="ml-1.5" />
          </p>
        </Demo>
        <PropsTable
          rows={[
            ["t", "number", "—", "Segundos desde o início."],
            ["turn", "TranscriptTurn", "—", "Trecho para a prévia."],
            ["onSeek", "(t) => void", "—", "Clique."],
            ["active", "boolean", "false", "Momento tocando agora."],
            ["labels", "Partial<MomentCitationLabels>", "momentCitationLabels", "Textos."],
          ]}
        />
        <PropsTable
          rows={[
            ["AudioPlayer.currentTime", "number", "—", "Posição pedida; pula quando difere mais de 1 s."],
            ["AudioPlayer.onTimeUpdate", "(t) => void", "—", "Posição a cada avanço e salto."],
            ["AudioPlayer ref", "AudioPlayerHandle", "—", "`seekTo(t, { play? })`, `play()`, `pause()`."],
            ["AudioPlayer.markers", "AudioMarker[]", "—", "Pontos na forma de onda (`{ t, label }`)."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Separar Você (microfone) e Outros (áudio do sistema): a separação vem da captura, não de adivinhação.", dont: "Transcrição como um bloco de texto sem falante nem horário." },
            { do: "Todo bullet da IA com o momento citado.", dont: "Afirmação da IA sem como conferir na gravação." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

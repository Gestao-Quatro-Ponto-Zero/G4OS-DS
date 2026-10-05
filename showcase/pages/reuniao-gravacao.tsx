import { useEffect, useState } from "react";
import { LiveRecordingIndicator, Waveform, type RecordingTrack } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Gravação de reunião",
  group: "IA e interação",
  order: 70,
  description: "LiveRecordingIndicator mostra a SAÚDE da gravação, não só que está gravando: nível real por faixa (Você · Outros), frase de saúde e aviso com o que fazer. Waveform desenha o nível real do microfone.",
};

/** Nível de fala simulado. No app: RMS do AnalyserNode do microfone e do áudio do sistema. */
function useFakeLevel(talking = true) {
  const [level, setLevel] = useState(0.1);
  useEffect(() => {
    const id = window.setInterval(() => setLevel(talking ? 0.3 + Math.random() * 0.6 : 0.03 + Math.random() * 0.05), 110);
    return () => window.clearInterval(id);
  }, [talking]);
  return level;
}

export default function Page() {
  const mic = useFakeLevel(true);
  const sys = useFakeLevel(true);
  const [startedAt] = useState(() => Date.now() - 754_000);
  const ok: RecordingTrack[] = [
    { id: "mic", level: mic, ok: true },
    { id: "system", level: sys, ok: true },
  ];
  const silent: RecordingTrack[] = [
    { id: "mic", level: mic, ok: true },
    { id: "system", level: 0, ok: false },
  ];
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Pílula" rule="Vai na casca do app enquanto a reunião grava: estado, nível real, tempo e uma frase de saúde. Clique abre o painel; pausar e encerrar ficam à mão.">
        <Demo
          code={`<LiveRecordingIndicator
  state="recording"
  startedAt={inicio}
  level={nivel}                 // 0–1, RMS do microfone
  healthText="ouvindo · 148 palavras no último minuto"
  onOpen={abrirPainel}
  onPause={pausar}
  onStop={encerrar}
/>`}
        >
          <div className="flex flex-col items-start gap-3">
            <LiveRecordingIndicator state="recording" startedAt={startedAt} tracks={ok} healthText="ouvindo · 148 palavras no último minuto" onOpen={() => {}} onPause={() => {}} onStop={() => {}} />
            <LiveRecordingIndicator state="warning" startedAt={startedAt} tracks={silent} healthText="Sem áudio dos outros há 45 s — verifique a saída de som" onOpen={() => {}} onPause={() => {}} onStop={() => {}} />
            <LiveRecordingIndicator state="paused" elapsedMs={754_000} onResume={() => {}} onStop={() => {}} />
            <LiveRecordingIndicator state="processing" elapsedMs={1_932_000} />
            <LiveRecordingIndicator state="failed" elapsedMs={312_000} healthText="O microfone foi desconectado" onRetry={() => {}} />
          </div>
        </Demo>
      </DocSection>
      <DocSection title="Painel" rule="Detalhe da saúde: uma linha por faixa (Você = microfone, Outros = áudio do sistema) com sinal ou silêncio. No aviso, a frase diz o que fazer.">
        <Demo
          code={`<LiveRecordingIndicator
  variant="panel"
  state={semAudioDosOutros ? "warning" : "recording"}
  startedAt={inicio}
  tracks={[
    { id: "mic", level: nivelMic, ok: true },
    { id: "system", level: nivelSistema, ok: !semAudioDosOutros },
  ]}
  healthText={semAudioDosOutros ? "Sem áudio dos outros há 45 s — verifique a saída de som" : "ouvindo · 148 palavras no último minuto"}
  onPause={pausar}
  onStop={encerrarEGerarNotas}
/>`}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <LiveRecordingIndicator variant="panel" state="recording" startedAt={startedAt} tracks={ok} healthText="ouvindo · 148 palavras no último minuto" onPause={() => {}} onStop={() => {}} />
            <LiveRecordingIndicator variant="panel" state="warning" startedAt={startedAt} tracks={silent} healthText="Sem áudio dos outros participantes há 45 s — verifique a saída de som" onPause={() => {}} onStop={() => {}} />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["state", '"recording" | "paused" | "processing" | "warning" | "failed"', "—", "Estado da gravação. `warning` = gravando com problema (ex.: silêncio numa faixa)."],
            ["startedAt", "number", "—", "Início (epoch ms); o cronômetro anda sozinho."],
            ["elapsedMs", "number", "—", "Tempo controlado; vence `startedAt`."],
            ["level", "number", "maior faixa", "Nível 0–1 da pílula."],
            ["tracks", "RecordingTrack[]", "—", "`{ id: 'mic' | 'system', level, ok, label? }`."],
            ["healthText", "ReactNode", "—", "Frase de saúde ou o aviso com a ação."],
            ["variant", '"pill" | "panel"', '"pill"', "Pílula na casca ou painel de detalhe."],
            ["onPause / onResume / onStop / onOpen / onRetry", "() => void", "—", "Ações; só aparecem as que fazem sentido no estado."],
            ["labels", "Partial<LiveRecordingLabels>", "liveRecordingLabels", "Textos (pt-BR por padrão)."],
          ]}
        />
      </DocSection>
      <DocSection title="Waveform com nível real" rule="`level` (0–1) desenha o histórico rolando; `levels` recebe amostras prontas; sem eles, o modo decorativo de sempre. Silêncio vira ponto: a onda nunca some enquanto grava.">
        <Demo
          code={`// RMS do microfone a cada quadro
<Waveform level={rms} fade barClassName="bg-ink/55" />
<Waveform levels={amostras} bars={40} />
<Waveform processing />`}
        >
          <div className="flex max-w-md flex-col gap-4">
            <div className="flex">
              <Waveform level={mic} fade barClassName="bg-ink/55" bars={40} />
            </div>
            <div className="flex">
              <Waveform levels={[0.1, 0.4, 0.8, 0.6, 0.3, 0.05, 0.02, 0.5, 0.9, 0.7, 0.4, 0.2]} bars={40} barClassName="bg-ink/40" />
            </div>
            <div className="flex">
              <Waveform processing bars={40} barClassName="bg-line-strong" />
            </div>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["level", "number", "—", "Nível atual 0–1; amostrado a cada 90 ms enquanto `active` não for false."],
            ["levels", "number[]", "—", "Amostras 0–1; mostra as últimas `bars`."],
            ["processing", "boolean", "false", "Onda calma e simétrica (gerando notas)."],
            ["fade", "boolean", "false", "Esmaece a ponta esquerda."],
            ["active", "boolean", "—", "Modo decorativo (sem nível): anima enquanto true."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Mostrar se o áudio está chegando em cada faixa e avisar o silêncio com a ação.", dont: "Um ponto vermelho piscando que só diz 'gravando'." },
            { do: "Encerrar leva direto a gerar as notas.", dont: "Parar a gravação e deixar a pessoa procurar o resultado." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}

"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import {
  ArrowDown,
  CalendarDays,
  Check,
  ChevronDown,
  CircleX,
  Clock,
  Download,
  LayoutTemplate,
  LoaderCircle,
  Mic,
  Pause,
  Play,
  Share2,
  Sparkles,
  Square,
  TriangleAlert,
  Video,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { normalize } from "../lib/text";
import { Waveform } from "./ai-workspace";
import { Highlight } from "./filters";
import { SearchInput } from "./forms";
import { SegmentedControl } from "./navigation";
import { popupClass } from "./overlays";
import { HoverCard } from "./overlays-extra";
import { Avatar, AvatarGroup, Badge, Button, IconButton } from "./primitives";

/*
 * Reuniões (notas de reunião com IA, à la Granola), para qualquer app G4 OS:
 *   LiveRecordingIndicator . gravação com SAÚDE: nível real por faixa (Você · Outros), aviso de silêncio
 *   CallDetectedPrompt ..... "Parece que você entrou numa call": gravar notas quando outro app usa o microfone
 *   TranscriptView ......... transcrição por falante, sincronizada com o áudio, busca e acompanhamento ao vivo
 *   MomentCitation ......... "12:04": prévia do trecho no hover, clique pula o áudio para o momento
 *   AiNotes / AiNotesToggle  notas aprimoradas: o que a pessoa escreveu em tinta, o que a IA completou em tom suave
 *   MeetingCard ............ linha de reunião (gravando, gerando notas, pronta, com falhas)
 *   MeetingHeader .......... título, data, duração, participantes, modelo e ações
 *   TemplatePicker ......... modelo de notas (Reunião geral, 1:1, Vendas, Entrevista, Daily) com prévia
 *
 * Regras: notas primeiro (a IA completa o que a pessoa escreveu, nunca apaga);
 * todo bullet da IA aponta para o momento da transcrição; gravar mostra se o
 * áudio está chegando, não só que "está gravando".
 */

/* ------------------------------------------------------------------ */
/* Tipos e formatação                                                   */
/* ------------------------------------------------------------------ */

/** Participante de reunião. */
export type MeetingPerson = { name: string; initials?: string; tint?: string; src?: string };

/** Quem fala num trecho: `me` = microfone (Você), `other` = áudio do sistema (Outros). */
export type TranscriptSpeaker = MeetingPerson & { kind: "me" | "other" };

/** Um trecho da transcrição. `start`/`end` em segundos desde o início da gravação. */
export type TranscriptTurn = {
  id: string;
  speaker: TranscriptSpeaker;
  start: number;
  end?: number;
  text: string;
  /** Ainda sendo transcrito (ao vivo): texto provisório. */
  partial?: boolean;
};

/** Segundos → "12:04" (ou "1:02:04" a partir de uma hora). */
export function formatMoment(seconds: number) {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

/** Trecho em andamento no instante `t` (o último que começou até `t`). */
export function findTurnAt(turns: TranscriptTurn[], t: number) {
  let found: TranscriptTurn | undefined;
  for (const turn of turns) {
    if (turn.start <= t) found = turn;
    else break;
  }
  if (found?.end != null && t > found.end + 2) return undefined;
  return found;
}

/* ------------------------------------------------------------------ */
/* LiveRecordingIndicator                                               */
/* ------------------------------------------------------------------ */

export type RecordingState = "recording" | "paused" | "processing" | "warning" | "failed";

/** Faixa de captura: `mic` = sua voz, `system` = o que sai do alto-falante (os outros). */
export type RecordingTrack = { id: "mic" | "system"; label?: string; level: number; ok: boolean };

/** Textos do LiveRecordingIndicator. Passe só o que muda. */
export type LiveRecordingLabels = {
  recording: string;
  paused: string;
  processing: string;
  warning: string;
  failed: string;
  pause: string;
  resume: string;
  stop: string;
  /** Botão principal do painel: encerrar e gerar as notas. */
  stopAndEnhance: string;
  retry: string;
  open: string;
  mic: string;
  system: string;
  trackOk: string;
  trackSilent: string;
  /** Nome acessível do grupo; recebe o estado e o tempo. */
  ariaLabel: (state: string, time: string) => string;
};

/** Textos padrão (pt-BR) do LiveRecordingIndicator. */
export const liveRecordingLabels: LiveRecordingLabels = {
  recording: "Gravando",
  paused: "Pausado",
  processing: "Gerando notas",
  warning: "Verifique o áudio",
  failed: "A gravação parou",
  pause: "Pausar gravação",
  resume: "Retomar gravação",
  stop: "Encerrar gravação",
  stopAndEnhance: "Encerrar e gerar notas",
  retry: "Tentar de novo",
  open: "Abrir a reunião",
  mic: "Você",
  system: "Outros",
  trackOk: "com sinal",
  trackSilent: "sem sinal",
  ariaLabel: (state, time) => `Gravação da reunião: ${state}, ${time}`,
};

function useElapsed(startedAt: number | undefined, elapsedMs: number | undefined, running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt == null || elapsedMs != null || !running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, elapsedMs, running]);
  if (elapsedMs != null) return elapsedMs;
  return startedAt != null ? Math.max(0, now - startedAt) : 0;
}

function RecordingGlyph({ state }: { state: RecordingState }) {
  if (state === "recording")
    return (
      <span className="relative grid h-4 w-4 shrink-0 place-items-center" aria-hidden>
        <span className="absolute h-2.5 w-2.5 rounded-full bg-rose/30 motion-safe:animate-ping" />
        <span className="h-2 w-2 rounded-full bg-rose" />
      </span>
    );
  if (state === "paused") return <Pause className="h-4 w-4 shrink-0 text-muted" aria-hidden />;
  if (state === "processing") return <LoaderCircle className="h-4 w-4 shrink-0 text-muted motion-safe:animate-spin" aria-hidden />;
  if (state === "warning") return <TriangleAlert className="h-4 w-4 shrink-0 text-amber" aria-hidden />;
  return <CircleX className="h-4 w-4 shrink-0 text-rose" aria-hidden />;
}

const waveTone: Record<RecordingState, string> = {
  recording: "bg-ink/55",
  paused: "bg-line-strong",
  processing: "bg-line-strong",
  warning: "bg-amber/70",
  failed: "bg-line-strong",
};

/**
 * Gravação de reunião em andamento, com SAÚDE e não só "gravando": nível real
 * (`level`, 0–1, RMS do microfone), faixas Você/Outros com sinal ou silêncio e
 * uma frase de saúde ("ouvindo · 148 palavras no último minuto"). `warning`
 * diz o que fazer ("Sem áudio dos outros há 45 s — verifique a saída de som").
 * `variant="pill"` vai na casca do app (canto, rodapé); `panel` é o detalhe.
 */
export function LiveRecordingIndicator({
  state,
  startedAt,
  elapsedMs,
  level,
  tracks,
  healthText,
  variant = "pill",
  onPause,
  onResume,
  onStop,
  onOpen,
  onRetry,
  labels,
  className,
}: {
  state: RecordingState;
  /** Início (epoch ms). O cronômetro anda sozinho enquanto grava. */
  startedAt?: number;
  /** Tempo decorrido controlado (ms). Tem prioridade sobre `startedAt`. */
  elapsedMs?: number;
  /** Nível atual 0–1 (mistura das faixas). Sem ele, usa a maior faixa. */
  level?: number;
  tracks?: RecordingTrack[];
  /** "ouvindo · 148 palavras no último minuto" ou o aviso do estado `warning`. */
  healthText?: ReactNode;
  variant?: "pill" | "panel";
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  /** Pílula: clique abre a reunião (ou expande o painel). */
  onOpen?: () => void;
  onRetry?: () => void;
  labels?: Partial<LiveRecordingLabels>;
  className?: string;
}) {
  const l = { ...liveRecordingLabels, ...labels };
  const running = state === "recording" || state === "warning";
  const ms = useElapsed(startedAt, elapsedMs, running);
  const time = formatMoment(ms / 1000);
  const stateLabel = l[state];
  const mix = level ?? (tracks?.length ? Math.max(...tracks.map((t) => t.level)) : 0);
  const canPause = running && onPause;
  const canResume = state === "paused" && onResume;

  const wave = (bars: number, value: number, cls?: string, tone = waveTone[state]) => (
    <Waveform
      level={running ? value : 0}
      active={running}
      processing={state === "processing"}
      bars={bars}
      fade
      barClassName={tone}
      className={cn("h-4 flex-none gap-[2px] [&>span]:w-[2px]", cls)}
    />
  );

  if (variant === "pill") {
    const summary = (
      <>
        <RecordingGlyph state={state} />
        {wave(14, mix, "w-[44px]")}
        <span className="text-[12.5px] font-medium tabular-nums text-ink">{time}</span>
        {(state === "warning" || state === "failed" || state === "processing") && (
          <span className={cn("hidden min-w-0 max-w-[260px] truncate text-[12.5px] sm:inline", state === "warning" ? "text-amber" : "text-muted")}>
            {state === "warning" && healthText ? healthText : stateLabel}
          </span>
        )}
      </>
    );
    return (
      <div
        role="group"
        aria-label={l.ariaLabel(stateLabel, time)}
        className={cn(
          "inline-flex h-10 max-w-full items-center gap-1 rounded-full border bg-popover pl-1 pr-1 shadow-raised",
          state === "warning" ? "border-amber/40" : state === "failed" ? "border-rose/35" : "border-line",
          className,
        )}
      >
        {onOpen ? (
          <button type="button" onClick={onOpen} title={l.open} className="flex h-8 min-w-0 items-center gap-2 rounded-full px-2.5 outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent/40">
            {summary}
          </button>
        ) : (
          <span className="flex h-8 min-w-0 items-center gap-2 px-2.5">{summary}</span>
        )}
        {canPause && (
          <IconButton size="sm" label={l.pause} onClick={onPause} className="rounded-full">
            <Pause />
          </IconButton>
        )}
        {canResume && (
          <IconButton size="sm" label={l.resume} onClick={onResume} className="rounded-full">
            <Mic />
          </IconButton>
        )}
        {state === "failed" && onRetry && (
          <IconButton size="sm" label={l.retry} onClick={onRetry} className="rounded-full">
            <Play />
          </IconButton>
        )}
        {(running || state === "paused") && onStop && (
          <IconButton size="sm" label={l.stop} onClick={onStop} className="rounded-full text-ink">
            <Square className="!h-3 !w-3 fill-current" />
          </IconButton>
        )}
      </div>
    );
  }

  return (
    <section
      aria-label={l.ariaLabel(stateLabel, time)}
      className={cn(
        "min-w-0 rounded-xl border bg-surface",
        state === "warning" ? "border-amber/40" : state === "failed" ? "border-rose/35" : "border-line",
        className,
      )}
    >
      <header className="flex items-center gap-2.5 px-4 pt-3.5">
        <RecordingGlyph state={state} />
        <h3 className="m-0 min-w-0 flex-1 truncate text-[13.5px] font-medium">{stateLabel}</h3>
        <span className="text-[13px] font-medium tabular-nums text-ink-soft">{time}</span>
      </header>
      {tracks && tracks.length > 0 && (
        <ul className="m-0 mt-3 list-none space-y-1 p-0">
          {tracks.map((t) => {
            const Icon = t.id === "mic" ? Mic : Volume2;
            const name = t.label ?? (t.id === "mic" ? l.mic : l.system);
            const silent = running && !t.ok;
            return (
              <li key={t.id} className="flex h-8 items-center gap-2.5 px-4">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", silent ? "text-amber" : "text-muted")} aria-hidden />
                <span className="w-14 shrink-0 truncate text-[12.5px] text-ink">{name}</span>
                {wave(26, t.ok ? t.level : 0, "min-w-0 flex-1", silent ? "bg-amber/60" : waveTone[state])}
                <span className={cn("w-16 shrink-0 text-right text-[11.5px]", silent ? "text-amber" : "text-muted")}>{t.ok ? l.trackOk : l.trackSilent}</span>
              </li>
            );
          })}
        </ul>
      )}
      {healthText && (
        <p role="status" aria-live="polite" className={cn("m-0 mt-2 px-4 text-[12.5px] leading-relaxed", state === "warning" ? "text-amber" : state === "failed" ? "text-rose" : "text-muted")}>
          {healthText}
        </p>
      )}
      <footer className="mt-3 flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
        {canPause && (
          <Button size="sm" variant="ghost" onClick={onPause}>
            <Pause className="h-3.5 w-3.5" aria-hidden /> {l.pause.replace(" gravação", "")}
          </Button>
        )}
        {canResume && (
          <Button size="sm" variant="ghost" onClick={onResume}>
            <Mic className="h-3.5 w-3.5" aria-hidden /> {l.resume.replace(" gravação", "")}
          </Button>
        )}
        {state === "failed" && onRetry && (
          <Button size="sm" onClick={onRetry}>
            {l.retry}
          </Button>
        )}
        {(running || state === "paused") && onStop && (
          <Button size="sm" className="ml-auto" onClick={onStop}>
            {l.stopAndEnhance}
          </Button>
        )}
      </footer>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CallDetectedPrompt                                                   */
/* ------------------------------------------------------------------ */

/** Textos do CallDetectedPrompt. */
export type CallDetectedLabels = {
  title: string;
  /** Recebe o app e, se houver, onde ele roda ("Google Meet", "Chrome"). */
  description: (app: string, host?: string) => string;
  record: string;
  dismiss: string;
  never: (app: string) => string;
};

/** Textos padrão (pt-BR) do CallDetectedPrompt. */
export const callDetectedLabels: CallDetectedLabels = {
  title: "Parece que você entrou numa call",
  description: (app, host) => `${host ? `${app} no ${host}` : app} começou a usar o microfone. Gravar notas desta reunião?`,
  record: "Gravar notas",
  dismiss: "Agora não",
  never: (app) => `Não perguntar para ${app}`,
};

/**
 * Aviso discreto quando outro app (Zoom, Meet, Teams) começa a usar o
 * microfone: oferece gravar notas, sem gravar sozinho. `variant="toast"`
 * flutua (sombra) no canto; `card` fica no fluxo da página de reuniões.
 */
export function CallDetectedPrompt({
  app,
  host,
  icon,
  variant = "card",
  onRecord,
  onDismiss,
  onNever,
  labels,
  className,
}: {
  /** "Google Meet", "Zoom", "Microsoft Teams". */
  app: string;
  /** Onde roda: "Chrome", "Safari". */
  host?: string;
  /** Ícone ou logo do app (16 px). */
  icon?: ReactNode;
  variant?: "card" | "toast";
  onRecord: () => void;
  onDismiss?: () => void;
  /** Mostra "Não perguntar para <app>". */
  onNever?: () => void;
  labels?: Partial<CallDetectedLabels>;
  className?: string;
}) {
  const l = { ...callDetectedLabels, ...labels };
  return (
    <section
      aria-label={l.title}
      className={cn(
        "flex min-w-0 flex-wrap items-start gap-3 rounded-xl border border-line p-3.5 sm:flex-nowrap sm:items-center",
        variant === "toast" ? "max-w-[440px] bg-popover shadow-raised" : "bg-surface",
        className,
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-soft text-ink-soft ring-1 ring-line [&_svg]:h-4 [&_svg]:w-4">{icon ?? <Video aria-hidden />}</span>
      <div className="min-w-0 flex-1 basis-[calc(100%-48px)] sm:basis-auto">
        <p className="m-0 text-[13.5px] font-medium leading-snug text-ink">{l.title}</p>
        <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-muted">{l.description(app, host)}</p>
        {onNever && (
          <button type="button" onClick={onNever} className="ds-hit mt-1 rounded text-[12px] text-muted underline-offset-2 hover:text-ink hover:underline">
            {l.never(app)}
          </button>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pl-12 sm:pl-0">
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            {l.dismiss}
          </Button>
        )}
        <Button size="sm" onClick={onRecord}>
          <Mic className="h-3.5 w-3.5" aria-hidden /> {l.record}
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* MomentCitation                                                       */
/* ------------------------------------------------------------------ */

/** Textos do MomentCitation. */
export type MomentCitationLabels = {
  /** Nome acessível; recebe o horário ("12:04") e, se houver, quem fala. */
  ariaLabel: (time: string, speaker?: string) => string;
  listen: string;
};

/** Textos padrão (pt-BR) do MomentCitation. */
export const momentCitationLabels: MomentCitationLabels = {
  ariaLabel: (time, speaker) => `Ouvir ${time}${speaker ? `, ${speaker}` : ""}`,
  listen: "Clique para ouvir a partir daqui",
};

/**
 * Citação de um momento da reunião ("12:04") ao lado de um bullet da IA.
 * Hover/foco mostra o trecho citado (`turn`); clique chama `onSeek(t)`, que
 * leva o áudio e a transcrição até lá. Diferente do CitationChip (fonte
 * numerada), aponta para tempo, não para documento.
 */
export function MomentCitation({
  t,
  turn,
  onSeek,
  active = false,
  labels,
  className,
}: {
  /** Segundos desde o início da gravação. */
  t: number;
  /** Trecho citado: aparece na prévia. */
  turn?: TranscriptTurn;
  onSeek?: (t: number) => void;
  /** Momento tocando agora. */
  active?: boolean;
  labels?: Partial<MomentCitationLabels>;
  className?: string;
}) {
  const l = { ...momentCitationLabels, ...labels };
  const time = formatMoment(t);
  const chip = (
    <button
      type="button"
      onClick={() => onSeek?.(t)}
      aria-label={l.ariaLabel(time, turn?.speaker.name)}
      className={cn(
        "ds-hit mx-0.5 inline-flex h-[18px] -translate-y-px items-center gap-0.5 rounded px-1 align-middle text-[11px] font-medium tabular-nums ring-1 transition-colors",
        active ? "bg-ink text-on-ink ring-ink" : "bg-soft text-ink-soft ring-line hover:bg-line hover:text-ink",
        className,
      )}
    >
      <Play className="h-2.5 w-2.5 fill-current" aria-hidden />
      {time}
    </button>
  );
  if (!turn) return chip;
  return (
    <HoverCard
      delay={300}
      width={320}
      side="top"
      content={
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Avatar name={turn.speaker.name} initials={turn.speaker.initials} tint={turn.speaker.tint} src={turn.speaker.src} size="xs" />
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{turn.speaker.name}</span>
            <span className="text-[11.5px] tabular-nums text-muted">{formatMoment(turn.start)}</span>
          </div>
          <p className="m-0 mt-2 line-clamp-4 text-[13px] leading-relaxed text-ink-soft">“{turn.text}”</p>
          <p className="m-0 mt-2 text-[11.5px] text-muted">{l.listen}</p>
        </div>
      }
    >
      {chip}
    </HoverCard>
  );
}

/* ------------------------------------------------------------------ */
/* TranscriptView                                                       */
/* ------------------------------------------------------------------ */

/** Textos do TranscriptView. */
export type TranscriptViewLabels = {
  label: string;
  search: string;
  /** Contagem de resultados da busca. */
  matches: (n: number) => string;
  noMatches: string;
  empty: string;
  /** Ao vivo, quando a pessoa rolou para cima. */
  jumpToEnd: string;
  /** Nome acessível do horário; recebe falante e horário. */
  seek: (speaker: string, time: string) => string;
  transcribing: string;
};

/** Textos padrão (pt-BR) do TranscriptView. */
export const transcriptViewLabels: TranscriptViewLabels = {
  label: "Transcrição",
  search: "Buscar na transcrição",
  matches: (n) => (n === 1 ? "1 trecho" : `${n} trechos`),
  noMatches: "Nenhum trecho com esse termo",
  empty: "A transcrição aparece aqui assim que alguém falar.",
  jumpToEnd: "Ir para o fim",
  seek: (speaker, time) => `Ouvir ${speaker} em ${time}`,
  transcribing: "transcrevendo",
};

/**
 * Transcrição por falante (Você · Outros), com horário clicável. Com
 * `currentTime` o trecho em andamento fica marcado e a lista o acompanha;
 * `live` cola no fim enquanto a pessoa não rolar para cima ("Ir para o fim"
 * volta). `query` destaca o termo (sem acento/caixa); com `onQueryChange`
 * aparece o campo de busca. Teclado: Tab percorre os horários.
 */
export function TranscriptView({
  turns,
  currentTime,
  onSeek,
  activeTurnId,
  highlight,
  query = "",
  onQueryChange,
  live = false,
  labels,
  className,
}: {
  turns: TranscriptTurn[];
  /** Posição do áudio (s): marca e acompanha o trecho em andamento. */
  currentTime?: number;
  onSeek?: (t: number) => void;
  /** Força o trecho ativo (tem prioridade sobre `currentTime`). */
  activeTurnId?: string;
  /** Trechos citados em destaque (ex.: ao passar o mouse numa citação). */
  highlight?: string[];
  query?: string;
  /** Com ele, mostra o campo de busca no topo. */
  onQueryChange?: (q: string) => void;
  /** Gravação em andamento: acompanha o fim. */
  live?: boolean;
  labels?: Partial<TranscriptViewLabels>;
  /** Defina a altura aqui (h-full, max-h-80): a lista rola por dentro. */
  className?: string;
}) {
  const l = { ...transcriptViewLabels, ...labels };
  const box = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);
  const activeId = activeTurnId ?? (currentTime != null && !live ? findTurnAt(turns, currentTime)?.id : undefined);
  const q = normalize(query).trim();
  const matchCount = useMemo(() => (q ? turns.filter((t) => normalize(t.text).includes(q)).length : 0), [turns, q]);
  const lastText = turns.length ? turns[turns.length - 1].text : "";

  // Ao vivo: cola no fim enquanto a pessoa não rolou para cima.
  useEffect(() => {
    const el = box.current;
    if (live && pinned && el) el.scrollTop = el.scrollHeight;
  }, [live, pinned, turns.length, lastText]);

  // Reprodução: traz o trecho em andamento para a vista, sem rolar a página.
  useEffect(() => {
    const el = box.current;
    if (!el || !activeId || live) return;
    const item = el.querySelector<HTMLElement>(`[data-turn="${activeId.replace(/["\\]/g, "\\$&")}"]`);
    if (!item) return;
    const top = item.offsetTop;
    if (top < el.scrollTop || top + item.offsetHeight > el.scrollTop + el.clientHeight) el.scrollTop = Math.max(0, top - el.clientHeight / 3);
  }, [activeId, live]);

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col", className)}>
      {onQueryChange && (
        <div className="flex shrink-0 items-center gap-3 pb-2">
          <SearchInput value={query} onChange={onQueryChange} placeholder={l.search} className="min-w-0 flex-1 [&_input]:h-9" />
          {q && (
            <span role="status" className="shrink-0 text-[12px] tabular-nums text-muted">
              {matchCount ? l.matches(matchCount) : l.noMatches}
            </span>
          )}
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        <div
          ref={box}
          role={live ? "log" : undefined}
          aria-live={live ? "polite" : undefined}
          aria-label={l.label}
          tabIndex={-1}
          onScroll={(e) => {
            const el = e.currentTarget;
            const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
            if (atEnd !== pinned) setPinned(atEnd);
          }}
          className="relative h-full overflow-y-auto outline-none"
        >
          {turns.length === 0 ? (
            <p className="m-0 px-3 py-6 text-center text-[13px] text-muted">{l.empty}</p>
          ) : (
            <ol className="m-0 list-none space-y-0.5 p-0">
              {turns.map((turn, i) => {
                const prev = turns[i - 1];
                const same = prev && prev.speaker.name === turn.speaker.name && turn.start - prev.start < 90;
                const active = turn.id === activeId;
                const cited = highlight?.includes(turn.id);
                const time = formatMoment(turn.start);
                return (
                  <li
                    key={turn.id}
                    data-turn={turn.id}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "relative rounded-lg py-1.5 pl-10 pr-3 transition-colors",
                      !same && i > 0 && "mt-2",
                      active ? "bg-soft" : cited ? "bg-accent-soft/50" : undefined,
                    )}
                  >
                    {!same && (
                      <span className="absolute left-3 top-2">
                        <Avatar name={turn.speaker.name} initials={turn.speaker.initials} tint={turn.speaker.tint} src={turn.speaker.src} size="xs" />
                      </span>
                    )}
                    {!same && (
                      <div className="flex items-baseline gap-2">
                        <span className="min-w-0 truncate text-[12.5px] font-medium text-ink">{turn.speaker.name}</span>
                        {turn.speaker.kind === "me" && <span className="sr-only">(microfone)</span>}
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <p className={cn("m-0 min-w-0 flex-1 text-[13.5px] leading-relaxed", turn.partial ? "text-muted" : "text-ink-soft")}>
                        {q ? <Highlight text={turn.text} query={query} /> : turn.text}
                        {turn.partial && <span className="sr-only"> ({l.transcribing})</span>}
                        {turn.partial && <span aria-hidden className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-ink-soft motion-safe:animate-pulse" />}
                      </p>
                      {onSeek ? (
                        <button
                          type="button"
                          onClick={() => onSeek(turn.start)}
                          aria-label={l.seek(turn.speaker.name, time)}
                          className={cn("ds-hit mt-0.5 shrink-0 rounded px-1 text-[11.5px] tabular-nums hover:bg-line hover:text-ink", active ? "text-ink" : "text-muted")}
                        >
                          {time}
                        </button>
                      ) : (
                        <span className="mt-0.5 shrink-0 px-1 text-[11.5px] tabular-nums text-muted">{time}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
        {live && !pinned && (
          <button
            type="button"
            onClick={() => setPinned(true)}
            className="absolute bottom-2 left-1/2 inline-flex h-7 -translate-x-1/2 items-center gap-1 rounded-full bg-popover px-3 text-[12px] font-medium text-ink shadow-raised ring-1 ring-line hover:bg-soft"
          >
            <ArrowDown className="h-3.5 w-3.5" aria-hidden /> {l.jumpToEnd}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AiNotes                                                              */
/* ------------------------------------------------------------------ */

/** Quem escreveu: `me` = a pessoa (durante a call), `ai` = a IA (a partir da transcrição). */
export type NoteAuthor = "me" | "ai";

/** Momento citado por um bullet. `turnId` liga à prévia do trecho. */
export type NoteCitation = { t: number; turnId?: string };

export type NoteItem = {
  id: string;
  text: string;
  author: NoteAuthor;
  citations?: NoteCitation[];
  /** Próximo passo com dono: vira caixa de seleção. */
  task?: { done: boolean; owner?: string };
  children?: NoteItem[];
};

export type NoteSection = { id: string; title: string; author?: NoteAuthor; items: NoteItem[] };

/** Textos do AiNotes e do AiNotesToggle. */
export type AiNotesLabels = {
  mine: string;
  enhanced: string;
  toggle: string;
  legendMe: string;
  legendAi: string;
  emptyMine: string;
  /** Nome acessível da caixa de tarefa; recebe o texto. */
  task: (text: string) => string;
  /** Leitura do autor para quem usa leitor de tela. */
  aiWrote: string;
};

/** Textos padrão (pt-BR) do AiNotes. */
export const aiNotesLabels: AiNotesLabels = {
  mine: "Minhas notas",
  enhanced: "Notas aprimoradas",
  toggle: "Versão das notas",
  legendMe: "Você escreveu",
  legendAi: "A IA completou com a transcrição",
  emptyMine: "Você não escreveu notas durante a reunião. As notas aprimoradas foram feitas só com a transcrição.",
  task: (text) => `Concluir: ${text}`,
  aiWrote: "Escrito pela IA: ",
};

function filterMine(items: NoteItem[]): NoteItem[] {
  return items.filter((i) => i.author === "me").map((i) => ({ ...i, citations: undefined, children: i.children ? filterMine(i.children) : undefined }));
}

/**
 * Notas da reunião com autoria visível: o que a pessoa escreveu fica em
 * tinta (`text-ink`); o que a IA completou fica em tom suave com marcador
 * dourado, e cada bullet da IA leva o momento citado (MomentCitation).
 * `view="mine"` mostra só o que a pessoa escreveu. Dados estruturados
 * (seções → bullets), sem HTML: nada a sanitizar.
 */
export function AiNotes({
  sections,
  view = "enhanced",
  turns,
  onSeek,
  currentTime,
  onToggleTask,
  showLegend = true,
  labels,
  className,
}: {
  sections: NoteSection[];
  view?: "mine" | "enhanced";
  /** Transcrição: as citações mostram o trecho no hover. */
  turns?: TranscriptTurn[];
  onSeek?: (t: number) => void;
  /** Posição do áudio: a citação em andamento fica marcada. */
  currentTime?: number;
  onToggleTask?: (id: string, done: boolean) => void;
  showLegend?: boolean;
  labels?: Partial<AiNotesLabels>;
  className?: string;
}) {
  const l = { ...aiNotesLabels, ...labels };
  const byId = useMemo(() => new Map((turns ?? []).map((t) => [t.id, t])), [turns]);
  const playing = currentTime != null && turns ? findTurnAt(turns, currentTime)?.id : undefined;
  const shown = view === "mine" ? sections.map((s) => ({ ...s, items: filterMine(s.items) })).filter((s) => s.items.length) : sections;

  const renderItems = (items: NoteItem[], depth = 0): ReactNode => (
    <ul className={cn("m-0 list-none p-0", depth > 0 && "mt-0.5 pl-5")}>
      {items.map((item) => {
        const ai = item.author === "ai" && view === "enhanced";
        return (
          <li key={item.id} className="py-[3px]">
            <div className={cn("-mx-2 flex gap-2.5 rounded-md px-2 py-0.5 transition-colors", ai && "hover:bg-accent-soft/50")}>
              {item.task ? (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={item.task.done}
                  aria-label={l.task(item.text)}
                  disabled={!onToggleTask}
                  onClick={() => onToggleTask?.(item.id, !item.task?.done)}
                  className={cn(
                    "ds-hit mt-[5px] grid h-4 w-4 shrink-0 place-items-center rounded ring-1 transition-colors",
                    item.task.done ? "bg-primary text-on-primary ring-primary" : "bg-surface ring-line-strong hover:ring-ink",
                  )}
                >
                  {item.task.done && <Check className="h-3 w-3" aria-hidden />}
                </button>
              ) : (
                <span aria-hidden className={cn("mt-[10px] h-[5px] w-[5px] shrink-0 rounded-full", ai ? "bg-accent" : "bg-ink")} />
              )}
              <p className={cn("m-0 min-w-0 flex-1 text-[15px] leading-[1.6]", ai ? "text-ink-soft" : "text-ink", item.task?.done && "text-muted line-through decoration-line-strong")}>
                {ai && <span className="sr-only">{l.aiWrote}</span>}
                {item.text}
                {item.task?.owner && <span className="ml-1.5 whitespace-nowrap text-[13px] text-muted">· {item.task.owner}</span>}
                {ai &&
                  item.citations?.map((c) => {
                    const turn = c.turnId ? byId.get(c.turnId) : turns ? findTurnAt(turns, c.t) : undefined;
                    return <MomentCitation key={`${c.t}-${c.turnId ?? ""}`} t={c.t} turn={turn} onSeek={onSeek} active={!!turn && turn.id === playing} className="ml-1.5" />;
                  })}
              </p>
            </div>
            {item.children && item.children.length > 0 && renderItems(item.children, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={cn("min-w-0", className)}>
      {showLegend && view === "enhanced" && (
        <p className="m-0 mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-[5px] w-[5px] rounded-full bg-ink" /> {l.legendMe}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-[5px] w-[5px] rounded-full bg-accent" /> {l.legendAi}
          </span>
        </p>
      )}
      {shown.length === 0 ? (
        <p className="m-0 text-[14px] leading-relaxed text-muted">{l.emptyMine}</p>
      ) : (
        <div className="space-y-6">
          {shown.map((s) => (
            <section key={s.id} aria-labelledby={`note-${s.id}`}>
              <h3 id={`note-${s.id}`} className="m-0 mb-1.5 flex items-center gap-1.5 text-[15px] font-semibold text-ink">
                {s.title}
                {s.author === "ai" && view === "enhanced" && <Sparkles className="h-3.5 w-3.5 text-accent-deep" aria-label={l.legendAi} />}
              </h3>
              {renderItems(s.items)}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** Alterna "Minhas notas" e "Notas aprimoradas". */
export function AiNotesToggle({
  value,
  onChange,
  labels,
  className,
}: {
  value: "mine" | "enhanced";
  onChange: (v: "mine" | "enhanced") => void;
  labels?: Partial<AiNotesLabels>;
  className?: string;
}) {
  const l = { ...aiNotesLabels, ...labels };
  return (
    <SegmentedControl
      label={l.toggle}
      value={value}
      onChange={onChange}
      className={className}
      options={[
        { value: "mine", label: l.mine },
        { value: "enhanced", label: l.enhanced, icon: <Sparkles className="h-3.5 w-3.5" aria-hidden /> },
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* MeetingCard                                                          */
/* ------------------------------------------------------------------ */

export type MeetingStatus = "live" | "processing" | "done" | "gaps" | "failed";

/** Textos do MeetingCard. */
export type MeetingCardLabels = Record<Exclude<MeetingStatus, "done">, string> & { open: (title: string) => string };

/** Textos padrão (pt-BR) do MeetingCard. */
export const meetingCardLabels: MeetingCardLabels = {
  live: "Gravando",
  processing: "Gerando notas",
  gaps: "Trechos sem áudio",
  failed: "Gravação falhou",
  open: (title) => `Abrir ${title}`,
};

/**
 * Linha de uma reunião gravada: horário e duração, título, origem (app da
 * call, "Nova reunião"), resumo de uma linha e participantes quando houver.
 * Estado só aparece quando foge do normal (gravando, gerando, com falhas).
 * A linha inteira abre a reunião; `action` fica à direita.
 */
export function MeetingCard({
  title,
  time,
  duration,
  status = "done",
  source,
  snippet,
  attendees,
  action,
  onOpen,
  labels,
  className,
}: {
  title: string;
  /** "14:00". */
  time: string;
  /** "32 min". */
  duration?: string;
  status?: MeetingStatus;
  /** "Google Meet", "Zoom", "Nova reunião". */
  source?: string;
  /** Primeira linha das notas ou do resumo. */
  snippet?: string;
  attendees?: MeetingPerson[];
  action?: ReactNode;
  onOpen?: () => void;
  labels?: Partial<MeetingCardLabels>;
  className?: string;
}) {
  const l = { ...meetingCardLabels, ...labels };
  const badge =
    status === "live" ? (
      <Badge tone="bad" icon={<span className="h-1.5 w-1.5 rounded-full bg-rose motion-safe:animate-pulse" />}>
        {l.live}
      </Badge>
    ) : status === "processing" ? (
      <Badge icon={<LoaderCircle className="motion-safe:animate-spin" />}>{l.processing}</Badge>
    ) : status === "gaps" ? (
      <Badge tone="warn">{l.gaps}</Badge>
    ) : status === "failed" ? (
      <Badge tone="bad">{l.failed}</Badge>
    ) : null;
  const meta = [source, snippet].filter(Boolean).join(" · ");
  return (
    <div className={cn("group relative flex min-w-0 items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-soft", className)}>
      <div className="w-12 shrink-0 text-right">
        <div className="text-[13px] font-medium tabular-nums text-ink">{time}</div>
        {duration && <div className="text-[11.5px] tabular-nums text-muted">{duration}</div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {onOpen ? (
            // g4os-ds-disable-next-line outline-none -- o foco aparece no ::after que cobre a linha inteira (focus-visible:after:ring-2)
            <button type="button" onClick={onOpen} aria-label={l.open(title)} className="min-w-0 truncate rounded text-left text-[14px] font-medium text-ink outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-accent/40">
              {title}
            </button>
          ) : (
            <span className="min-w-0 truncate text-[14px] font-medium text-ink">{title}</span>
          )}
          {badge}
        </div>
        {meta && <p className="m-0 mt-0.5 truncate text-[12.5px] text-muted">{meta}</p>}
      </div>
      {attendees && attendees.length > 0 && <AvatarGroup people={attendees} max={3} size="xs" stacked className="hidden sm:inline-flex" />}
      {action && <div className="relative z-10 shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MeetingHeader                                                        */
/* ------------------------------------------------------------------ */

/** Textos do MeetingHeader. */
export type MeetingHeaderLabels = { share: string; export: string; ask: string; attendees: (names: string[]) => string };

/** Textos padrão (pt-BR) do MeetingHeader. */
export const meetingHeaderLabels: MeetingHeaderLabels = {
  share: "Compartilhar",
  export: "Exportar",
  ask: "Perguntar",
  attendees: (names) => (names.length <= 2 ? names.join(" e ") : `${names.slice(0, 2).join(", ")} e mais ${names.length - 2}`),
};

/**
 * Cabeçalho da página de uma reunião: título, data, duração, participantes,
 * modelo de notas (TemplatePicker) e ações (Perguntar, Exportar,
 * Compartilhar). No celular as ações viram ícones.
 */
export function MeetingHeader({
  title,
  date,
  duration,
  attendees,
  template,
  status,
  onShare,
  onExport,
  onAsk,
  actions,
  labels,
  className,
}: {
  title: string;
  /** "Hoje, 14:00" ou "seg., 6 de out." (já formatado). */
  date: string;
  duration?: string;
  attendees?: MeetingPerson[];
  /** Chip do modelo (TemplatePicker). */
  template?: ReactNode;
  /** Selo de estado (ex.: gravando, gerando notas). */
  status?: ReactNode;
  onShare?: () => void;
  onExport?: () => void;
  onAsk?: () => void;
  /** Substitui as ações padrão. */
  actions?: ReactNode;
  labels?: Partial<MeetingHeaderLabels>;
  className?: string;
}) {
  const l = { ...meetingHeaderLabels, ...labels };
  const defaultActions = (
    <>
      <div className="hidden items-center gap-1.5 sm:flex">
        {onAsk && (
          <Button size="sm" variant="ghost" onClick={onAsk}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> {l.ask}
          </Button>
        )}
        {onExport && (
          <Button size="sm" variant="ghost" onClick={onExport}>
            <Download className="h-3.5 w-3.5" aria-hidden /> {l.export}
          </Button>
        )}
        {onShare && (
          <Button size="sm" onClick={onShare}>
            <Share2 className="h-3.5 w-3.5" aria-hidden /> {l.share}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-0.5 sm:hidden">
        {onAsk && (
          <IconButton label={l.ask} onClick={onAsk}>
            <Sparkles />
          </IconButton>
        )}
        {onExport && (
          <IconButton label={l.export} onClick={onExport}>
            <Download />
          </IconButton>
        )}
        {onShare && (
          <IconButton label={l.share} onClick={onShare}>
            <Share2 />
          </IconButton>
        )}
      </div>
    </>
  );
  return (
    <header className={cn("min-w-0", className)}>
      <div className="flex items-start gap-3">
        <h1 className="m-0 min-w-0 flex-1 text-[24px] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
        <div className="shrink-0 pt-0.5">{actions ?? defaultActions}</div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {date}
        </span>
        {duration && (
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {duration}
          </span>
        )}
        {attendees && attendees.length > 0 && (
          <span className="inline-flex min-w-0 items-center gap-2">
            <AvatarGroup people={attendees} max={4} size="xs" stacked />
            <span className="truncate">{l.attendees(attendees.map((a) => a.name.split(" ")[0]))}</span>
          </span>
        )}
        {template}
        {status}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* TemplatePicker                                                       */
/* ------------------------------------------------------------------ */

/** Modelo de notas: as seções que a IA preenche. */
export type MeetingTemplate = { id: string; name: string; description?: string; sections: string[] };

/** Modelos padrão (pt-BR). */
export const meetingTemplates: MeetingTemplate[] = [
  { id: "geral", name: "Reunião geral", description: "Para qualquer conversa: o que foi dito, decidido e quem faz o quê.", sections: ["Contexto", "Pontos discutidos", "Decisões", "Próximos passos"] },
  { id: "1-1", name: "1:1", description: "Conversa recorrente com uma pessoa do time.", sections: ["Como está", "Prioridades", "Bloqueios", "Feedback", "Combinados"] },
  { id: "vendas", name: "Vendas / discovery", description: "Primeira conversa com um cliente em potencial.", sections: ["Contexto do cliente", "Dores", "Orçamento e prazo", "Quem decide", "Próximos passos"] },
  { id: "entrevista", name: "Entrevista", description: "Entrevista de candidato, com evidências por critério.", sections: ["Perfil", "Experiência relevante", "Pontos fortes", "Pontos de atenção", "Recomendação"] },
  { id: "daily", name: "Daily", description: "Encontro rápido do time.", sections: ["Ontem", "Hoje", "Bloqueios"] },
];

/** Textos do TemplatePicker. */
export type TemplatePickerLabels = { trigger: string; title: string; preview: string };

/** Textos padrão (pt-BR) do TemplatePicker. */
export const templatePickerLabels: TemplatePickerLabels = {
  trigger: "Modelo de notas",
  title: "Modelo de notas",
  preview: "Seções que a IA preenche",
};

/**
 * Escolhe o modelo de notas de uma reunião. Chip pequeno que abre a lista
 * com prévia das seções. Trocar o modelo reorganiza as notas aprimoradas;
 * o que a pessoa escreveu continua.
 */
export function TemplatePicker({
  value,
  onChange,
  templates = meetingTemplates,
  align = "start",
  labels,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  templates?: MeetingTemplate[];
  align?: "start" | "center" | "end";
  labels?: Partial<TemplatePickerLabels>;
  className?: string;
}) {
  const l = { ...templatePickerLabels, ...labels };
  const [open, setOpen] = useState(false);
  const current = templates.find((t) => t.id === value) ?? templates[0];
  const [previewId, setPreviewId] = useState(current?.id);
  const preview = templates.find((t) => t.id === previewId) ?? current;
  return (
    <BasePopover.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setPreviewId(current?.id);
      }}
    >
      <BasePopover.Trigger
        aria-label={`${l.trigger}: ${current?.name ?? ""}`}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-ink-soft outline-none ring-1 ring-line hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent/40 data-popup-open:bg-soft",
          className,
        )}
      >
        <LayoutTemplate className="h-3.5 w-3.5 text-muted" aria-hidden />
        {current?.name}
        <ChevronDown className="h-3 w-3 text-muted" aria-hidden />
      </BasePopover.Trigger>
      <BasePopover.Portal>
        <BasePopover.Positioner side="bottom" align={align} sideOffset={6} collisionPadding={12} className="z-[100]">
          <BasePopover.Popup className={cn(popupClass, "w-[460px] max-w-[calc(100vw-16px)] overflow-hidden p-0")}>
            <BasePopover.Title className="m-0 border-b border-line px-4 py-2.5 text-[13px] font-semibold">{l.title}</BasePopover.Title>
            <div className="grid sm:grid-cols-[190px_1fr]">
              <div className="flex flex-col gap-0.5 p-1.5 sm:border-r sm:border-line" role="group" aria-label={l.title}>
                {templates.map((t) => {
                  const on = t.id === current?.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onMouseEnter={() => setPreviewId(t.id)}
                      onFocus={() => setPreviewId(t.id)}
                      onClick={() => {
                        onChange(t.id);
                        setOpen(false);
                      }}
                      className={cn("flex h-8 items-center gap-2 rounded-md px-2.5 text-left text-[13px] outline-none hover:bg-soft focus-visible:bg-soft", on ? "font-medium text-ink" : "text-ink-soft")}
                    >
                      <span className="min-w-0 flex-1 truncate">{t.name}</span>
                      {on && <Check className="h-3.5 w-3.5 text-ink" aria-hidden />}
                    </button>
                  );
                })}
              </div>
              {preview && (
                <div className="hidden min-w-0 px-4 py-3 sm:block" aria-live="polite">
                  <p className="m-0 text-[13px] font-medium text-ink">{preview.name}</p>
                  {preview.description && <p className="m-0 mt-1 text-[12px] leading-snug text-muted">{preview.description}</p>}
                  <p className="m-0 mt-3 text-[11.5px] text-muted">{l.preview}</p>
                  <ul className="m-0 mt-1.5 list-none space-y-1 p-0">
                    {preview.sections.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                        <span aria-hidden className="h-px w-2.5 bg-line-strong" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

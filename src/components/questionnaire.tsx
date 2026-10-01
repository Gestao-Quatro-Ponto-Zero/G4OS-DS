"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "../lib/cn";
import { Button, Kbd, Meter } from "./primitives";

/*
 * Questionnaire: perguntas uma de cada vez (equivalente ao Questionnaire do
 * shadcn/ui). Escolha única, múltipla, resposta livre, perguntas puladas e
 * condicionais. Bom para o agente pedir esclarecimentos, pesquisas curtas,
 * triagem e qualificação. Formulário de cadastro continua sendo formulário.
 */

export type QuestionnaireChoice = { value: string; label: string; description?: string };

export type QuestionnaireQuestion = {
  /** Chave da resposta. */
  name: string;
  /** A pergunta (vira a legenda do grupo). */
  prompt: string;
  description?: string;
  choices?: QuestionnaireChoice[];
  /** Permite marcar várias opções. */
  multiple?: boolean;
  /** Resposta livre. Junto com `choices`, vira "Outra resposta". */
  input?: boolean | { placeholder?: string; multiline?: boolean; label?: string };
  /** Sem `required`, aparece "Pular". */
  required?: boolean;
  /** Só aparece quando retorna true (perguntas condicionais). */
  when?: (answers: QuestionnaireAnswers) => boolean;
};

/** Resposta de uma pergunta; `null` = pulada. */
export type QuestionnaireAnswer = { choices: string[]; text: string } | null;
export type QuestionnaireAnswers = Record<string, QuestionnaireAnswer>;

const empty = { choices: [] as string[], text: "" };
const answered = (a: QuestionnaireAnswer | undefined) => !!a && (a.choices.length > 0 || a.text.trim() !== "");

/**
 * Perguntas uma por vez, com progresso, atalhos numéricos (1–9 marcam opções),
 * Voltar/Pular/Próxima e perguntas condicionais. `defaultAnswers` +
 * `defaultStep` retomam de onde a pessoa parou; `onChange` permite salvar o
 * rascunho. `onSubmit` recebe só as perguntas visíveis.
 */
export function Questionnaire({
  items,
  onSubmit,
  onCancel,
  onChange,
  title,
  submitLabel = "Enviar respostas",
  defaultAnswers,
  defaultStep = 0,
  shortcuts = true,
  className,
}: {
  items: QuestionnaireQuestion[];
  onSubmit: (answers: QuestionnaireAnswers) => void;
  /** Mostra "Cancelar" na primeira pergunta. */
  onCancel?: () => void;
  /** Rascunho a cada mudança (para retomar depois). */
  onChange?: (answers: QuestionnaireAnswers, step: number) => void;
  /** Título acima das perguntas ("Antes de começar"). */
  title?: string;
  submitLabel?: string;
  defaultAnswers?: QuestionnaireAnswers;
  defaultStep?: number;
  shortcuts?: boolean;
  className?: string;
}) {
  const uid = useId();
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(defaultAnswers ?? {});
  const visible = useMemo(() => items.filter((q) => !q.when || q.when(answers)), [items, answers]);
  const [step, setStep] = useState(Math.min(defaultStep, Math.max(0, visible.length - 1)));
  const [error, setError] = useState<string | null>(null);
  const legendRef = useRef<HTMLLegendElement>(null);
  const firstRender = useRef(true);
  const q = visible[Math.min(step, visible.length - 1)];
  const a = (q && answers[q.name]) || empty;
  const last = step >= visible.length - 1;
  const input = q?.input ? (q.input === true ? {} : q.input) : null;

  // Foco vai para a pergunta nova (leitor de tela lê a legenda).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    legendRef.current?.focus();
  }, [step]);

  if (!q) return null;

  const update = (next: QuestionnaireAnswer) => {
    const all = { ...answers, [q.name]: next };
    setAnswers(all);
    setError(null);
    onChange?.(all, step);
  };
  const toggle = (value: string) => {
    const has = a.choices.includes(value);
    update({ ...a, choices: q.multiple ? (has ? a.choices.filter((v) => v !== value) : [...a.choices, value]) : has ? [] : [value] });
  };
  const visibleAnswers = (all: QuestionnaireAnswers) => {
    const vis = items.filter((x) => !x.when || x.when(all));
    return Object.fromEntries(vis.map((x) => [x.name, all[x.name] ?? null]));
  };
  const goNext = (skip = false) => {
    if (!skip && q.required && !answered(answers[q.name])) {
      setError(q.choices?.length ? (input ? "Escolha uma opção ou escreva sua resposta." : "Escolha uma opção para continuar.") : "Escreva sua resposta para continuar.");
      return;
    }
    const all = skip ? { ...answers, [q.name]: null } : answers;
    if (skip) setAnswers(all);
    if (last) {
      onSubmit(visibleAnswers(all));
      return;
    }
    setStep((s) => s + 1);
    onChange?.(all, step + 1);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLFieldSetElement>) => {
    const typing = (e.target as HTMLElement).matches("input[type=text], textarea");
    if (shortcuts && !typing && q.choices && /^[1-9]$/.test(e.key)) {
      const c = q.choices[Number(e.key) - 1];
      if (c) {
        e.preventDefault();
        toggle(c.value);
      }
    }
    if (e.key === "Enter" && !e.shiftKey && (e.target as HTMLElement).tagName !== "TEXTAREA" && (e.target as HTMLElement).tagName !== "BUTTON") {
      e.preventDefault();
      goNext();
    }
  };

  const pct = ((step + 1) / visible.length) * 100;
  return (
    <div className={cn("rounded-xl border border-line bg-surface p-5 sm:p-6", className)}>
      <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
        <span>{title ?? "Perguntas"}</span>
        <span className="tabular-nums">
          {step + 1} de {visible.length}
        </span>
      </div>
      <div className="mt-2">
        <Meter value={pct} label={`Pergunta ${step + 1} de ${visible.length}`} />
      </div>

      <fieldset key={q.name} className="m-0 mt-5 min-w-0 border-0 p-0" onKeyDown={onKeyDown} aria-describedby={error ? `${uid}-err` : undefined}>
        <legend ref={legendRef} tabIndex={-1} className="m-0 p-0 text-[18px] font-semibold leading-snug tracking-tight text-ink outline-none">
          {q.prompt}
          {q.required && <span className="sr-only"> (obrigatória)</span>}
        </legend>
        {q.description && <p className="m-0 mt-1.5 text-[13.5px] leading-relaxed text-muted">{q.description}</p>}

        {q.choices && q.choices.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {q.choices.map((c, i) => {
              const on = a.choices.includes(c.value);
              return (
                <label
                  key={c.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40",
                    on ? "border-primary bg-soft" : "border-line hover:border-line-strong hover:bg-soft/60",
                  )}
                >
                  <input
                    type={q.multiple ? "checkbox" : "radio"}
                    name={`${uid}-${q.name}`}
                    value={c.value}
                    checked={on}
                    onChange={() => toggle(c.value)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center border text-on-primary",
                      q.multiple ? "rounded-[5px]" : "rounded-full",
                      on ? "border-primary bg-primary" : "border-line-strong bg-surface",
                    )}
                  >
                    {on && (q.multiple ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-on-primary" />)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium text-ink">{c.label}</span>
                    {c.description && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{c.description}</span>}
                  </span>
                  {shortcuts && i < 9 && (
                    <span className="hidden shrink-0 sm:inline-flex" aria-hidden>
                      <Kbd>{i + 1}</Kbd>
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}

        {input && (
          <div className="mt-3">
            <label htmlFor={`${uid}-text`} className={cn("mb-1.5 block text-[12.5px] font-medium text-ink", !q.choices?.length && "sr-only")}>
              {input.label ?? (q.choices?.length ? "Outra resposta" : q.prompt)}
            </label>
            {input.multiline ? (
              <textarea
                id={`${uid}-text`}
                rows={3}
                value={a.text}
                placeholder={input.placeholder}
                onChange={(e) => update({ ...a, text: e.target.value })}
                className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[14px] leading-relaxed text-ink placeholder:text-muted"
              />
            ) : (
              <input
                id={`${uid}-text`}
                type="text"
                value={a.text}
                placeholder={input.placeholder}
                onChange={(e) => update({ ...a, text: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-muted"
              />
            )}
          </div>
        )}

        {error && (
          <p id={`${uid}-err`} role="alert" className="m-0 mt-3 text-[12.5px] text-rose">
            {error}
          </p>
        )}
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {step > 0 ? (
          <Button variant="quiet" size="sm" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft aria-hidden /> Voltar
          </Button>
        ) : (
          onCancel && (
            <Button variant="quiet" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          )
        )}
        <div className="ml-auto flex items-center gap-2">
          {!q.required && (
            <Button variant="ghost" size="sm" onClick={() => goNext(true)}>
              Pular
            </Button>
          )}
          <Button size="sm" onClick={() => goNext()}>
            {last ? submitLabel : "Próxima"}
          </Button>
        </div>
      </div>
    </div>
  );
}

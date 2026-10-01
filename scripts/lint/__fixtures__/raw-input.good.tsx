import { TextareaField, TextField, areaClass } from "@g4ai/ds";
export function A({ v, set }: { v: string; set: (v: string) => void }) {
  return (
    <>
      <TextareaField label="Justificativa" value={v} onChange={set} />
      <TextField label="Nome" value={v} onChange={set} />
      {/* campo nu dentro de casca própria (busca do marketplace) */}
      <input aria-label="Buscar" value={v} onChange={(e) => set(e.target.value)} className="ds-bare min-w-0 flex-1 bg-transparent" />
      <textarea aria-label="Comentário" className={areaClass} />
      <input type="hidden" name="id" value="1" />
      <input type="file" aria-label="Anexo" />
    </>
  );
}

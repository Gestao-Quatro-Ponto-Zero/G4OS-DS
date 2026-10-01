// expect 3
export function A({ v, set }: { v: string; set: (v: string) => void }) {
  return (
    <>
      <label htmlFor="j">Justificativa</label>
      <textarea id="j" value={v} onChange={(e) => set(e.target.value)} />
      <input aria-label="Nome" value={v} onChange={(e) => set(e.target.value)} />
      <input type="checkbox" aria-label="Ativo" />
    </>
  );
}

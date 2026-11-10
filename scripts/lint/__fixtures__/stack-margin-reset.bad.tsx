// expect 3
export function A({ note }: { note?: string }) {
  return (
    <section className="space-y-6">
      <h2 className="m-0 text-[18px] font-semibold">Instalação</h2>
      <p className="m-0 text-[13.5px] text-ink-soft">Rode o comando abaixo.</p>
      {note && <p className={note ? "mb-0 text-muted" : "text-muted"}>{note}</p>}
      <p className="m-0 text-muted">Último parágrafo: sem irmão depois.</p>
    </section>
  );
}

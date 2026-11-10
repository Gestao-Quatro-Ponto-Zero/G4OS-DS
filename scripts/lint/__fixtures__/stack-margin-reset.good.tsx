export function A() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="m-0 text-[18px] font-semibold">Instalação</h2>
      <p className="m-0 text-[13.5px] text-ink-soft">Rode o comando abaixo.</p>
      <div className="space-y-3">
        <p className="text-ink-soft">Sem m-0, o espaço vale.</p>
        <div>
          <p className="m-0">Neto, não filho: a margem dele não disputa com o space-y.</p>
        </div>
        <p className="mt-0 text-ink-soft">mt-0 não mexe no espaço de baixo.</p>
        <p className="m-0 text-muted">Último filho.</p>
      </div>
      <div className="space-y-0">
        <p className="m-0">Sem espaço pedido.</p>
        <p className="m-0">Nada a perder.</p>
      </div>
    </section>
  );
}

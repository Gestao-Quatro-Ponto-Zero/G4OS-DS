export const A = ({ tint }: { tint: string }) => (
  <div className="bg-surface bg-[var(--ds-backdrop,rgb(0_0_0/0.2))]" style={{ color: "var(--ds-ink)" }}>
    <svg><path fill="url(#grad)" /></svg>
    <span style={{ background: tint }} />
  </div>
);

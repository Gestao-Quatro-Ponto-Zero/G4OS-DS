// ds-audit-ignore white-black: painel escuro de propósito
export const A = () => <div className="bg-white" />;
export const B = () => <div className="bg-white" />; // g4os-ds-disable-line white-black -- motivo
// g4os-ds-disable-next-line white-black, tailwind-palette -- motivo
export const C = () => <div className="bg-white text-gray-500" />;
/* g4os-ds-disable hex-color -- logo de terceiro */
export const D = () => <svg><path fill="#ff0000" /><path fill="#00ff00" /></svg>;
/* g4os-ds-enable */
export const E = () => (
  <div>
    {/* ds-audit-ignore-start * : bloco inteiro */}
    <span className="bg-black text-white" />
    {/* ds-audit-ignore-end */}
  </div>
);

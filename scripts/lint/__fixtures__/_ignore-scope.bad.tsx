// expect 2
// g4os-ds-disable-next-line white-black -- só a próxima linha
export const A = () => <div className="bg-white" />;
export const B = () => <div className="bg-white" />;
/* g4os-ds-disable white-black */
export const C = () => <div className="bg-white" />;
/* g4os-ds-enable */
export const D = () => <div className="bg-white" />;

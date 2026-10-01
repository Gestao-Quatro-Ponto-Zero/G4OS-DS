// expect 2
export const A = ({ open }: { open: () => void }) => (
  <>
    <div onClick={open}>Abrir</div>
    <span role="button" onClick={open}>Abrir</span>
  </>
);

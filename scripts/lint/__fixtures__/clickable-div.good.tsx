import { useRef } from "react";
export const A = ({ open }: { open: () => void }) => {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <div role="button" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === "Enter" && open()}>Abrir</div>
      <div aria-hidden onClick={open} />
      <div onClick={() => input.current?.focus()}>
        <input aria-label="x" ref={input} />
      </div>
      <td onClick={(e) => e.stopPropagation()} />
      <div role="option" aria-selected onClick={open} />
      <button type="button" onClick={open}>Abrir</button>
    </>
  );
};

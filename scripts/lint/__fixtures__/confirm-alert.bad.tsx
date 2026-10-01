// expect 3
export function remove() {
  if (window.confirm("Excluir?")) alert("Excluído");
  const nome = prompt("Nome?");
  return nome;
}

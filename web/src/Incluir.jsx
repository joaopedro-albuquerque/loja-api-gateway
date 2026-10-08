import { useState } from "react";

export default function Incluir({ onCriar }) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");

  return (
    <section className="mx-auto max-w-lg rounded bg-white p-6">
      <h1 className="text-2xl font-medium">Incluir produto</h1>
      <p className="mt-1 text-sm text-[#565959]">Só a conta do grupo admin grava no catálogo.</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const ok = await onCriar(nome, preco);
          if (ok) {
            setNome("");
            setPreco("");
          }
        }}
      >
        <label className="block text-sm font-bold">
          Nome
          <input
            className="mt-1 w-full rounded border px-3 py-2 font-normal"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-bold">
          Preço
          <input
            className="mt-1 w-full rounded border px-3 py-2 font-normal"
            type="number"
            min="0.01"
            step="0.01"
            value={preco}
            onChange={(event) => setPreco(event.target.value)}
            required
          />
        </label>
        <button className="rounded-full bg-[#ffd814] px-4 py-2 text-sm hover:bg-[#f7ca00]" type="submit">
          Incluir no catálogo
        </button>
      </form>
    </section>
  );
}

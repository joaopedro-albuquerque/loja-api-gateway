import { useState } from "react";

export default function Incluir({ produtos, onCriar, onAjustarEstoque }) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <section className="rounded bg-white p-6">
        <h1 className="text-2xl font-medium">Incluir produto</h1>
        <p className="mt-1 text-sm text-[#565959]">Só a conta do grupo admin grava no catálogo.</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const ok = await onCriar(nome, preco, estoque);
            if (ok) {
              setNome("");
              setPreco("");
              setEstoque("");
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
          <label className="block text-sm font-bold">
            Estoque inicial
            <input
              className="mt-1 w-full rounded border px-3 py-2 font-normal"
              type="number"
              min="0"
              step="1"
              value={estoque}
              onChange={(event) => setEstoque(event.target.value)}
              required
            />
          </label>
          <button className="rounded-full bg-[#ffd814] px-4 py-2 text-sm hover:bg-[#f7ca00]" type="submit">
            Incluir no catálogo
          </button>
        </form>
      </section>

      <section className="rounded bg-white p-6">
        <h2 className="text-xl font-medium">Ajustar estoque</h2>
        <p className="mt-1 text-sm text-[#565959]">Informe a quantidade disponível de cada produto.</p>
        {produtos.length === 0 ? (
          <p className="mt-4 text-sm">Nenhum produto no catálogo.</p>
        ) : (
          <ul className="mt-4 divide-y">
            {produtos.map((produto) => (
              <LinhaEstoque key={produto.id} produto={produto} onSalvar={onAjustarEstoque} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function LinhaEstoque({ produto, onSalvar }) {
  const [valor, setValor] = useState(String(produto.estoque ?? 0));
  const alterado = valor !== String(produto.estoque ?? 0);

  return (
    <li>
      <form
        className="flex items-center gap-3 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSalvar(produto, valor);
        }}
      >
        <span className="flex-1 text-sm">{produto.nome}</span>
        <input
          className="w-24 rounded border px-2 py-1 text-sm"
          type="number"
          min="0"
          step="1"
          aria-label={`Estoque de ${produto.nome}`}
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          required
        />
        <button
          className="rounded-full border px-3 py-1 text-sm hover:bg-[#f7fafa] disabled:opacity-50"
          type="submit"
          disabled={!alterado}
        >
          Salvar
        </button>
      </form>
    </li>
  );
}

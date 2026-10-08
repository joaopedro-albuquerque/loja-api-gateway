import { reais } from "./moeda";

export default function Carrinho({ itens, produtos, total, onComprar, onLimpar }) {
  const quantidade = itens.reduce((soma, item) => soma + Number(item.qtd), 0);

  if (itens.length === 0) {
    return (
      <section className="rounded bg-white px-6 py-10">
        <h1 className="text-2xl font-medium">Seu carrinho está vazio</h1>
        <p className="mt-1 text-sm text-[#565959]">Os produtos adicionados aparecem aqui.</p>
        <button
          className="mt-4 rounded-full bg-[#ffd814] px-4 py-2 text-sm hover:bg-[#f7ca00]"
          onClick={onComprar}
        >
          Ver produtos
        </button>
      </section>
    );
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_18rem]">
      <section className="rounded bg-white p-4">
        <h1 className="mb-4 text-2xl font-medium">Carrinho</h1>
        <ul className="divide-y">
          {itens.map((item) => {
            const produto = produtos.find((atual) => String(atual.id) === String(item.produtoId));
            const nome = produto ? produto.nome : `Produto ${item.produtoId}`;
            return (
              <li key={item.produtoId} className="flex gap-4 py-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded bg-[#f3f3f3] text-2xl font-semibold text-[#0f1111]/50">
                  {nome.slice(0, 1)}
                </div>
                <div>
                  <p className="font-medium">{nome}</p>
                  <p className="text-sm text-[#565959]">Qtd {item.qtd}</p>
                  <p className="mt-1 font-medium">{reais(item.preco)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <aside className="rounded bg-white p-4">
        <p className="text-lg">
          {`Subtotal (${quantidade} ${quantidade === 1 ? "item" : "itens"}): `}
          <span className="font-bold">{reais(total)}</span>
        </p>
        <button
          className="mt-4 w-full rounded-full border px-3 py-2 text-sm hover:bg-[#f7fafa]"
          onClick={onLimpar}
        >
          Limpar carrinho
        </button>
      </aside>
    </div>
  );
}

import { reais } from "./moeda";

const CORES = ["#c9e6ff", "#ffe7c2", "#d8f3dc", "#f8d7da", "#e7d4ff", "#fff3bf"];

export default function Loja({ produtos, busca, onAdicionar }) {
  const termo = busca.trim().toLowerCase();
  const visiveis = termo
    ? produtos.filter((produto) => produto.nome.toLowerCase().includes(termo))
    : produtos;

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded bg-gradient-to-r from-[#1b3a4b] to-[#3d5a80] px-6 py-8 text-white">
        <p className="text-sm text-white/80">Catálogo</p>
        <h1 className="mt-1 text-3xl font-semibold">Produtos para o seu carrinho</h1>
      </section>

      <section className="rounded bg-white p-4">
        <h2 className="mb-4 text-xl font-bold">
          {termo ? `Resultados para “${busca.trim()}”` : "Destaques"}
        </h2>
        {visiveis.length === 0 ? (
          <p>Nenhum produto com esse nome.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {visiveis.map((produto) => (
              <article key={produto.id} className="flex flex-col">
                <div
                  className="mb-3 flex h-36 items-center justify-center rounded text-4xl font-semibold text-[#0f1111]/70"
                  style={{ background: CORES[Number(produto.id) % CORES.length] }}
                >
                  {produto.nome.slice(0, 1)}
                </div>
                <h3 className="line-clamp-2 text-sm">{produto.nome}</h3>
                <p className="mt-1 text-lg font-medium">{reais(produto.preco)}</p>
                {produto.estoque > 0 ? (
                  <p className="text-xs text-[#067d62]">Em estoque: {produto.estoque}</p>
                ) : (
                  <p className="text-xs font-bold text-[#c40000]">Esgotado</p>
                )}
                <button
                  className="mt-3 rounded-full bg-[#ffd814] px-3 py-1.5 text-sm hover:bg-[#f7ca00] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#ffd814]"
                  disabled={!(produto.estoque > 0)}
                  onClick={() => onAdicionar(produto)}
                >
                  {produto.estoque > 0 ? "Adicionar ao carrinho" : "Indisponível"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

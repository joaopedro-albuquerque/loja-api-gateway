import { token } from "./auth";

const BASE = import.meta.env.VITE_API_BASE;

function cabecalhos() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  };
}

async function ler(resposta) {
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(dados.erro || dados.message || `Erro ${resposta.status}`);
  }
  return dados;
}

export async function listarProdutos() {
  const resposta = await fetch(`${BASE}/produtos`, { headers: cabecalhos() });
  return ler(resposta);
}

export async function lerCarrinho() {
  const resposta = await fetch(`${BASE}/carrinho`, { headers: cabecalhos() });
  return ler(resposta);
}

export async function adicionarAoCarrinho(produto) {
  const resposta = await fetch(`${BASE}/carrinho`, {
    method: "POST",
    headers: cabecalhos(),
    body: JSON.stringify({
      produtoId: String(produto.id),
      qtd: 1,
      preco: produto.preco,
    }),
  });
  return ler(resposta);
}

export async function limparCarrinho() {
  const resposta = await fetch(`${BASE}/carrinho`, {
    method: "DELETE",
    headers: cabecalhos(),
  });
  return ler(resposta);
}

export async function criarProduto(nome, preco) {
  const resposta = await fetch(`${BASE}/produtos`, {
    method: "POST",
    headers: cabecalhos(),
    body: JSON.stringify({ nome, preco: Number(preco) }),
  });
  return ler(resposta);
}

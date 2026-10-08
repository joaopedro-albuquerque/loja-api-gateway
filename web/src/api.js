import { expirado, renovar, token } from "./auth";

const BASE = import.meta.env.VITE_API_BASE;

export class SessaoExpirada extends Error {
  constructor() {
    super("Sua sessão expirou. Faça login novamente.");
    this.name = "SessaoExpirada";
  }
}

function cabecalhos() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  };
}

async function renovarOuFalhar() {
  try {
    await renovar();
  } catch {
    throw new SessaoExpirada();
  }
}

async function requisitar(caminho, opcoes = {}) {
  if (expirado()) await renovarOuFalhar();
  let resposta = await fetch(`${BASE}${caminho}`, { ...opcoes, headers: cabecalhos() });
  if (resposta.status === 401) {
    await renovarOuFalhar();
    resposta = await fetch(`${BASE}${caminho}`, { ...opcoes, headers: cabecalhos() });
    if (resposta.status === 401) throw new SessaoExpirada();
  }
  return ler(resposta);
}

async function ler(resposta) {
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(dados.erro || dados.message || `Erro ${resposta.status}`);
  }
  return dados;
}

export function listarProdutos() {
  return requisitar("/produtos");
}

export function lerCarrinho() {
  return requisitar("/carrinho");
}

export function adicionarAoCarrinho(produto) {
  return requisitar("/carrinho", {
    method: "POST",
    body: JSON.stringify({
      produtoId: String(produto.id),
      qtd: 1,
      preco: produto.preco,
    }),
  });
}

export function limparCarrinho() {
  return requisitar("/carrinho", { method: "DELETE" });
}

export function criarProduto(nome, preco) {
  return requisitar("/produtos", {
    method: "POST",
    body: JSON.stringify({ nome, preco: Number(preco) }),
  });
}

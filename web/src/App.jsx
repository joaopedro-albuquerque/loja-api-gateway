import { useEffect, useState } from "react";
import Carrinho from "./Carrinho";
import Incluir from "./Incluir";
import Layout from "./Layout";
import Login from "./Login";
import Loja from "./Loja";
import {
  adicionarAoCarrinho,
  atualizarEstoque,
  criarProduto,
  lerCarrinho,
  limparCarrinho,
  listarProdutos,
  SessaoExpirada,
} from "./api";
import { ehAdmin, sair, token, usuarioNaTela } from "./auth";

export default function App() {
  const [logado, setLogado] = useState(Boolean(token()));
  const [pagina, setPagina] = useState("inicio");
  const [busca, setBusca] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState({ itens: [], total: 0 });
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [motivoLogin, setMotivoLogin] = useState("");

  async function carregar() {
    const [catalogo, sacola] = await Promise.all([listarProdutos(), lerCarrinho()]);
    setProdutos(catalogo.produtos);
    setCarrinho(sacola);
  }

  useEffect(() => {
    if (!logado) return;
    carregar().catch(tratarErro);
  }, [logado]);

  function sairDaConta() {
    sair();
    setLogado(false);
    setPagina("inicio");
    setProdutos([]);
    setCarrinho({ itens: [], total: 0 });
    setErro("");
    setAviso("");
  }

  function tratarErro(e) {
    if (e instanceof SessaoExpirada) {
      sairDaConta();
      setMotivoLogin(e.message);
      return;
    }
    setErro(e.message);
  }

  if (!logado) {
    return (
      <Login
        mensagem={motivoLogin}
        onOk={() => {
          setMotivoLogin("");
          setLogado(true);
        }}
      />
    );
  }

  const admin = ehAdmin();
  const quantidade = carrinho.itens.reduce((soma, item) => soma + Number(item.qtd), 0);

  async function porNoCarrinho(produto) {
    setErro("");
    setAviso("");
    try {
      setCarrinho(await adicionarAoCarrinho(produto));
      setAviso(`${produto.nome} foi para o carrinho.`);
    } catch (e) {
      tratarErro(e);
    }
  }

  async function limpar() {
    setErro("");
    setAviso("");
    try {
      setCarrinho(await limparCarrinho());
    } catch (e) {
      tratarErro(e);
    }
  }

  async function incluir(nome, preco, estoque) {
    setErro("");
    setAviso("");
    try {
      await criarProduto(nome, preco, estoque);
      await carregar();
      setAviso(`${nome} entrou no catálogo.`);
      setPagina("inicio");
      return true;
    } catch (e) {
      tratarErro(e);
      return false;
    }
  }

  async function ajustarEstoque(produto, estoque) {
    setErro("");
    setAviso("");
    try {
      const atualizado = await atualizarEstoque(produto.id, estoque);
      setProdutos((lista) =>
        lista.map((atual) => (atual.id === atualizado.id ? atualizado : atual)),
      );
      setAviso(`Estoque de ${atualizado.nome} agora é ${atualizado.estoque}.`);
    } catch (e) {
      tratarErro(e);
    }
  }

  let miolo = (
    <Loja produtos={produtos} busca={busca} onAdicionar={porNoCarrinho} />
  );
  if (pagina === "carrinho") {
    miolo = (
      <Carrinho
        itens={carrinho.itens}
        produtos={produtos}
        total={carrinho.total}
        onComprar={() => setPagina("inicio")}
        onLimpar={limpar}
      />
    );
  } else if (pagina === "incluir" && admin) {
    miolo = (
      <Incluir produtos={produtos} onCriar={incluir} onAjustarEstoque={ajustarEstoque} />
    );
  } else if (pagina === "conta") {
    miolo = (
      <section className="rounded bg-white p-6">
        <h1 className="text-2xl font-medium">Sua conta</h1>
        <p className="mt-2">{usuarioNaTela()}</p>
        <p className="text-sm text-[#565959]">{admin ? "Grupo admin" : "Cliente"}</p>
      </section>
    );
  }

  return (
    <Layout
      email={usuarioNaTela()}
      admin={admin}
      quantidade={quantidade}
      busca={busca}
      onBusca={(valor) => {
        setBusca(valor);
        setPagina("inicio");
      }}
      pagina={pagina === "ofertas" ? "ofertas" : pagina}
      onNavegar={setPagina}
      onSair={sairDaConta}
    >
      {erro ? (
        <p className="mb-4 rounded border border-[#c40000] bg-[#fff5f5] px-3 py-2 text-sm text-[#c40000]">
          {erro}
        </p>
      ) : null}
      {aviso ? (
        <p className="mb-4 rounded border border-[#067d62] bg-[#f3fcf8] px-3 py-2 text-sm text-[#067d62]">
          {aviso}
        </p>
      ) : null}
      {miolo}
    </Layout>
  );
}

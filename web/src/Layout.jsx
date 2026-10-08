export default function Layout({
  email,
  admin,
  quantidade,
  busca,
  onBusca,
  pagina,
  onNavegar,
  onSair,
  children,
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#eaeded] text-[#0f1111]">
      <header className="bg-[#131921] text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-2 px-4 py-2 sm:grid-cols-[auto_1fr_auto]">
          <button className="text-left text-2xl font-bold tracking-tight" onClick={() => onNavegar("inicio")}>
            loja<span className="text-[#ff9900]">.</span>
          </button>
          <form
            className="flex overflow-hidden rounded"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              className="bg-white rounded-l w-full px-3 py-2 text-sm text-[#0f1111] outline-none"
              placeholder="Pesquisar produtos"
              value={busca}
              onChange={(event) => onBusca(event.target.value)}
            />
            <button className="bg-[#febd69] px-4 text-[#0f1111]" type="submit" aria-label="Pesquisar">
              Buscar
            </button>
          </form>
          <div className="flex items-center justify-end gap-4">
            <button className="text-left text-xs leading-tight" onClick={() => onNavegar("conta")}>
              <span className="block text-white/80">Olá, {email || "visitante"}</span>
              <span className="text-sm font-bold">{admin ? "Admin" : "Conta"}</span>
            </button>
            <button className="text-left text-sm font-bold" onClick={() => onNavegar("carrinho")}>
              Carrinho
              <span className="ml-1 text-[#ff9900]">{quantidade}</span>
            </button>
          </div>
        </div>
        <nav className="bg-[#232f3e]">
          <div className="mx-auto flex max-w-6xl gap-1 px-2 py-1 text-sm">
            <NavBotao ativo={pagina === "inicio"} onClick={() => onNavegar("inicio")}>
              Início
            </NavBotao>
            <NavBotao ativo={pagina === "ofertas"} onClick={() => onNavegar("ofertas")}>
              Ofertas
            </NavBotao>
            <NavBotao ativo={pagina === "carrinho"} onClick={() => onNavegar("carrinho")}>
              Carrinho
            </NavBotao>
            {admin ? (
              <NavBotao ativo={pagina === "incluir"} onClick={() => onNavegar("incluir")}>
                Incluir produto
              </NavBotao>
            ) : null}
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">{children}</main>
      <footer className="mt-8 bg-[#232f3e] text-sm text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 sm:grid-cols-2 md:grid-cols-4">
          <Coluna titulo="Conheça a loja">
            <RodapeLink onClick={() => onNavegar("inicio")}>Catálogo</RodapeLink>
            <RodapeLink onClick={() => onNavegar("ofertas")}>Ofertas</RodapeLink>
          </Coluna>
          <Coluna titulo="Comprar">
            <RodapeLink onClick={() => onNavegar("carrinho")}>Carrinho</RodapeLink>
            <RodapeLink onClick={() => onNavegar("inicio")}>Adicionar produtos</RodapeLink>
          </Coluna>
          <Coluna titulo="Sua conta">
            <RodapeLink onClick={() => onNavegar("conta")}>Dados do login</RodapeLink>
            <RodapeLink onClick={onSair}>Sair</RodapeLink>
          </Coluna>
          <Coluna titulo="Ajuda">
            <p className="text-white/80">Os preços vêm do catálogo.</p>
            <p className="text-white/80">O carrinho fica na sua conta.</p>
          </Coluna>
        </div>
        <div className="bg-[#131921] py-6 text-center">
          <p className="text-xl font-bold">
            loja<span className="text-[#ff9900]">.</span>
          </p>
          <p className="mt-2 text-xs text-white/70">Loja do grupo · catálogo e carrinho</p>
        </div>
      </footer>
    </div>
  );
}

function NavBotao({ ativo, children, onClick }) {
  return (
    <button
      className={`rounded px-3 py-1 ${ativo ? "bg-white/15 font-bold" : "hover:bg-white/10"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Coluna({ titulo, children }) {
  return (
    <div>
      <h2 className="mb-2 font-bold">{titulo}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function RodapeLink({ children, onClick }) {
  return (
    <button className="block text-left text-white/80 hover:underline" onClick={onClick}>
      {children}
    </button>
  );
}

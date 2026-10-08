import { useState } from "react";
import { entrar } from "./auth";

export default function Login({ onOk, mensagem }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function enviar(event) {
    event.preventDefault();
    setErro("");
    try {
      await entrar(email.trim(), senha);
      onOk();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#eaeded] text-[#0f1111]">
      <header className="bg-[#131921] py-3 text-center text-2xl font-bold text-white">
        loja<span className="text-[#ff9900]">.</span>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8">
        <form onSubmit={enviar} className="w-full max-w-sm rounded border bg-white p-5">
          <h1 className="text-2xl font-normal">Fazer login</h1>
          {mensagem ? <p className="mt-3 text-sm text-[#565959]">{mensagem}</p> : null}
          <label className="mt-4 block text-sm font-bold">
            E-mail
            <input
              className="mt-1 w-full rounded border px-3 py-2 font-normal"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="mt-3 block text-sm font-bold">
            Senha
            <input
              className="mt-1 w-full rounded border px-3 py-2 font-normal"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
          </label>
          {erro ? <p className="mt-3 text-sm text-[#c40000]">{erro}</p> : null}
          <button
            className="mt-4 w-full rounded-full bg-[#ffd814] py-2 text-sm hover:bg-[#f7ca00]"
            type="submit"
          >
            Continuar
          </button>
        </form>
      </main>
    </div>
  );
}

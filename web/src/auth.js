const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const CHAVE = "loja_access_token";
const CHAVE_REFRESH = "loja_refresh_token";
const CHAVE_EMAIL = "loja_email";
const MARGEM_SEGUNDOS = 60;

let renovacaoEmAndamento = null;

export function token() {
  return localStorage.getItem(CHAVE);
}

export function sair() {
  localStorage.removeItem(CHAVE);
  localStorage.removeItem(CHAVE_REFRESH);
  localStorage.removeItem(CHAVE_EMAIL);
}

function payload() {
  const atual = token();
  if (!atual) return {};
  try {
    const parte = atual.split(".")[1];
    const base64 = parte.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    return JSON.parse(atob(base64 + pad));
  } catch {
    return {};
  }
}

export function usuarioNaTela() {
  return localStorage.getItem(CHAVE_EMAIL) || payload().username || "";
}

export function ehAdmin() {
  const grupos = payload()["cognito:groups"] || [];
  const lista = Array.isArray(grupos) ? grupos : [grupos];
  return lista.includes("admin");
}

export function expirado() {
  const { exp } = payload();
  if (!exp) return true;
  return Date.now() / 1000 >= exp - MARGEM_SEGUNDOS;
}

async function iniciarAuth(authFlow, authParameters) {
  const resposta = await fetch("https://cognito-idp.us-east-1.amazonaws.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: authFlow,
      ClientId: CLIENT_ID,
      AuthParameters: authParameters,
    }),
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.message || "Falha na autenticação");
  }
  return dados.AuthenticationResult;
}

export async function entrar(email, senha) {
  const resultado = await iniciarAuth("USER_PASSWORD_AUTH", {
    USERNAME: email,
    PASSWORD: senha,
  });
  localStorage.setItem(CHAVE, resultado.AccessToken);
  localStorage.setItem(CHAVE_REFRESH, resultado.RefreshToken);
  localStorage.setItem(CHAVE_EMAIL, email);
}

// Chamadas paralelas (ex.: produtos + carrinho) compartilham a mesma renovação.
export function renovar() {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = (async () => {
      const refresh = localStorage.getItem(CHAVE_REFRESH);
      if (!refresh) throw new Error("Sem refresh token");
      const resultado = await iniciarAuth("REFRESH_TOKEN_AUTH", { REFRESH_TOKEN: refresh });
      localStorage.setItem(CHAVE, resultado.AccessToken);
      if (resultado.RefreshToken) {
        localStorage.setItem(CHAVE_REFRESH, resultado.RefreshToken);
      }
    })().finally(() => {
      renovacaoEmAndamento = null;
    });
  }
  return renovacaoEmAndamento;
}

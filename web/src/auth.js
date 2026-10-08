const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const CHAVE = "loja_access_token";
const CHAVE_EMAIL = "loja_email";

export function token() {
  return localStorage.getItem(CHAVE);
}

export function sair() {
  localStorage.removeItem(CHAVE);
  localStorage.removeItem(CHAVE_EMAIL);
}

function payload() {
  const atual = token();
  if (!atual) return {};
  const parte = atual.split(".")[1];
  const base64 = parte.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  return JSON.parse(atob(base64 + pad));
}

export function usuarioNaTela() {
  return localStorage.getItem(CHAVE_EMAIL) || payload().username || "";
}

export function ehAdmin() {
  const grupos = payload()["cognito:groups"] || [];
  const lista = Array.isArray(grupos) ? grupos : [grupos];
  return lista.includes("admin");
}

export async function entrar(email, senha) {
  const resposta = await fetch("https://cognito-idp.us-east-1.amazonaws.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: senha,
      },
    }),
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.message || "Falha no login");
  }
  localStorage.setItem(CHAVE, dados.AuthenticationResult.AccessToken);
  localStorage.setItem(CHAVE_EMAIL, email);
}

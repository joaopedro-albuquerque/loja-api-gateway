# Progressão — persistência, front e login

Continue daqui **depois** que `GET /produtos` e `GET`/`POST`/`DELETE /carrinho` funcionam com `curl` na Invoke URL ([`exercicios/03_deploy_aws.md`](../exercicios/03_deploy_aws.md)).

Feche um passo com o teste indicado antes de abrir o próximo. Crie todos os recursos na **mesma região** das Lambdas: canto superior direito da console em **Estados Unidos (Norte da Virgínia)** (`us-east-1`).

```text
hoje          curl → API Gateway → Lambda (memória / lista fixa)
passo 1–2     mesma URL, dados no DynamoDB
passo 3       carrinho separado por usuarioId (ainda via header)
passo 4       index no seu computador: tabela de produtos e carrinho
passo 5       essa tela publicada no S3
passo 6       página de login; usuário novo entra como cliente
passo 7       grupo admin só no console da AWS; esse usuário inclui produto
```

O que já foi criado nesta conta, com os ids e os dois logins, está em [O que ficou pronto nesta conta](#o-que-ficou-pronto-nesta-conta).

A Invoke URL desta conta está em [`evidencias/url_publica.txt`](../evidencias/url_publica.txt):

```text
https://htorq210vb.execute-api.us-east-1.amazonaws.com
```

Nos `curl` abaixo, `BASE` é essa URL **sem** barra no final e **sem** `/produtos`:

```bash
export BASE="https://htorq210vb.execute-api.us-east-1.amazonaws.com"
```

O `boto3` já vem no runtime Python da Lambda. Não coloque a biblioteca dentro do ZIP. Depois de mudar o Python, rode `./scripts/empacotar.sh` e faça upload de novo na função correspondente. Mudar variável de ambiente ou política **não** exige ZIP novo.

---

## Como abrir a console

1. Abra https://console.aws.amazon.com/ e entre na conta.
2. No canto superior direito, a região tem que ser **Estados Unidos (Norte da Virgínia)**. Se estiver outra, clique nela e troque antes de criar qualquer coisa. Tabela criada em São Paulo não aparece para uma Lambda da Virgínia.
3. A barra **Pesquisar** fica no topo, ao lado do logo da AWS. Digite o nome do serviço e clique no resultado (não num atalho de “recurso recente” de outra região).

| O que você vai configurar | Serviço na busca | Recurso dentro do serviço |
|---------------------------|------------------|---------------------------|
| Dados do catálogo | **DynamoDB** | tabela `loja-produtos` |
| Dados do carrinho | **DynamoDB** | tabela `loja-carrinho` |
| Código, variável e permissão de ler a tabela | **Lambda** | função `loja-produtos` ou `loja-carrinho` |
| Quem pode chamar a função (já existe) | **Lambda** → documento da função | deixe como está |
| URL pública e CORS | **API Gateway** | API `htorq210vb` |
| Site estático | **S3** | o bucket que você criar no passo 5 |
| Login | **Cognito** | user pool do passo 6 |
| Quem é admin | **Cognito** | grupo `admin` do passo 7 |

### Abrir uma função Lambda

1. Pesquisar → **Lambda**.
2. Na lista **Funções**, clique no **nome** (`loja-produtos` ou `loja-carrinho`). Clicar no nome abre a função. A página mostra abas no topo (Código, Testar, Monitorar, Configuração) e, com **Configuração** selecionada, um menu à esquerda.

Esse menu esquerdo é só desta função. Os itens que este guia usa:

| Item do menu | Para que serve neste guia |
|--------------|---------------------------|
| **Permissões** | achar o perfil (role) que a função usa na AWS |
| **Variáveis de ambiente** | gravar o nome da tabela que o Python vai ler |
| **Código** (aba do topo, não do menu) | enviar o ZIP novo |

### Duas políticas diferentes na mesma função

Na página **Configuração → Permissões** existem dois controles. Eles não fazem a mesma coisa.

| O que está na tela | Onde fica | O que autoriza |
|--------------------|-----------|----------------|
| **Nome do perfil**, link azul do tipo `loja-produtos-role-gtvf20ea` | abre o **IAM** | o que a função **pode chamar** (DynamoDB, CloudWatch) |
| Botão **Visualizar documento de função** | JSON que já tem `lambda:InvokeFunction` e `apigateway.amazonaws.com` | quem **pode invocar** a função (o API Gateway) |

A permissão `dynamodb:Scan` entra no perfil (o link azul). O documento de função permanece só com o statement do API Gateway. Colocar `dynamodb:Scan` nesse JSON não dá acesso à tabela.

---

## Passo 1 — Catálogo no DynamoDB

O `GET /produtos` continua igual para quem chama. A origem dos dados muda: sai a lista `CATALOGO` de `lambdas/produtos/lambda_function.py` e entra a tabela.

### 1.1 Criar a tabela

**Serviço:** DynamoDB. **Recurso novo:** tabela `loja-produtos`.

1. Pesquisar → **DynamoDB**.
2. Menu esquerdo → **Tabelas**.
3. Botão **Criar tabela**.
4. Preencha:

| Campo na tela | Valor |
|---------------|--------|
| Nome da tabela | `loja-produtos` |
| Chave de partição | `id` |
| Tipo da chave | **Número** |

5. Em configurações da tabela, deixe a capacidade **sob demanda** (é o padrão: “configurações padrão”). Não crie chave de classificação.
6. **Criar tabela**. Espere o status ficar **Ativa**.

### 1.2 Copiar a ARN da tabela

A ARN identifica esta tabela na política do passo 1.4. O nome sozinho não basta lá.

1. Ainda em DynamoDB → **Tabelas** → clique em **loja-produtos**.
2. No topo da página da tabela, copie o campo **ARN** (Nome do recurso da Amazon).

Nesta conta o formato é:

```text
arn:aws:dynamodb:us-east-1:091914201633:table/loja-produtos
```

Se o número da conta no meio for outro, use o que a console mostrar. Guarde esse texto: ele entra no JSON da política.

### 1.3 Gravar os três produtos

**Serviço:** DynamoDB. **Recurso:** a tabela `loja-produtos` que você acabou de abrir. **Tela:** explorar itens (não é a Lambda).

1. Com a tabela aberta, botão **Explorar itens da tabela** (também aparece no menu esquerdo como **Explorar itens**, já filtrado nesta tabela).
2. **Criar item**.
3. O atributo `id` já vem porque é a chave. Tipo **Número**, valor `1`.
4. **Adicionar novo atributo** → **String**. Nome do atributo: `nome`. Valor: `Notebook`.
5. **Adicionar novo atributo** → **Número**. Nome: `preco`. Valor: `3500`.
6. **Criar item**.
7. Repita para os outros dois:

| id (Número) | nome (String) | preco (Número) |
|-------------|-----------------|----------------|
| 1 | Notebook | 3500 |
| 2 | Mouse | 80 |
| 3 | Teclado | 150 |

A lista de itens da tabela mostra as três linhas. `preco` é número, sem aspas.

### 1.4 Permitir que a Lambda leia a tabela

**Serviço em que você começa:** Lambda. **Recurso:** função `loja-produtos`. **Onde a política é salva:** IAM, no perfil de execução dessa função.

1. Abra a função `loja-produtos` (seção [Abrir uma função Lambda](#abrir-uma-função-lambda)).
2. Aba **Configuração** → menu esquerdo **Permissões**.
3. No bloco **Perfil de execução**, clique no **nome azul** do perfil. No seu caso: `loja-produtos-role-gtvf20ea`. O sufixo depois de `role-` pode ser outro; clique no que estiver escrito aí.
4. Abre uma aba do **IAM**, na página desse perfil. Título no topo: o nome do perfil.
5. Aba **Permissões** (já costuma vir selecionada).
6. Botão **Adicionar permissões** → **Criar política em linha**.
7. Aba **JSON**. Apague o exemplo e cole (troque a ARN se a sua, copiada no passo 1.2, for diferente):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "dynamodb:Scan",
      "Resource": "arn:aws:dynamodb:us-east-1:091914201633:table/loja-produtos"
    }
  ]
}
```

8. **Avançar**. Nome da política: `loja-produtos-scan`. **Criar política**.

Conferência, de volta na Lambda → **Configuração → Permissões → Resumo de recursos**: além de CloudWatch Logs, aparece **Amazon DynamoDB** com a ação `dynamodb:Scan` e a ARN da tabela.

`Scan` lê a tabela inteira. Para três produtos, é o que o `GET /produtos` precisa.

### 1.5 Variável de ambiente `TABELA_PRODUTOS`

O Python não deve ter o nome da tabela escrito fixo. Ele lê `os.environ["TABELA_PRODUTOS"]`. Quem grava esse valor é a **função Lambda**, na configuração dela. A tabela do DynamoDB não tem essa tela. O API Gateway também não.

**Serviço:** Lambda. **Recurso:** função `loja-produtos` (a mesma do catálogo, não a `loja-carrinho`).

1. Pesquisar → **Lambda** → clique em **loja-produtos**.
2. Aba **Configuração**.
3. Menu esquerdo → **Variáveis de ambiente**. Fica abaixo de **URL da função** e acima de **Tags**.
4. Botão **Editar**.
5. **Adicionar variável de ambiente**.
6. Preencha exatamente assim (maiúsculas na chave):

| Chave | Valor |
|-------|--------|
| `TABELA_PRODUTOS` | `loja-produtos` |

O valor é o **nome** da tabela, o mesmo do passo 1.1. A ARN fica só na política.

7. **Salvar**.

Conferência: a página **Variáveis de ambiente** lista uma linha `TABELA_PRODUTOS` = `loja-produtos`. Não precisa enviar ZIP de novo por causa disso.

### 1.6 Código que faz o scan

Arquivo no projeto: `lambdas/produtos/lambda_function.py`. O DynamoDB devolve número como `Decimal`, e o `json.dumps` não aceita `Decimal`. Converta para `int` ou `float` antes de montar o JSON.

Exemplo do handler deste passo:

```python
import json
import os
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")
tabela = dynamodb.Table(os.environ["TABELA_PRODUTOS"])


def _numero(valor):
    if isinstance(valor, Decimal):
        return int(valor) if valor % 1 == 0 else float(valor)
    return valor


def _resposta(status, payload):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(payload, ensure_ascii=False),
    }


def lambda_handler(event, context):
    metodo = (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method")
        or "GET"
    ).upper()

    if metodo == "GET":
        itens = tabela.scan().get("Items", [])
        produtos = [
            {
                "id": _numero(item["id"]),
                "nome": item["nome"],
                "preco": _numero(item["preco"]),
            }
            for item in itens
        ]
        return _resposta(200, {"produtos": produtos})

    return _resposta(405, {"erro": f"Método {metodo} não permitido em /produtos"})
```

`boto3` não entra no ZIP. A chave `TABELA_PRODUTOS` tem que ser igual à variável salva na console.

### 1.7 Enviar o Python de novo

1. No computador, na raiz do projeto:

```bash
cd /home/jp/Projetos/loja-api-gateway
./scripts/empacotar.sh
```

Isso gera `dist/loja-produtos.zip`.

2. Console → **Lambda** → função **loja-produtos**.
3. Aba **Código** (primeira aba do topo).
4. Botão **Fazer upload de** → **arquivo .zip**.
5. Escolha `dist/loja-produtos.zip` → **Salvar**.
6. Espere o aviso de atualização concluída. Se aparecer **Implantar**, clique também.

### 1.8 Prova

```bash
curl "$BASE/produtos"
```

A resposta traz os três itens. No DynamoDB → tabela `loja-produtos` → **Explorar itens**, mude o `preco` do Mouse e salve o item. O próximo `curl` mostra o preço novo. Se a lista do código ainda estivesse valendo, o preço não mudaria.

Se a Lambda responder 500, abra a função → aba **Monitorar** → **Exibir logs do CloudWatch** → o log mais recente. `AccessDeniedException` significa que a política inline não está no perfil, ou que a ARN do `Resource` não é a da tabela. `KeyError: TABELA_PRODUTOS` significa que a variável não foi salva nesta função.

---

## Passo 2 — Carrinho persistente, um usuário fixo

O contrato HTTP ainda não muda. A Lambda grava no DynamoDB com um `usuarioId` escrito no código, por exemplo `"demo"`. Isso prova que o carrinho sobrevive entre invocações antes de decidir quem é o usuário.

A lista global `_carrinho` em `lambdas/carrinho/lambda_function.py` deixa de ser a fonte dos dados.

Tudo deste passo é na função **loja-carrinho** e na tabela **loja-carrinho**. A função `loja-produtos` fica como você deixou no passo 1.

### 2.1 Criar a tabela

**Serviço:** DynamoDB → **Tabelas** → **Criar tabela**.

| Campo | Valor |
|-------|--------|
| Nome da tabela | `loja-carrinho` |
| Chave de partição | `usuarioId`, tipo **String** |
| Chave de classificação | `produtoId`, tipo **String** |
| Capacidade | sob demanda |

`qtd` e `preco` não são chave. Eles entram como atributos quando o `POST` gravar o item. Não precisa criar item manualmente: a Lambda cria no primeiro `POST`.

Copie a ARN no topo da tabela. Formato:

```text
arn:aws:dynamodb:us-east-1:091914201633:table/loja-carrinho
```

### 2.2 Permissão na função do carrinho

**Serviço:** Lambda. **Recurso:** função `loja-carrinho` (abra pelo nome na lista; não reutilize o perfil da `loja-produtos`).

1. **Configuração** → **Permissões**.
2. Clique no nome azul do perfil. Ele se parece com `loja-carrinho-role-xxxxxxxx`.
3. No IAM: **Adicionar permissões** → **Criar política em linha** → aba **JSON**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:091914201633:table/loja-carrinho"
    }
  ]
}
```

4. Nome: `loja-carrinho-dados`. **Criar política**.

`Query` lê os itens de um `usuarioId`. `PutItem` grava. `DeleteItem` apaga um item (uma combinação de `usuarioId` + `produtoId`).

### 2.3 Variável `TABELA_CARRINHO`

**Serviço:** Lambda. **Recurso:** função `loja-carrinho`. **Menu:** Configuração → **Variáveis de ambiente** → **Editar** → **Adicionar variável de ambiente**.

| Chave | Valor |
|-------|--------|
| `TABELA_CARRINHO` | `loja-carrinho` |

Salvar. A página da função `loja-carrinho` mostra essa chave. A função `loja-produtos` continua só com `TABELA_PRODUTOS`.

### 2.4 Código

No arquivo `lambdas/carrinho/lambda_function.py`, fixe `USUARIO = "demo"`:

- `GET`: `query` com `usuarioId = "demo"` e calcule o total como a função `_total` já faz.
- `POST`: `put_item` com `usuarioId`, `produtoId`, `qtd` e `preco`. Grave os números como `Decimal`.
- `DELETE`: busque os itens dessa partição e apague cada um (`delete_item`).

Exemplo:

```python
import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

tabela = boto3.resource("dynamodb").Table(os.environ["TABELA_CARRINHO"])
USUARIO = "demo"


def _numero(valor):
    if isinstance(valor, Decimal):
        return int(valor) if valor % 1 == 0 else float(valor)
    return valor


def _itens():
    resposta = tabela.query(
        KeyConditionExpression=Key("usuarioId").eq(USUARIO)
    )
    itens = []
    for item in resposta.get("Items", []):
        itens.append(
            {
                "produtoId": item["produtoId"],
                "qtd": _numero(item["qtd"]),
                "preco": _numero(item["preco"]),
            }
        )
    return itens


def _total(itens):
    return sum(item["preco"] * item["qtd"] for item in itens)


def _resposta(status, payload):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(payload, ensure_ascii=False),
    }


def lambda_handler(event, context):
    metodo = (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method")
        or "GET"
    ).upper()

    if metodo == "GET":
        itens = _itens()
        return _resposta(200, {"itens": itens, "total": _total(itens)})

    if metodo == "POST":
        bruto = event.get("body") or "{}"
        try:
            dados = json.loads(bruto) if isinstance(bruto, str) else bruto
        except json.JSONDecodeError:
            return _resposta(400, {"erro": "JSON inválido"})

        produto_id = dados.get("produtoId")
        if produto_id is None:
            return _resposta(400, {"erro": "Campo obrigatório: produtoId"})

        tabela.put_item(
            Item={
                "usuarioId": USUARIO,
                "produtoId": str(produto_id),
                "qtd": Decimal(str(dados.get("qtd", 1))),
                "preco": Decimal(str(dados.get("preco", 0))),
            }
        )
        itens = _itens()
        return _resposta(
            201,
            {"mensagem": "Item adicionado", "itens": itens, "total": _total(itens)},
        )

    if metodo == "DELETE":
        for item in tabela.query(
            KeyConditionExpression=Key("usuarioId").eq(USUARIO)
        ).get("Items", []):
            tabela.delete_item(
                Key={"usuarioId": USUARIO, "produtoId": item["produtoId"]}
            )
        return _resposta(200, {"mensagem": "Carrinho limpo", "itens": [], "total": 0})

    return _resposta(405, {"erro": f"Método {metodo} não permitido em /carrinho"})
```

Empacote e envie **só** na função do carrinho:

```bash
./scripts/empacotar.sh
```

Lambda → **loja-carrinho** → aba **Código** → **Fazer upload de** → **arquivo .zip** → `dist/loja-carrinho.zip` → **Salvar**.

### 2.5 Prova

```bash
curl -H "Content-Type: application/json" \
  -d '{"produtoId":"1","qtd":1,"preco":3500}' \
  "$BASE/carrinho"

curl "$BASE/carrinho"
```

Espere um pouco e repita o `GET`. O item continua. No DynamoDB → tabela `loja-carrinho` → **Explorar itens**, existe uma linha com `usuarioId` = `demo`.

---

## Passo 3 — Um carrinho por usuário

A tabela do passo 2 já separa por `usuarioId`. Aqui a Lambda lê esse valor do header `x-usuario-id`. Sem o header, responda `400`. Nenhuma tabela nova e nenhuma política nova.

**O que muda:** o arquivo `lambdas/carrinho/lambda_function.py`, de novo enviado na função **loja-carrinho**.

No HTTP API o header chega em `event["headers"]`. A chave pode vir em minúsculas. Trate `x-usuario-id` e `X-Usuario-Id`. Troque a constante `USUARIO = "demo"` por uma leitura do header, e use esse valor no `query`, no `put_item` e no `delete_item`.

```python
cabecalhos = event.get("headers") or {}
usuario = cabecalhos.get("x-usuario-id") or cabecalhos.get("X-Usuario-Id")
if not usuario:
    return _resposta(400, {"erro": "Header obrigatório: x-usuario-id"})
```

Suba de novo `dist/loja-carrinho.zip` na função `loja-carrinho` (aba **Código** → **Fazer upload de**).

```bash
curl -H "x-usuario-id: ana" -H "Content-Type: application/json" \
  -d '{"produtoId":"1","qtd":1,"preco":3500}' \
  "$BASE/carrinho"

curl -H "x-usuario-id: ana" "$BASE/carrinho"
curl -H "x-usuario-id: bruno" "$BASE/carrinho"
```

O carrinho da Ana tem o Notebook. O do Bruno vem vazio. Na tabela, as partition keys são `ana` e, depois que o Bruno adicionar algo, `bruno`. Quem souber o id de outra pessoa ainda consegue ler o carrinho dela. Isso fecha no passo 6.

---

## Passo 4 — Front na sua máquina

Pasta nova `web/`, fora de `lambdas/`. As funções continuam só com Python. Nenhuma variável de ambiente da Lambda muda neste passo. A URL da API fica num arquivo do Vite, no seu computador.

A página deste passo é o **index**: uma tabela com o catálogo e, ao lado, o carrinho. O login fica no passo 6. O botão de incluir produto fica no passo 7, e só aparece para o admin.

**React** desenha a tela em componentes. **Vite** desenvolve essa tela no seu computador e, no build, gera HTML, JS e CSS estáticos. **Tailwind** é o CSS: as classes ficam no próprio elemento (`flex`, `p-4`, `bg-white`) e o Vite embute no arquivo final só as que você usou.

### 4.1 Criar o projeto

```bash
cd /home/jp/Projetos/loja-api-gateway
npm create vite@latest web -- --template react
cd web
npm install
npm install tailwindcss @tailwindcss/vite
```

Substitua `web/vite.config.js` por:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Substitua o conteúdo de `web/src/index.css` por:

```css
@import "tailwindcss";
```

O `src/main.jsx` que o Vite criou permanece. Ele só monta o `App`.

### 4.2 Onde fica a URL da API

**Recurso:** arquivo no projeto, não na AWS. Crie `web/.env`:

```text
VITE_API_BASE=https://htorq210vb.execute-api.us-east-1.amazonaws.com
```

Sem barra no final. Sem `/produtos`. O Vite só enxerga variáveis que começam com `VITE_`. Depois de salvar o `.env`, pare o `npm run dev` (Ctrl+C) e rode de novo: ele lê esse arquivo na subida.

### 4.3 Chamadas da API

Crie `web/src/api.js`. Neste passo a identidade ainda é o header `x-usuario-id` do passo 3. O arquivo gera um id na primeira visita e reutiliza nas próximas.

```javascript
const BASE = import.meta.env.VITE_API_BASE;

function usuarioId() {
  const chave = "loja_usuario_id";
  let id = localStorage.getItem(chave);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(chave, id);
  }
  return id;
}

function cabecalhos() {
  return {
    "Content-Type": "application/json",
    "x-usuario-id": usuarioId(),
  };
}

async function ler(resposta) {
  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.erro || `Erro ${resposta.status}`);
  }
  return dados;
}

export function idLocal() {
  return usuarioId();
}

export async function listarProdutos() {
  const resposta = await fetch(`${BASE}/produtos`);
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
```

`GET /produtos` ainda não manda header. `GET`, `POST` e `DELETE` de `/carrinho` mandam.

### 4.4 A página index

Crie `web/src/Loja.jsx`. A tabela é o catálogo. Cada linha tem um botão que manda aquele produto ao carrinho.

```jsx
import { useEffect, useState } from "react";
import {
  adicionarAoCarrinho,
  idLocal,
  lerCarrinho,
  limparCarrinho,
  listarProdutos,
} from "./api";

function reais(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Loja() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState({ itens: [], total: 0 });
  const [erro, setErro] = useState("");

  async function carregar() {
    const [catalogo, sacola] = await Promise.all([
      listarProdutos(),
      lerCarrinho(),
    ]);
    setProdutos(catalogo.produtos);
    setCarrinho(sacola);
  }

  useEffect(() => {
    carregar().catch((e) => setErro(e.message));
  }, []);

  async function porNoCarrinho(produto) {
    setErro("");
    try {
      setCarrinho(await adicionarAoCarrinho(produto));
    } catch (e) {
      setErro(e.message);
    }
  }

  async function limpar() {
    setErro("");
    try {
      setCarrinho(await limparCarrinho());
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Loja</h1>
        <p className="text-sm text-neutral-600">Cliente local: {idLocal()}</p>
      </header>

      {erro ? <p className="mb-4 text-red-700">{erro}</p> : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-lg font-medium">Produtos</h2>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Id</th>
                <th>Nome</th>
                <th>Preço</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id} className="border-b">
                  <td className="py-2">{produto.id}</td>
                  <td>{produto.nome}</td>
                  <td>{reais(produto.preco)}</td>
                  <td className="py-2 text-right">
                    <button
                      className="rounded bg-neutral-900 px-3 py-1 text-sm text-white"
                      onClick={() => porNoCarrinho(produto)}
                    >
                      Adicionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium">Carrinho</h2>
          <ul className="mb-3 space-y-1">
            {carrinho.itens.map((item) => (
              <li key={item.produtoId}>
                Produto {item.produtoId} · qtd {item.qtd} · {reais(item.preco)}
              </li>
            ))}
          </ul>
          <p className="mb-3 font-medium">Total: {reais(carrinho.total)}</p>
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={limpar}
          >
            Limpar carrinho
          </button>
        </section>
      </div>
    </main>
  );
}
```

Substitua `web/src/App.jsx` por:

```jsx
import Loja from "./Loja";

export default function App() {
  return <Loja />;
}
```

Suba a tela:

```bash
cd /home/jp/Projetos/loja-api-gateway/web
npm run dev
```

O terminal imprime um endereço local, em geral `http://localhost:5173`. Abra esse endereço no navegador.

### 4.5 CORS no API Gateway

A partir daqui o navegador chama a API. O `curl` não exige CORS; o browser exige. A configuração é da **API**, não da Lambda e não da tabela.

**Serviço:** API Gateway. **Recurso:** a HTTP API cujo id é `htorq210vb` (o mesmo da Invoke URL).

1. Pesquisar → **API Gateway**.
2. No menu esquerdo, **APIs**. Clique na API. O id `htorq210vb` aparece na lista ou na URL da própria console.
3. Menu esquerdo da API → **CORS**.
4. **Configurar**.
5. Preencha:

| Campo | Valor |
|-------|--------|
| Access-Control-Allow-Origin | `*` |
| Access-Control-Allow-Methods | `GET`, `POST`, `DELETE`, `OPTIONS` |
| Access-Control-Allow-Headers | `content-type`, `x-usuario-id`, `authorization` |

`authorization` já deixa o passo 6 pronto. Origem `*` combina com credenciais desligadas; deixe **Allow-Credentials** desmarcado.

6. **Salvar**. O HTTP API publica isso no stage `$default` sozinho.

Os `curl` dos passos anteriores continuam válidos.

Pronto quando `npm run dev` listar produtos, adicionar um item e mostrar o mesmo carrinho depois de recarregar a página. Uma janela anônima fica com outro id e outro carrinho. Se o navegador mostrar erro de CORS e o `curl` funcionar, volte nesta tela **CORS** da API `htorq210vb`: o header `x-usuario-id` precisa estar em Allow-Headers.

---

## Passo 5 — Publicar a página no S3

O Vite não roda na AWS. Você sobe só o resultado do build.

```bash
cd /home/jp/Projetos/loja-api-gateway/web
npm run build
```

Isso gera a pasta `web/dist/` com `index.html` e a pasta `assets/`. Confira que `VITE_API_BASE` já estava no `.env` **antes** do build: o Vite grava a URL dentro do JavaScript nessa hora. Se você criar o `.env` depois, rode `npm run build` de novo.

### 5.1 Criar o bucket

**Serviço:** S3. Região: Norte da Virgínia, igual às Lambdas.

1. Pesquisar → **S3** → **Criar bucket**.
2. Nome globalmente único, por exemplo `loja-grupo4-web-091914201633`. Anote o nome: ele entra na política.
3. Região **US East (N. Virginia) us-east-1**.
4. Nas opções de acesso público deste bucket, **desmarque** “Bloquear todo o acesso público” e confirme o aviso. Os outros buckets da conta podem continuar bloqueados.
5. **Criar bucket**.

### 5.2 Ligar o site estático

**Recurso:** esse bucket. **Aba:** Propriedades (não é Permissões).

1. Clique no nome do bucket.
2. Aba **Propriedades**.
3. Role até **Hospedagem de site estático** → **Editar**.
4. **Habilitar**.
5. Documento de índice: `index.html`.
6. Documento de erro: `index.html`. A página é um único app; um caminho que não é arquivo volta para ele.
7. **Salvar alterações**.

A mesma caixa passa a mostrar um **URL do ponto de extremidade do site**, no formato:

```text
http://NOME-DO-BUCKET.s3-website-us-east-1.amazonaws.com
```

Esse é o endereço que você abre no navegador. O link “URL do objeto” de cada arquivo no S3 é outro endereço e não serve a página como site.

### 5.3 Enviar os arquivos

**Recurso:** o bucket → aba **Objetos**.

1. **Carregar**.
2. Arraste o **conteúdo** de `web/dist/`: `index.html` e a pasta `assets`. O arquivo `index.html` fica na raiz do bucket. Uma pasta chamada `dist` dentro do bucket deixa o site sem página inicial.
3. **Carregar** e espere concluir.

### 5.4 Liberar a leitura pública

**Recurso:** o mesmo bucket → aba **Permissões** → bloco **Política do bucket** → **Editar**. Cole, trocando o nome:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LeituraPublicaDoSite",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::NOME-DO-BUCKET/*"
    }
  ]
}
```

**Salvar alterações**.

Abra a URL de **Hospedagem de site estático**. A página chama a mesma Invoke URL. Se o `POST` falhar no navegador e o `curl` funcionar, o problema é a tela CORS do API Gateway (passo 4.3).

O endpoint de website do S3 é HTTP. O navegador pode chamar a API Gateway em HTTPS a partir dessa página. Se você precisar da loja em HTTPS, o passo seguinte fora deste guia é um CloudFront na frente do bucket.

---

## Passo 6 — Página de login

O header deixa de ser a identidade. A senha fica no **Cognito**. A página de login é do React: e-mail e senha. Quem você cria no console entra como **cliente**. O grupo que transforma alguém em admin só existe no passo 7, e só o console da AWS coloca uma pessoa nele.

| Peça | Serviço | Papel |
|------|---------|--------|
| User pool | **Cognito** | Guarda o usuário e a senha. Devolve um JWT depois do login. |
| Página de login | **React** (`web/src/Login.jsx`) | Manda e-mail e senha direto ao Cognito. A API da loja não vê a senha. |
| Index | **React** (`web/src/Loja.jsx`) | A tabela do passo 4. Só abre com token válido. |
| Autorizador JWT | **API Gateway**, API `htorq210vb` | Confere o token antes de chamar a Lambda. Token ruim vira `401`. |
| `usuarioId` | **Lambda** `loja-carrinho` | Lê o `sub` do token e usa como partition key. |

A senha não chega no `event`. O Python confia no `sub` porque o Gateway já validou o token.

A ordem do assistente do Cognito muda de tempos em tempos. As decisões são estas; os valores que você copia depois ficam nos caminhos indicados.

### 6.1 Criar o user pool

**Serviço:** pesquisar → **Cognito** → **Grupos de usuários** → **Criar grupo de usuários**. Região: Norte da Virgínia.

No assistente:

1. Tipo de aplicação: página única (SPA), no navegador, **sem** client secret. A página de login deste projeto chama o Cognito pelo JavaScript. Um client secret não pode ficar no navegador.
2. Nome da aplicação: `loja-web`.
3. Login por **e-mail**. O e-mail é o nome de usuário.
4. Se o assistente pedir URL de retorno, URL de saída ou domínio de Hosted UI, preencha para conseguir terminar: callback e logout com `http://localhost:5173` e com a URL `http://` do site no S3 (`s3-website-us-east-1.amazonaws.com`). Prefixo de domínio, se exigido: `loja-grupo4-091914201633`. A página de login deste passo **não** redireciona para essa URL. Ela usa o fluxo `USER_PASSWORD_AUTH` abaixo.
5. Ao terminar, abra o app client e ligue o fluxo de senha:
   1. O pool → **Clientes de aplicativo** (ou **Integração de aplicações**) → `loja-web`.
   2. **Editar**.
   3. Em fluxos de autenticação, marque **ALLOW_USER_PASSWORD_AUTH**. Na tela em português o rótulo pode ser autenticação com nome de usuário e senha (`USER_PASSWORD_AUTH`).
   4. Salve. O fluxo `ALLOW_USER_SRP_AUTH`, se já vier marcado, pode continuar marcado.

Anote dois valores:

| Valor | Onde copiar |
|-------|-------------|
| ID do user pool | Cognito → o pool → página inicial, campo **ID do grupo de usuários** |
| ID do app client | o pool → cliente `loja-web` → **ID do cliente**. É uma string curta, diferente do ID do pool. |

O emissor (issuer), usado no passo 6.3, é este texto com o ID do pool no final:

```text
https://cognito-idp.us-east-1.amazonaws.com/ID-DO-USER-POOL
```

### 6.2 Criar os clientes

**Recurso:** o mesmo user pool → menu **Usuários** → **Criar usuário**.

1. E-mail e senha que você consiga digitar na demo. Exemplo de e-mail: o seu, e um segundo da dupla.
2. Marque o e-mail como verificado.
3. Desmarque a troca de senha no primeiro login, se essa caixa aparecer. A demo não depende de caixa de e-mail.
4. Crie o segundo usuário do mesmo jeito.

Não existe grupo neste momento. **Criar usuário não promove ninguém.** Os dois entram como clientes. O passo 7 escolhe um deles e, só no console, coloca esse um no grupo `admin`.

### 6.3 Autorizador na API

**Serviço:** API Gateway. **Recurso:** API `htorq210vb`.

1. Pesquisar → **API Gateway** → **APIs** → clique na API.
2. Menu esquerdo → **Autorização** (em algumas contas o rótulo é **Authorizers**).
3. **Criar** / **Gerenciar autorizadores** → tipo **JWT**.
4. Preencha:

| Campo | Valor |
|-------|--------|
| Nome | `cognito` |
| Fonte de identidade | `$request.header.Authorization` |
| Emissor | `https://cognito-idp.us-east-1.amazonaws.com/ID-DO-USER-POOL` |
| Público (audience) | o **id do app client**, não o id do user pool |

5. Salve.
6. Menu **Rotas**. Em cada uma destas rotas, anexe o autorizador `cognito`: `GET /produtos`, `GET /carrinho`, `POST /carrinho`, `DELETE /carrinho`.
7. A rota `OPTIONS` que o CORS criou fica sem autorizador. Com CORS ligado na API, o navegador recebe a resposta do preflight pelo Gateway. `GET`, `POST` e `DELETE` é que exigem o token.

O público tem que ser o id do app client. O access token do Cognito traz `client_id` com esse valor. Se a API responder `401` com um token que você acabou de obter, confira esse campo antes de mexer na Lambda.

### 6.4 Página de login no React

Acrescente no `web/.env` a linha do client. Pare o `npm run dev` e suba de novo depois de salvar.

```text
VITE_API_BASE=https://htorq210vb.execute-api.us-east-1.amazonaws.com
VITE_COGNITO_CLIENT_ID=ID-DO-APP-CLIENT
```

O id do client vai para o JavaScript de propósito: uma SPA não tem segredo. A senha só sai do navegador no POST ao endpoint do Cognito, em HTTPS. Ela não vai para o API Gateway nem para o S3.

Crie `web/src/auth.js`:

```javascript
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const CHAVE = "loja_access_token";

export function token() {
  return localStorage.getItem(CHAVE);
}

export function sair() {
  localStorage.removeItem(CHAVE);
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
  return payload().username || "";
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
}
```

Crie `web/src/Login.jsx`:

```jsx
import { useState } from "react";
import { entrar } from "./auth";

export default function Login({ onOk }) {
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
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">Entrar</h1>
      <form onSubmit={enviar} className="space-y-3">
        <label className="block text-sm">
          E-mail
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Senha
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </label>
        {erro ? <p className="text-sm text-red-700">{erro}</p> : null}
        <button className="rounded bg-neutral-900 px-4 py-2 text-white" type="submit">
          Entrar
        </button>
      </form>
    </main>
  );
}
```

Substitua `web/src/api.js`. As funções da loja continuam com os mesmos nomes. O header agora é o token, e o `GET /produtos` também o envia, porque a rota passou a ter autorizador.

```javascript
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
```

Substitua `web/src/App.jsx`. Sem token, a única tela é o login. Com token, abre o index do passo 4.

```jsx
import { useState } from "react";
import Login from "./Login";
import Loja from "./Loja";
import { sair, token, usuarioNaTela } from "./auth";

export default function App() {
  const [logado, setLogado] = useState(Boolean(token()));

  if (!logado) {
    return <Login onOk={() => setLogado(true)} />;
  }

  return (
    <>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-6">
        <p className="text-sm text-neutral-600">{usuarioNaTela()} · cliente</p>
        <button
          className="rounded border px-3 py-1 text-sm"
          onClick={() => {
            sair();
            setLogado(false);
          }}
        >
          Sair
        </button>
      </div>
      <Loja />
    </>
  );
}
```

Em `web/src/Loja.jsx`, apague o import de `idLocal` e a linha `Cliente local: {idLocal()}`. O e-mail já aparece no topo, pelo `App.jsx`. O resto da tabela permanece.

### 6.5 Carrinho usa o `sub`

Na função **loja-carrinho**, o `usuarioId` passa a ser o `sub` do token. Substitua `lambdas/carrinho/lambda_function.py` por:

```python
import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

tabela = boto3.resource("dynamodb").Table(os.environ["TABELA_CARRINHO"])


def _numero(valor):
    if isinstance(valor, Decimal):
        return int(valor) if valor % 1 == 0 else float(valor)
    return valor


def _usuario(event):
    return (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
        .get("sub")
    )


def _itens(usuario):
    resposta = tabela.query(KeyConditionExpression=Key("usuarioId").eq(usuario))
    itens = []
    for item in resposta.get("Items", []):
        itens.append(
            {
                "produtoId": item["produtoId"],
                "qtd": _numero(item["qtd"]),
                "preco": _numero(item["preco"]),
            }
        )
    return itens


def _total(itens):
    return sum(item["preco"] * item["qtd"] for item in itens)


def _resposta(status, payload):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(payload, ensure_ascii=False),
    }


def lambda_handler(event, context):
    metodo = (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method")
        or "GET"
    ).upper()

    usuario = _usuario(event)
    if not usuario:
        return _resposta(401, {"erro": "Token sem sub"})

    if metodo == "GET":
        itens = _itens(usuario)
        return _resposta(200, {"itens": itens, "total": _total(itens)})

    if metodo == "POST":
        bruto = event.get("body") or "{}"
        try:
            dados = json.loads(bruto) if isinstance(bruto, str) else bruto
        except json.JSONDecodeError:
            return _resposta(400, {"erro": "JSON inválido"})

        produto_id = dados.get("produtoId")
        if produto_id is None:
            return _resposta(400, {"erro": "Campo obrigatório: produtoId"})

        tabela.put_item(
            Item={
                "usuarioId": usuario,
                "produtoId": str(produto_id),
                "qtd": Decimal(str(dados.get("qtd", 1))),
                "preco": Decimal(str(dados.get("preco", 0))),
            }
        )
        itens = _itens(usuario)
        return _resposta(
            201,
            {"mensagem": "Item adicionado", "itens": itens, "total": _total(itens)},
        )

    if metodo == "DELETE":
        for item in tabela.query(
            KeyConditionExpression=Key("usuarioId").eq(usuario)
        ).get("Items", []):
            tabela.delete_item(
                Key={"usuarioId": usuario, "produtoId": item["produtoId"]}
            )
        return _resposta(200, {"mensagem": "Carrinho limpo", "itens": [], "total": 0})

    return _resposta(405, {"erro": f"Método {metodo} não permitido em /carrinho"})
```

Esse `sub` é um UUID do Cognito, estável para aquela conta. Empacote e envie só o ZIP do carrinho:

```bash
cd /home/jp/Projetos/loja-api-gateway
./scripts/empacotar.sh
```

Lambda → **loja-carrinho** → aba **Código** → **Fazer upload de** → **arquivo .zip** → `dist/loja-carrinho.zip` → **Salvar**.

Nenhuma variável de ambiente nova. A política da tabela `loja-carrinho` continua a mesma do passo 2.

### 6.6 Publicar de novo e provar

```bash
cd /home/jp/Projetos/loja-api-gateway/web
npm run build
```

S3 → o bucket do passo 5 → **Objetos** → **Carregar** → o conteúdo de `web/dist/` (`index.html` e a pasta `assets`), substituindo os arquivos antigos.

Pronto quando a URL do site abre a página **Entrar**, o primeiro usuário vê a tabela, adiciona um item, clica em **Sair**, o segundo entra e vê o carrinho vazio. Na tabela `loja-carrinho` → **Explorar itens**, a partition key é o `sub`, não `ana` nem `demo`. Os dois usuários estão fora de qualquer grupo: no topo da loja os dois aparecem como **cliente**.

`curl` deste passo em diante manda o access token. Para obter um, use o mesmo `InitiateAuth` (troque e-mail, senha e o id do client):

```bash
curl -s https://cognito-idp.us-east-1.amazonaws.com/ \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -d '{"AuthFlow":"USER_PASSWORD_AUTH","ClientId":"ID-DO-APP-CLIENT","AuthParameters":{"USERNAME":"EMAIL","PASSWORD":"SENHA"}}'
```

Copie `AuthenticationResult.AccessToken` e chame a loja:

```bash
curl -H "Authorization: Bearer SEU_ACCESS_TOKEN" "$BASE/carrinho"
```

Sem o header, a API responde `401` e a Lambda não chega a executar.

---

## Passo 7 — Admin que inclui produto

Dá para ter um superusuário da loja. Ele é um usuário do Cognito dentro do grupo `admin`. Não é um usuário IAM da conta AWS, e não é uma senha especial no React.

A regra é esta: **criar usuário deixa a pessoa como cliente**. O único lugar que promove alguém a admin é o console do Cognito, no grupo `admin`. A página não tem botão de promover. Quem não está no grupo continua cliente, mesmo que chame `POST /produtos` direto.

| Quem | O que vê no index | `POST /produtos` |
|------|-------------------|------------------|
| Cliente (padrão) | Tabela e carrinho | `403` |
| Usuário no grupo `admin` | Tabela, carrinho e o formulário de novo produto | `201` e o item entra na tabela |

A tela esconde o formulário lendo o token. A permissão de verdade está na Lambda: ela lê o claim `cognito:groups` que o autorizador do passo 6.3 já colocou no `event`.

### 7.1 Criar o grupo no console

**Serviço:** Cognito. **Recurso:** o user pool do passo 6.

1. Pesquisar → **Cognito** → **Grupos de usuários** → o seu pool.
2. Menu **Grupos** → **Criar grupo**.
3. Preencha:

| Campo | Valor |
|-------|--------|
| Nome do grupo | `admin` |
| Descrição | Pode incluir produto no catálogo |

4. **Criar grupo**. Precedência pode ficar em branco.

O nome tem que ser exatamente `admin`, minúsculo. É essa string que o Python e o React procuram.

### 7.2 Colocar uma pessoa no grupo

1. Ainda no pool → **Usuários**.
2. Clique no e-mail que vai ser o admin da demo.
3. Aba ou seção **Associação a grupos** / **Adicionar usuário ao grupo**.
4. Escolha `admin` → confirme.

O outro usuário fica sem grupo. Ele continua cliente. Não repita o passo 7.2 para ele.

O token antigo não ganha o grupo sozinho. A pessoa admin precisa clicar em **Sair** e entrar de novo. O access token novo traz `cognito:groups` com `admin`.

### 7.3 Permissão de gravar na tabela

O `GET /produtos` já tem `dynamodb:Scan` no perfil da função `loja-produtos` (passo 1.4). Incluir produto precisa de `PutItem` no mesmo perfil.

1. Lambda → função **loja-produtos** → **Configuração** → **Permissões**.
2. Clique no nome azul do perfil (`loja-produtos-role-...`).
3. IAM → **Adicionar permissões** → **Criar política em linha** → aba **JSON**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "dynamodb:PutItem",
      "Resource": "arn:aws:dynamodb:us-east-1:091914201633:table/loja-produtos"
    }
  ]
}
```

4. Nome: `loja-produtos-gravar`. **Criar política**.

A política `loja-produtos-scan` permanece. São duas políticas inline no mesmo perfil.

### 7.4 Rota `POST /produtos`

**Serviço:** API Gateway. **Recurso:** API `htorq210vb`.

1. Menu **Rotas** → **Criar**.
2. Método `POST`, caminho `/produtos`.
3. Integração: a Lambda **loja-produtos** (a mesma do `GET /produtos`).
4. Autorizador: `cognito`, o do passo 6.3.
5. Salve. Auto-deploy do stage `$default` publica a rota.

`GET /produtos` continua exigindo token e **não** exige o grupo. Cliente logado lê o catálogo. Só o `POST` desta rota passa pela checagem de admin na Lambda.

O CORS do passo 4.5 já lista `POST` e o header `authorization`. Não precisa abrir essa tela de novo.

### 7.5 Código da Lambda de produtos

Substitua `lambdas/produtos/lambda_function.py`. O `GET` é o do passo 1. O `POST` só grava se o claim tiver `admin`. O id novo é o maior `id` da tabela mais um. Para este catálogo de aula, isso basta.

```python
import json
import os
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")
tabela = dynamodb.Table(os.environ["TABELA_PRODUTOS"])


def _numero(valor):
    if isinstance(valor, Decimal):
        return int(valor) if valor % 1 == 0 else float(valor)
    return valor


def _claims(event):
    return (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
    )


def _grupos(event):
    bruto = _claims(event).get("cognito:groups", "")
    if isinstance(bruto, list):
        nomes = bruto
    else:
        texto = str(bruto).strip()
        if texto.startswith("[") and texto.endswith("]"):
            texto = texto[1:-1]
        nomes = texto.replace(",", " ").split()
    return [nome.strip().strip('"').strip("'") for nome in nomes if nome.strip()]


def _resposta(status, payload):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(payload, ensure_ascii=False),
    }


def _listar():
    itens = tabela.scan().get("Items", [])
    return [
        {
            "id": _numero(item["id"]),
            "nome": item["nome"],
            "preco": _numero(item["preco"]),
        }
        for item in itens
    ]


def lambda_handler(event, context):
    metodo = (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method")
        or "GET"
    ).upper()

    if metodo == "GET":
        return _resposta(200, {"produtos": _listar()})

    if metodo == "POST":
        if "admin" not in _grupos(event):
            return _resposta(403, {"erro": "Só o grupo admin inclui produto"})

        bruto = event.get("body") or "{}"
        try:
            dados = json.loads(bruto) if isinstance(bruto, str) else bruto
        except json.JSONDecodeError:
            return _resposta(400, {"erro": "JSON inválido"})

        nome = str(dados.get("nome") or "").strip()
        if not nome:
            return _resposta(400, {"erro": "Campo obrigatório: nome"})
        try:
            preco = Decimal(str(dados.get("preco")))
        except Exception:
            return _resposta(400, {"erro": "Campo obrigatório: preco numérico"})
        if preco <= 0:
            return _resposta(400, {"erro": "preco tem que ser maior que zero"})

        produtos = _listar()
        novo_id = max((item["id"] for item in produtos), default=0) + 1
        tabela.put_item(Item={"id": novo_id, "nome": nome, "preco": preco})
        return _resposta(201, {"id": novo_id, "nome": nome, "preco": _numero(preco)})

    return _resposta(405, {"erro": f"Método {metodo} não permitido em /produtos"})
```

O API Gateway às vezes entrega `cognito:groups` como lista, às vezes como texto (`admin` ou `[admin]`). `_grupos` aceita os três formatos.

Empacote e envie **só** na função de produtos:

```bash
cd /home/jp/Projetos/loja-api-gateway
./scripts/empacotar.sh
```

Lambda → **loja-produtos** → aba **Código** → **Fazer upload de** → `dist/loja-produtos.zip` → **Salvar**.

### 7.6 Formulário no index

Em `web/src/auth.js`, acrescente esta função ao lado de `usuarioNaTela`:

```javascript
export function ehAdmin() {
  const grupos = payload()["cognito:groups"] || [];
  const lista = Array.isArray(grupos) ? grupos : [grupos];
  return lista.includes("admin");
}
```

Em `web/src/api.js`, acrescente:

```javascript
export async function criarProduto(nome, preco) {
  const resposta = await fetch(`${BASE}/produtos`, {
    method: "POST",
    headers: cabecalhos(),
    body: JSON.stringify({ nome, preco: Number(preco) }),
  });
  return ler(resposta);
}
```

Em `web/src/App.jsx`, importe `ehAdmin` junto com `sair`, `token` e `usuarioNaTela`. Troque o texto do topo e passe a flag para a loja:

```jsx
<p className="text-sm text-neutral-600">
  {usuarioNaTela()} · {ehAdmin() ? "admin" : "cliente"}
</p>
```

```jsx
<Loja admin={ehAdmin()} />
```

Em `web/src/Loja.jsx`, importe `criarProduto` de `./api`. Troque só a assinatura, de `export default function Loja()` para `export default function Loja({ admin = false })`. Os estados de produtos, carrinho e erro continuam. Acrescente mais dois ao lado deles:

```jsx
const [nome, setNome] = useState("");
const [preco, setPreco] = useState("");
```

Cole este bloco **acima** da `<div className="grid ...">`, ainda dentro do `<main>`, depois da mensagem de erro:

```jsx
{admin ? (
  <form
    className="mb-6 flex flex-wrap items-end gap-3"
    onSubmit={async (event) => {
      event.preventDefault();
      setErro("");
      try {
        await criarProduto(nome, preco);
        setNome("");
        setPreco("");
        await carregar();
      } catch (e) {
        setErro(e.message);
      }
    }}
  >
    <label className="text-sm">
      Nome
      <input
        className="mt-1 block rounded border px-3 py-2"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
      />
    </label>
    <label className="text-sm">
      Preço
      <input
        className="mt-1 block rounded border px-3 py-2"
        type="number"
        min="0.01"
        step="0.01"
        value={preco}
        onChange={(e) => setPreco(e.target.value)}
        required
      />
    </label>
    <button className="rounded bg-neutral-900 px-3 py-2 text-sm text-white" type="submit">
      Incluir produto
    </button>
  </form>
) : null}
```

`carregar` já busca o catálogo de novo, então a linha nova aparece na tabela sem recarregar o navegador.

### 7.7 Prova

Entre com o usuário que você colocou no grupo (saia antes, se a sessão for antiga). O topo mostra **admin** e o formulário **Incluir produto**. Crie, por exemplo, nome `Monitor` e preço `900`. A tabela ganha a linha. No DynamoDB → `loja-produtos` → **Explorar itens**, o item está lá. O próximo `GET` de qualquer cliente também lista esse produto.

Saia e entre com o outro usuário. O topo mostra **cliente**. O formulário não aparece. A tabela mostra o Monitor.

Com o token do cliente, a API recusa a inclusão:

```bash
curl -i -H "Authorization: Bearer TOKEN_DO_CLIENTE" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Câmera","preco":500}' \
  "$BASE/produtos"
```

A resposta é `403` e o corpo traz `Só o grupo admin inclui produto`. A tabela do DynamoDB não ganha a Câmera.

O mesmo `curl` com o token do admin (login feito **depois** de entrar no grupo) responde `201`.

Publique de novo se for mostrar na URL do S3: `npm run build` em `web/` e carregue o conteúdo de `dist/` no bucket, como no passo 5.3.

---

## O que cada passo ainda simplifica

| Passo | O que já é verdade | O que ainda é atalho |
|-------|--------------------|----------------------|
| 1 | Catálogo fora do código | Carrinho ainda em memória |
| 2 | Carrinho sobrevive à Lambda | Todo mundo é o usuário `"demo"` |
| 3 | Carrinhos isolados por id | O cliente escolhe o próprio id |
| 4 | Index com tabela chamando a API | Só existe em `localhost`, sem login |
| 5 | Site público no S3 | Ainda sem login |
| 6 | Login; usuário novo é cliente | Qualquer cliente lê o catálogo; ninguém inclui produto pela API |
| 7 | Só o grupo `admin`, dado no console, inclui produto | Fora: pagamento, estoque, HTTPS via CloudFront |

---

## O que ficou pronto nesta conta

Isto não é um passo novo. É o registro do que a conta **grupo4-ecommerce-api** (`091914201633`, região `us-east-1`) já tem depois de seguir este guia. Os passos acima continuam valendo se alguém for repetir o caminho em outra conta.

Os passos 1 e 2 já estavam feitos antes desta rodada: as tabelas `loja-produtos` e `loja-carrinho`, as variáveis `TABELA_PRODUTOS` e `TABELA_CARRINHO`, a política de `Scan` na função de produtos e a de `Query` / `PutItem` / `DeleteItem` na função do carrinho. O `GET /produtos` já devolvia Notebook, Mouse e Teclado. O `POST /carrinho` gravava com `usuarioId` fixo `"demo"`.

A partir daí, o código e a AWS passaram a ser estes:

| Peça | Onde está |
|------|-----------|
| API | `loja-api`, id `htorq210vb`, URL `https://htorq210vb.execute-api.us-east-1.amazonaws.com` |
| Site | http://loja-grupo4-web-091914201633.s3-website-us-east-1.amazonaws.com |
| Front no repositório | pasta `web/` (`Login.jsx`, `Loja.jsx`, `api.js`, `auth.js`) |
| User pool | `us-east-1_HDkXooFY8`, nome `loja` |
| App client | `loja-web`, id `1n513d0dguvb7d9tsnkbes0k64`, sem client secret |
| Autorizador | JWT, nome `cognito`, nas rotas `GET` e `POST /produtos` e `GET` / `POST` / `DELETE /carrinho` |
| Grupo | `admin`, no mesmo user pool |

O catálogo ganhou um quarto item na prova do passo 7: `id` 4, nome `Monitor`, preço `900`.

### Como uma chamada anda

1. A pessoa abre o site do S3. Sem token no navegador, o React mostra só a página **Entrar**.
2. O formulário manda e-mail e senha direto ao Cognito (`InitiateAuth`, fluxo `USER_PASSWORD_AUTH`). A senha não passa pelo API Gateway nem pela Lambda.
3. O Cognito devolve um access token. O JavaScript guarda esse token e o e-mail digitado. O e-mail na tela sai desse valor guardado: o nome interno do usuário no pool é um UUID, não o e-mail.
4. Toda chamada da loja vai com `Authorization: Bearer <token>`.
5. O API Gateway confere o token no autorizador `cognito`. Token ausente ou inválido vira `401` e a Lambda não executa.
6. Token válido segue para a Lambda. No carrinho, o `usuarioId` da tabela é o `sub` do token, um id estável daquela pessoa. Dois logins diferentes têm dois carrinhos.
7. No `POST /produtos`, a Lambda ainda olha o claim `cognito:groups`. Sem a palavra `admin`, a resposta é `403`.

O botão **Adicionar** da tabela manda o `id` e o `preco` que o `GET /produtos` mostrou. A Lambda do carrinho não abre a tabela de produtos. Quem chama a API por fora, com um token válido, ainda pode mandar outro preço no JSON. A tela não oferece esse campo.

### Os dois logins

Os dois foram criados no user pool, com e-mail marcado como verificado e sem troca de senha no primeiro acesso. Criar o usuário não coloca ninguém no grupo `admin`.

| Papel na loja | E-mail para entrar | Senha | Grupo no Cognito |
|---------------|--------------------|-------|------------------|
| Cliente | `cliente.loja@example.com` | `ClienteLoja2026` | nenhum |
| Admin | `admin.loja@example.com` | `AdminLoja2026` | `admin` |

`admin.loja@example.com` não é um usuário IAM da conta AWS e não é uma senha especial no React. É um usuário comum do Cognito. A única diferença é a associação ao grupo `admin`, feita no console (Cognito → o pool → o usuário → adicionar ao grupo `admin`). O nome interno desse usuário no pool é `d4b87438-e071-707a-0e75-1f6144abac5a`. O login continua sendo o e-mail.

O cliente `cliente.loja@example.com` (nome interno `64d81488-5001-70c5-c20e-f418ab979ed2`) não foi colocado em grupo nenhum. Por isso entra como cliente.

O token antigo não ganha o grupo sozinho. Se alguém for acrescentado ao grupo `admin` depois, essa pessoa precisa sair e entrar de novo. O access token novo é que traz `cognito:groups` com `admin`.

### O que a tela faz com isso

A tela segue o desenho de uma loja grande, com a marca **loja.**: faixa escura, busca, vitrine em cards, página de carrinho e rodapé. Não usa o nome nem o logo da Amazon.

`web/src/auth.js` lê o miolo do access token. Se `cognito:groups` contiver `admin`, `ehAdmin()` é verdadeiro. A faixa de cima mostra o e-mail e, no menu, **Incluir produto** só para o admin. O cliente vê início, ofertas e carrinho.

Esconder o formulário não é a permissão. A permissão está na Lambda `loja-produtos`: o `POST` devolve `403` com a mensagem `Só o grupo admin inclui produto` quando o claim não tem `admin`. A política `loja-produtos-gravar`, no perfil da função, só libera `dynamodb:PutItem` na tabela `loja-produtos`. Quem passa na checagem do grupo é que grava. O id novo é o maior `id` da tabela mais um.

Prova já feita nesta conta:

- sem token, `GET /produtos` responde `401`
- com o token do cliente, `POST /produtos` com `{"nome":"Câmera","preco":500}` responde `403` e a Câmera não entra na tabela
- com o token do admin, `POST /produtos` com `{"nome":"Monitor","preco":900}` responde `201`
- o carrinho do admin e o do cliente ficam em partition keys diferentes (o `sub` de cada um)

### O que o Cognito não aceitou

O app client só tem URL de retorno `http://localhost:5173`. O Cognito recusou a URL `http://` do site no S3 como callback, porque esse endereço não é localhost e não é HTTPS. A página **Entrar** não usa esse redirect: ela envia a senha no `InitiateAuth`. O site publicado funciona assim mesmo. Um HTTPS na frente do bucket (CloudFront) fica fora deste guia.

# Guia do zero — Python em ZIP → Lambda + API Gateway

Fluxo deste trabalho:

1. Arrumar conta / Free Tier → `docs/conta_aws_free_tier.md`
2. Ter o código Python neste projeto
3. **Empacotar** em `.zip`
4. **Importar (upload)** na Lambda pela console
5. Ligar o **API Gateway** nas duas funções
6. Testar a URL pública

Não é obrigatório colar código no editor. Você desenvolve em Python no projeto e sobe o pacote — assim você aprende o fluxo real de deploy.

---

## 0) Conta e créditos (faça primeiro)

Siga: **[`docs/conta_aws_free_tier.md`](../docs/conta_aws_free_tier.md)**

Resumo: Free Tier / créditos bastam para esta demo; configure um **Budget** de alerta; não crie EC2.

---

## 1) Onde está o código Python

| Microserviço | Pasta | Arquivo que a Lambda executa |
|--------------|--------|------------------------------|
| Produtos | `lambdas/produtos/` | `lambda_function.py` |
| Carrinho | `lambdas/carrinho/` | `lambda_function.py` |

A AWS procura por padrão:

- arquivo: `lambda_function.py`
- função: `lambda_handler(event, context)`
- configuração Handler: `lambda_function.lambda_handler`

Abra os dois arquivos e leia o código **antes** de subir. Entenda o `return` com `statusCode` + `body` (string JSON).

---

## 2) Empacotar o ZIP (no seu computador)

O ZIP deve ter o `.py` na **raiz** (não dentro de uma pasta `produtos/`).

### Opção A — script do projeto

```bash
cd /home/jp/Projetos/loja-api-gateway
chmod +x scripts/empacotar.sh
./scripts/empacotar.sh
```

Isso gera:

- `dist/loja-produtos.zip`
- `dist/loja-carrinho.zip`

### Opção B — na mão

```bash
cd /home/jp/Projetos/loja-api-gateway

mkdir -p dist

cd lambdas/produtos
zip ../../dist/loja-produtos.zip lambda_function.py
cd ../carrinho
zip ../../dist/loja-carrinho.zip lambda_function.py
cd ../..
```

Confira:

```bash
unzip -l dist/loja-produtos.zip
```

Deve listar só algo como `lambda_function.py` (sem pastas na frente).

---

## 3) Criar a Lambda e **importar** o ZIP

### 3.1 Abrir o Lambda

1. https://console.aws.amazon.com/
2. Região no canto superior direito (anote; não mude depois).
3. Busca: **Lambda** → serviço Lambda.

### 3.2 Create function — `loja-produtos`

1. **Create function**
2. **Author from scratch**
3. Preencha:

| Campo | Valor |
|--------|--------|
| Function name | `loja-produtos` |
| Runtime | **Python 3.12** (ou Python 3.x mais novo) |
| Architecture | `x86_64` |

4. Permissions → **Create a new role with basic Lambda permissions**
5. **Create function**

Print: `evidencias/01-lambda-produtos.png`

### 3.3 Upload do ZIP (importar seu Python)

1. Aba **Code**
2. Botão **Upload from** → **.zip file**
3. **Upload** → escolha `dist/loja-produtos.zip`
4. **Save**
5. Aguarde o deploy do código

Se a UI mostrar **Deploy**, clique também.

### 3.4 Conferir o Handler

Em **Runtime settings** (na Code ou em Configuration):

- Handler = `lambda_function.lambda_handler`

Se estiver errado → **Edit** → corrija → Save.

### 3.5 Testar na console (sem API Gateway ainda)

1. Aba **Test**
2. Crie evento `teste-get`:

```json
{
  "httpMethod": "GET",
  "path": "/produtos"
}
```

3. **Test** → deve aparecer `statusCode: 200` e a lista de produtos no `body`.

**Checkpoint:** upload ZIP funcionou; a função roda na AWS.

---

## 4) Segunda Lambda — `loja-carrinho`

1. Volte em **Functions** → **Create function** → Author from scratch  
   Nome: `loja-carrinho` · mesmo Runtime · nova role básica.
2. **Upload from** → `.zip file` → `dist/loja-carrinho.zip` → Save.
3. Handler: `lambda_function.lambda_handler`
4. Testes:

**GET**

```json
{
  "httpMethod": "GET",
  "path": "/carrinho"
}
```

**POST** (note: `body` é string)

```json
{
  "httpMethod": "POST",
  "path": "/carrinho",
  "body": "{\"produtoId\": 1, \"qtd\": 2, \"preco\": 3500}"
}
```

Print: `evidencias/02-lambda-carrinho.png`

---

## 5) API Gateway **HTTP API** — uma URL, duas Lambdas

Nesta atividade usamos **HTTP API** (mais simples na console que a REST API).

O Gateway recebe o HTTP, **roteia** pelo path e chama a Lambda certa.  
Nossos `lambda_function.py` já devolvem `statusCode` + `body` (string), que é o formato esperado.

### 5.1 Criar a HTTP API

1. Busca no topo: **API Gateway** → abra o serviço  
2. **Create API**  
3. No card **HTTP API** → **Build**  
   (não escolha REST API nem WebSocket)  
4. Em **Integrations** / Add integration:
   - Integration type: **Lambda**
   - **Add integration** → escolha `loja-produtos` (mesma região)
   - **Add integration** de novo → escolha `loja-carrinho`
5. **API name:** `loja-api`
6. **Next**

### 5.2 Configurar as rotas (roteamento)

Na etapa **Configure routes**, crie:

| Method | Path | Integration (Lambda) |
|--------|------|----------------------|
| `GET` | `/produtos` | `loja-produtos` |
| `GET` | `/carrinho` | `loja-carrinho` |
| `POST` | `/carrinho` | `loja-carrinho` |
| `DELETE` | `/carrinho` | `loja-carrinho` (opcional) |

Como fazer (a UI varia um pouco):

1. **Add route** (ou edite as que o assistente sugeriu)
2. Method + Path + aponte para a integration da Lambda correta
3. Remova rotas automáticas estranhas (`ANY /{proxy+}` etc.), se atrapalharem

**Checkpoint:** `/produtos` e `/carrinho` apontam para Lambdas **diferentes**.

Print: `evidencias/03-api-routes.png`

**Next**.

### 5.3 Stages e criação

1. Deixe o stage **`$default`** (HTTP API já publica)
2. Auto-deploy costuma vir ligado
3. **Next** → revise → **Create** / **Create and deploy**

Se a console pedir permissão para invocar as Lambdas → **Allow** / conceda.

### 5.4 Copiar a Invoke URL

1. Na página da API `loja-api`, copie a **Invoke URL**  
   (às vezes em Stages → `$default`)
2. Parece com:

```text
https://abc123xyz.execute-api.us-east-1.amazonaws.com
```

3. Cole em `evidencias/06-url-publica.txt`

URLs finais:

```text
https://...amazonaws.com/produtos
https://...amazonaws.com/carrinho
```

(sem stage `/prod` no meio — isso é coisa de REST API)

---

## 6) Provar na URL pública

```bash
export BASE="https://SUA-URL.execute-api.REGIAO.amazonaws.com"

curl -s "$BASE/produtos"; echo
curl -s "$BASE/carrinho"; echo

curl -s -X POST "$BASE/carrinho" \
  -H "Content-Type: application/json" \
  -d '{"produtoId": 1, "qtd": 1, "preco": 3500}'
echo

curl -s "$BASE/carrinho"; echo
```

Salve saídas em `evidencias/04-curl-produtos.txt` e `05-curl-carrinho.txt`.

**Ideia para a prova/vídeo:** mesma `BASE`, paths diferentes → HTTP API roteando para microserviços (Lambdas) diferentes.

---

## 7) Quando você alterar o Python

1. Edite `lambdas/.../lambda_function.py` no projeto  
2. Rode de novo `./scripts/empacotar.sh`  
3. Na Lambda → Upload from → novo ZIP → Save  

Assim você treina o ciclo real: **código → pacote → upload**.

---

## 8) Problemas frequentes

| Sintoma | Causa / correção |
|---------|------------------|
| `Unable to import module 'lambda_function'` | ZIP com pasta errada; `lambda_function.py` precisa estar na raiz do zip |
| Handler not found | Runtime settings ≠ `lambda_function.lambda_handler` |
| 403 na URL | Falta permissão API Gateway → Lambda |
| 500 | Abra Monitor → CloudWatch Logs; erro no Python |
| 404 na URL | Rota não criada ou path digitado errado |
| Cobrança / medo de fatura | `docs/conta_aws_free_tier.md` + Budget; apague recursos depois |

---

## 9) Evidências da entrega

- [ ] `01-lambda-produtos.png`
- [ ] `02-lambda-carrinho.png`
- [ ] `03-api-routes.png`
- [ ] `04-curl-produtos.txt`
- [ ] `05-curl-carrinho.txt`
- [ ] `06-url-publica.txt`

---

## Próximos

- `exercicios/01_entender_evento.md`
- `exercicios/02_adicionar_rota.md` (opcional)
- Limpar recursos após o vídeo (`docs/conta_aws_free_tier.md` seção 5)

# Conceitos AWS do zero (para a atividade da Loja)

Este texto é o **começo**. Não assume que você já sabe o que é Lambda, API Gateway ou Free Tier.

No final você deve conseguir explicar, com suas palavras:

1. O que é a nuvem / a AWS  
2. O que é uma **função Lambda**  
3. O que é o **API Gateway** e o que é **roteamento**  
4. Por que isso parece “microserviço”  
5. O que você vai montar na prática nesta disciplina  

Depois disso:

- Conta e créditos → `docs/conta_aws_free_tier.md`  
- Subir o Python em ZIP → `exercicios/03_deploy_aws.md`

---

## 1) O problema que a atividade quer resolver

Imagine uma **loja online** com duas partes:

| Parte | O que faz |
|--------|-----------|
| **Produtos** | Devolve a lista do catálogo |
| **Carrinho** | Guarda / mostra os itens que o cliente escolheu |

No “mundo antigo”, muita gente colocava **tudo num único programa** num único servidor:

```
Um servidor gigante
 └── /produtos  e  /carrinho  no mesmo código
```

Problemas desse modelo (visão simplificada da disciplina):

- Se o carrinho quebrar, pode derrubar produtos também  
- Times diferentes brigam no mesmo código  
- Escalar (atender mais gente) significa reforçar **tudo**, não só o que está sobrecarregado  

A ideia de **microserviços** (versão didática):

```
Serviço Produtos   ←  programa separado
Serviço Carrinho   ←  outro programa separado
```

Cada um pode ser desenvolvido, publicado e escalado **sozinho**.

Mas aí nasce outra pergunta:

> Se são serviços separados, o cliente (navegador, app, Postman) precisa conhecer **vários endereços**?

A resposta da atividade: **não**. Colocamos um **portão de entrada único**.

```
Cliente
   │
   ▼
Portão único (API Gateway)     ← uma URL só
   ├── /produtos  → serviço Produtos
   └── /carrinho  → serviço Carrinho
```

Isso se chama **roteamento**: olhar o caminho da URL (`/produtos` vs `/carrinho`) e mandar o pedido para o serviço certo.

Na AWS, o portão é o **Amazon API Gateway**.  
Cada “serviço” pequeno, nesta atividade, é uma **função AWS Lambda**.

---

## 2) O que é “a nuvem” e o que é a AWS

### Computador em casa vs nuvem

- **Em casa / na faculdade:** você liga um PC, instala Python, deixa o programa rodando. Se desligar, acabou.  
- **Nuvem:** empresas alugam pedaços de computadores gigantes em data centers. Você usa pelo navegador / internet e paga (ou usa grátis até um limite) pelo que consumir.

**AWS (Amazon Web Services)** = a nuvem da Amazon: um **catálogo enorme de serviços** (armazenamento, banco, redes, funções, etc.).

Você não “instala a AWS”. Você:

1. Cria uma **conta**  
2. Entra na **Console** (site de administração)  
3. Liga os serviços que precisa (aqui: Lambda + API Gateway)

### Região (Region)

Os data centers da AWS ficam em vários lugares do mundo (**regiões**), ex.:

- `us-east-1` — Norte da Virgínia (EUA)  
- `sa-east-1` — São Paulo  

**Regra de ouro desta atividade:** escolha **uma** região no canto superior direito da console e **não mude**. Lambda e API Gateway precisam estar na **mesma** região.

### Conta, cobrança e Free Tier (ideia geral)

- A AWS tem **Free Tier / créditos** para estudar (detalhes em `docs/conta_aws_free_tier.md`).  
- Esta atividade (2 funções minúsculas + API) costuma ficar **dentro do grátis**, se você **não** criar máquinas EC2, bancos RDS, etc.  
- Mesmo assim, configure um **alerta de orçamento (Budget)**.

---

## 3) Console, serviços e a ideia de “lego”

A **AWS Management Console** é o painel web.

Cada capacidade é um **serviço** com nome próprio:

| Serviço | Para que serve (em uma frase) |
|---------|--------------------------------|
| **IAM** | Quem pode fazer o quê (usuários, permissões) |
| **Lambda** | Rodar **seu código** sob demanda, sem você gerenciar servidor |
| **API Gateway** | Expor **URL HTTP** pública e **rotear** pedidos |
| **CloudWatch** | Logs e monitoramento (ver erros da Lambda) |
| **Billing** | Conta, fatura, Free Tier, alertas |

Você monta a solução **encaixando serviços**, como Lego:

```
[ API Gateway ]  → chama →  [ Lambda produtos ]
                 → chama →  [ Lambda carrinho ]
                              ↓
                         [ CloudWatch Logs ]
```

---

## 4) O que é um “servidor” (e por que a Lambda existe)

### Modelo clássico (servidor sempre ligado)

1. Você aluga uma máquina virtual (**EC2** ≈ computador na nuvem)  
2. Instala sistema, Python, sua API  
3. A máquina fica **ligada 24h**, esperando alguém acessar  
4. Você paga (em geral) pelo tempo que ela existe, mesmo ociosa  

Útil para muita coisa — **não** é o foco desta atividade.

### Modelo Lambda (“serverless”)

**Serverless** não significa “sem servidor nenhum”. Significa: **você não administra o servidor**. A AWS sobe a infraestrutura por trás quando seu código precisa rodar.

**AWS Lambda** = serviço que executa uma **função** do seu código quando algo a **invoca** (chama).

Analogia:

| Coisa do dia a dia | Na Lambda |
|--------------------|-----------|
| Uma receita de bolo (o código) | Seu arquivo Python |
| Alguém pedindo o bolo | Uma **invocação** (API Gateway, botão Test, etc.) |
| A cozinha da AWS | Infraestrutura que você não gerencia |
| Você limpa a cozinha depois | A AWS “desliga” quando acaba (você não mantém EC2) |

### O que você envia para a Lambda

Nesta atividade: um arquivo Python chamado tipicamente `lambda_function.py` com uma função:

```python
def lambda_handler(event, context):
    # seu código
    return { ... }
```

| Nome | Significado |
|------|-------------|
| `lambda_handler` | Nome **padrão** da função de entrada (a AWS chama essa função) |
| `event` | Um **dicionário** com os dados do pedido (método HTTP, path, body…) |
| `context` | Informações da execução (quase não usamos no trabalho) |
| `return` | O que a Lambda devolve (para API Gateway: status + JSON) |

A configuração **Handler** na console:

```text
lambda_function.lambda_handler
```

significa: “no arquivo `lambda_function.py`, rode a função `lambda_handler`”.

### Como a Lambda “entra” no ar

Você:

1. Escreve o Python no projeto  
2. Gera um **`.zip`**  
3. Na console: cria a função → **Upload** do ZIP  

A AWS guarda o pacote. Quando alguém chama, ela executa.

### Cold start (só para você não se assustar)

Às vezes a primeira chamada demora um pouquinho a mais (“esquentar” o ambiente). Nas seguintes fica mais rápido. Para a demo da disciplina isso é irrelevante.

### Estado em memória (importante no carrinho)

Variáveis globais na Lambda **não** são um banco de dados confiável. A instância pode “morrer” e o carrinho “esquecer”.  
Na atividade isso é **aceitável** (foco é roteamento). Em produção usaria DynamoDB, etc.

---

## 5) O que é uma API HTTP (bem básico)

Quando o navegador ou o `curl` acessa:

```text
GET https://algo.amazonaws.com/produtos
```

Isso é um **pedido HTTP**:

| Peça | Exemplo | Significado |
|------|---------|-------------|
| Método | `GET`, `POST`, `DELETE` | O que você quer fazer (ler, criar, apagar…) |
| URL / path | `/produtos` | Qual “recurso” |
| Body | JSON no POST | Dados enviados |
| Resposta | status `200` + JSON | O que o servidor devolveu |

Nesta atividade:

- `GET /produtos` → lista produtos  
- `GET /carrinho` → mostra carrinho  
- `POST /carrinho` → adiciona item  

---

## 6) O que é o API Gateway

**Amazon API Gateway** = serviço que cria uma **porta de entrada HTTP** na internet para a sua solução.

Ele:

1. Recebe o request do cliente  
2. Olha método + path (**roteamento**)  
3. Chama a **integração** configurada (aqui: uma Lambda)  
4. Devolve a resposta HTTP para o cliente  

Você ganha uma **Invoke URL**, algo como:

```text
https://abc123.execute-api.us-east-1.amazonaws.com
```

O cliente usa:

```text
https://abc123...amazonaws.com/produtos
https://abc123...amazonaws.com/carrinho
```

**Mesma base URL** → dois serviços atrás. É exatamente o conceito do enunciado:

> “Uma única URL pode esconder vários serviços rodando atrás dela.”

### HTTP API vs REST API (não se confunda)

No API Gateway existem **tipos diferentes**. Os dois fazem “URL → backend”, mas a console muda.

| | **HTTP API** (vamos usar) | **REST API** |
|--|---------------------------|--------------|
| Estilo | Mais nova e enxuta | Clássica, mais telas |
| Roteamento | Routes (`GET /produtos`) | Resources + Methods |
| Publicar | Stage `$default` já publica | Precisa Deploy em stage (`/prod`) |
| Event na Lambda | Costuma vir payload 2.0 (`requestContext.http.method`) | Costuma ter `httpMethod` no topo |

**Por que HTTP API aqui?** Menos cliques, mais fácil de aprender o roteamento e mais barata.  
O código Python aceita **os dois** formatos de `event` (útil se um dia você comparar com REST).

Nesta atividade: **HTTP API** + duas Lambdas.

### Quem monta o `event` da Lambda?

O **API Gateway**. Ele transforma o HTTP em um JSON (`event`) e entrega para `lambda_handler`.  
Por isso no código você lê coisas como `event["httpMethod"]` ou `event["requestContext"]["http"]["method"]` (o formato muda um pouco entre tipos de API — nossos códigos tratam os dois).

### Formato de resposta que a Lambda devolve

Para o Gateway devolver HTTP de verdade, a Lambda costuma retornar:

```python
{
  "statusCode": 200,
  "headers": {"Content-Type": "application/json"},
  "body": "{\"produtos\": [...]}"   # string!
}
```

Pontos de estudo:

- `body` é **string** (use `json.dumps`)  
- `statusCode` vira o status HTTP (200, 404, 400…)  

---

## 7) IAM — permissões (só o necessário)

**IAM** = Identity and Access Management (quem pode fazer o quê).

Nesta atividade aparecem duas ideias:

### Role (papél) de execução da Lambda

Quando você cria a Lambda com  
**“Create a new role with basic Lambda permissions”**, a AWS cria um papel que permite à função **escrever logs no CloudWatch**.  
Sem isso, a função até roda, mas você não vê logs direito / pode falhar políticas básicas.

### Permissão “API Gateway pode chamar a Lambda”

O Gateway precisa de autorização para **invocar** sua função.  
Ao criar a integração na console, a AWS geralmente **já pergunta e adiciona** isso.  
Se a URL der 403, quase sempre é essa permissão faltando.

Você **não** precisa virar especialista em IAM para passar na atividade — só saber que **nada na AWS fala com nada sem permissão**.

---

## 8) CloudWatch — onde ver o erro

Se a URL retornar **500**, o erro está quase sempre no **código Python**.

Caminho típico:

1. Lambda → aba **Monitor** → **View CloudWatch logs**  
2. Abra o stream mais recente  
3. Leia a mensagem de exceção  

`print(...)` no código aparece nesses logs. Útil para estudar o `event` real.

---

## 9) Microserviços nesta atividade (o que é “de verdade” e o que é simulação)

**De verdade (conceito):**

- Duas unidades independentes (duas Lambdas)  
- Contratos HTTP separados  
- Deploy separado (dois ZIPs)  
- Entrada única (API Gateway)  

**Simulação / simplificação didática:**

- Sem banco de dados  
- Carrinho em memória  
- Sem autenticação  
- Código no mesmo repositório de estudo (na vida real poderiam ser repos/times diferentes)  

O professor quer ver o **roteamento e o desacoplamento**, não um e-commerce completo.

---

## 10) Mapa mental da solução final

```
┌─────────────────────────────────────────────────────────┐
│  Seu computador                                         │
│   - edita lambdas/produtos/lambda_function.py           │
│   - edita lambdas/carrinho/lambda_function.py           │
│   - roda ./scripts/empacotar.sh  →  dist/*.zip          │
└───────────────────────────┬─────────────────────────────┘
                            │ upload ZIP na console
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Conta AWS (uma região, ex. us-east-1)                  │
│                                                         │
│   API Gateway HTTP API  "loja-api"                      │
│      Invoke URL pública                                 │
│         GET  /produtos  ──────────►  Lambda loja-produtos│
│         GET  /carrinho  ─┐                              │
│         POST /carrinho  ─┼────────►  Lambda loja-carrinho│
│         DELETE /carrinho─┘                              │
│                                                         │
│   CloudWatch Logs  ◄── erros e prints das Lambdas       │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ curl / navegador / Postman
                         Cliente
```

---

## 11) Glossário rápido

| Termo | Em português claro |
|-------|--------------------|
| **AWS** | Nuvem da Amazon; catálogo de serviços |
| **Console** | Site onde você clica e configura |
| **Região** | Local geográfico dos data centers que você escolheu |
| **Lambda** | Roda seu Python sob demanda, sem você cuidar de servidor |
| **Handler** | Função de entrada (`lambda_handler`) |
| **Event** | Dados de entrada (dict) da invocação |
| **ZIP** | Pacote do seu código para upload |
| **API Gateway** | URL HTTP + roteamento para backends (Lambdas) |
| **Rota** | Método + path (`GET /produtos`) |
| **Integração** | “Para onde essa rota aponta” (qual Lambda) |
| **Invoke URL** | Endereço público base da sua API |
| **IAM Role** | Identidade com permissões que a Lambda assume |
| **CloudWatch** | Logs e métricas |
| **Free Tier / créditos** | Uso gratuito ou com crédito para estudar |
| **Microserviço** | Pedacinho de sistema independente (aqui: cada Lambda) |
| **Desacoplamento** | Um serviço não precisa ser o mesmo programa que o outro |
| **Roteamento** | Encaminhar o pedido conforme a URL |

---

## 12) Como estudar (ordem recomendada)

1. **Reler este arquivo** e tentar explicar para um colega em 3 minutos o diagrama da seção 10.  
2. Abrir e **ler** (sem ainda subir):  
   - `lambdas/produtos/lambda_function.py`  
   - `lambdas/carrinho/lambda_function.py`  
3. Arrumar a conta: `docs/conta_aws_free_tier.md`  
4. Fazer o deploy guiado: `exercicios/03_deploy_aws.md`  
5. Consolidar o `event`: `exercicios/01_entender_evento.md`  
6. Montar PPT/DOC/vídeo com `docs/roteiro_*.md`

### Teste se você entendeu (responda no caderno)

1. Lambda substitui o quê, na prática, nesta atividade?  
2. Quem recebe a URL pública: a Lambda ou o API Gateway?  
3. O que diferencia `/produtos` de `/carrinho` no Gateway?  
4. Por que o `body` da resposta é string?  
5. Por que duas Lambdas e não uma só com `if path == ...`? (pense em desacoplamento)

---

## Frase para a apresentação

> “Criamos dois microserviços como funções Lambda. O API Gateway é o ponto de entrada único: ele roteia `/produtos` e `/carrinho` para funções diferentes, então o cliente só conhece uma URL.”

# Exercício 01 — Entender o "event" na AWS

## Por que isso importa?

Na AWS, a Lambda **não** recebe um objeto Request de Flask/Django. O API Gateway monta um **dicionário JSON** (`event`) e passa para sua função. Sem entender isso, qualquer 500 fica misterioso.

## Tarefa A — Testar o handler na console da Lambda

Ainda **antes** (ou logo após) criar o API Gateway:

1. Crie a Lambda `loja-produtos` (exercício 03), **importe** o ZIP de `lambdas/produtos` e use o código de `lambda_function.py`.
2. Na aba **Test**, crie um evento com:
   ```json
   {
     "httpMethod": "GET",
     "path": "/produtos"
   }
   ```
3. Execute o teste. Observe o retorno: `statusCode`, `headers`, `body`.
4. Repita com a Lambda `loja-carrinho` usando:
   ```json
   {
     "httpMethod": "POST",
     "path": "/carrinho",
     "body": "{\"produtoId\": 2, \"qtd\": 1, \"preco\": 80}"
   }
   ```
   Note: no `event`, o **`body` é string** (JSON dentro de string) — igual ao que o Gateway envia.

### Suas anotações

```
GET /produtos — o que veio em statusCode e body?
- ...

POST /carrinho — o body do event era str ou dict?
- ...
```

## Tarefa B — Dois formatos de event (leitura + console)

Pesquise a diferença entre:

- **REST API** + proxy → costuma ter `event["httpMethod"]`
- **HTTP API** (payload 2.0) → costuma ter `event["requestContext"]["http"]["method"]`

Nossos handlers aceitam os dois de propósito. Depois do deploy do Gateway (exercício 03):

1. Chame a URL pública com `curl`.
2. Abra **CloudWatch → Log groups** da Lambda (ou Monitor → View CloudWatch logs).
3. (Opcional) Adicione temporariamente no início de `lambda_handler`:
   ```python
   print(json.dumps(event))
   ```
   Clique **Deploy**, chame de novo e veja no log o event **real** que o Gateway mandou.

```
Minha explicação (por que o código trata os dois formatos):
...

Chaves que vi no CloudWatch (se fez o print):
...
```

## Tarefa C — Formato da resposta

Olhando o código e o teste na console, responda:

1. Por que `body` na **resposta** também é string (`json.dumps`)?
2. Quem transforma isso em HTTP “de verdade” para o cliente: a Lambda ou o API Gateway?

```
Respostas:
1. ...
2. ...
```

## Critério de “feito”

- [ ] Explica `statusCode` / `headers` / `body`
- [ ] Sabe que o `body` do request no event é string
- [ ] Entende: Gateway roteia; Lambda só processa o event já entregue

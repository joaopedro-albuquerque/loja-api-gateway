# Exercício 02 — Estender a loja na AWS (você implementa)

Faça **pelo menos duas** das tarefas. Depois de alterar o código Python, atualize a Lambda na console (colar de novo ou upload ZIP) e, se criar rota nova, ajuste o **API Gateway**.

---

## Tarefa 1 — `GET /produtos/{id}`

Hoje só existe a lista completa.

1. No **API Gateway**, crie a rota `GET /produtos/{id}` apontando para a mesma Lambda `loja-produtos` (ou outra, se preferir separar).
2. No handler, leia o id em `event.get("pathParameters")` (HTTP API / REST costumam preencher isso).
3. Se houver id: devolva **um** produto ou **404**. Sem id (rota `/produtos`): mantenha a lista.

Teste:

```bash
curl "$BASE/produtos"
curl "$BASE/produtos/2"
curl "$BASE/produtos/99"   # deve ser 404
```

---

## Tarefa 2 — Carrinho e preços (cuidado com acoplamento)

Hoje o POST aceita `preco` no body (ou assume 0).

Escolha **uma** opção e **justifique** no DOC da entrega:

- **A)** Mapa de preços dentro da Lambda do carrinho (duplica dado, simples).
- **B)** Duas Lambdas no mesmo ZIP/repo importando o mesmo catálogo — fácil, mas **não** parece microserviço de verdade.
- **C)** (Avançado) Carrinho chama a URL pública/interna de `/produtos` via HTTP — comunicação entre serviços.

Escreva 5–10 linhas com o trade-off.

---

## Tarefa 3 — Nova rota `/health`

1. Crie `lambdas/health/lambda_function.py` com `lambda_handler` retornando `{"status": "ok"}`.
2. Na AWS: nova Lambda (Author from scratch) + rota `GET /health` no **mesmo** API Gateway.
3. Evidência: `curl "$BASE/health"`.

Isso reforça: **novo microserviço = nova Lambda + nova rota**, sem reescrever produtos/carrinho.

---

## Tarefa 4 (opcional) — Validação

No carrinho, rejeite `qtd <= 0` com status 400.

---

## Checklist

- [ ] Funciona na **URL do API Gateway** (não só no Test da Lambda)
- [ ] Você explica a mudança em ~1 minuto (útil no vídeo)
- [ ] Trade-off da tarefa 2 anotado

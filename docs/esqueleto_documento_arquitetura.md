# Documento de arquitetura (esqueleto para o DOCX)

Copie para Word e complete com suas palavras + evidências.

## 1. Objetivo

Descrever a solução da “Loja” usando API Gateway como ponto de entrada único e duas funções AWS Lambda simulando microserviços (`produtos` e `carrinho`).

## 2. Conceito distribuído

- API Gateway & Roteamento
- Centralização do acesso
- Desacoplamento de rotas / serviços

*(Explique com suas palavras, 1–2 parágrafos.)*

## 3. Arquitetura na AWS

- Diagrama (cole o desenho)
- Recursos:
  - API Gateway (**HTTP API**) — Invoke URL: ________
  - Rotas: `/produtos` e `/carrinho` → Lambdas distintas
  - Lambda `loja-produtos`
  - Lambda `loja-carrinho`
  - IAM Role (execução)
  - CloudWatch Logs (observabilidade básica)

## 4. Contratos das APIs

| Método | Rota | Serviço | Resposta |
|--------|------|---------|----------|
| GET | /produtos | produtos | lista JSON |
| GET | /carrinho | carrinho | itens + total |
| POST | /carrinho | carrinho | adiciona item |

## 5. Evidências

Insira prints e resultados de `curl` da pasta `evidencias/`.

## 6. Limitações conscientes (bom na nota)

- Estado do carrinho em memória (não persistente)
- Sem autenticação
- Sem banco de dados
- Foco pedagógico no roteamento

## 7. Conclusão

*(O que o grupo aprendeu sobre entrada única e microserviços.)*

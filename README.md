# Loja — API Gateway + Microserviços

O front em React fala com um **API Gateway (HTTP API)**. O gateway roteia `/produtos` e `/carrinho` para duas funções **Lambda** em Python. Os dados ficam no DynamoDB e o login fica no Cognito.

| Rota | Lambda | Código-fonte |
|------|--------|----------------|
| `/produtos` | `loja-produtos` | `lambdas/produtos/lambda_function.py` |
| `/carrinho` | `loja-carrinho` | `lambdas/carrinho/lambda_function.py` |

```
Cliente (navegador)
              │
              ▼
        API Gateway (HTTP API)
       /produtos ──► Lambda loja-produtos
       /carrinho ──► Lambda loja-carrinho
```

## Front local

Na pasta `web`:

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

O Vite abre em [http://localhost:5173](http://localhost:5173).

Para gerar os arquivos estáticos e abrir o preview do build:

```bash
npm run build
npm run preview
```

`web/.env` fica fora do Git. `web/.env.example` traz a URL pública da API (`VITE_API_BASE`) e o client id do Cognito (`VITE_COGNITO_CLIENT_ID`), os mesmos valores que o navegador já recebe.

## Lambdas

Edite o código em `lambdas/`. Para gerar os ZIPs de deploy:

```bash
./scripts/empacotar.sh
```

O script grava `dist/loja-produtos.zip` e `dist/loja-carrinho.zip`.

Para chamar o `lambda_handler` nesta máquina, com as credenciais já configuradas na AWS CLI e as tabelas reais (`TABELA_PRODUTOS` = `loja-produtos`, `TABELA_CARRINHO` = `loja-carrinho`):

```bash
python3 scripts/invocar_local.py produtos
python3 scripts/invocar_local.py carrinho --sub usuario-local
```

O script monta um evento de HTTP API (payload 2.0) e imprime o status e o corpo. A região usada é a do perfil da AWS CLI; se o perfil não tiver região, o script usa `us-east-1`. É preciso ter `boto3` instalado.

`POST` e `DELETE` gravam nas tabelas de verdade:

```bash
python3 scripts/invocar_local.py produtos --metodo POST --grupo admin \
  --body '{"nome":"Caneta","preco":2.5}'

python3 scripts/invocar_local.py carrinho --metodo POST --sub usuario-local \
  --body '{"produtoId":"1","qtd":1,"preco":10}'
```

No carrinho, omitir `--sub` usa a chave `usuario-local`.

## Deploy automático

Merge ou push na `main` publica na AWS que já está no ar. Os workflows também aceitam disparo manual em Actions.

- Mudança em `lambdas/` ou `scripts/`: [`.github/workflows/backend.yml`](.github/workflows/backend.yml) roda `scripts/empacotar.sh`. Na `main`, atualiza o código das funções `loja-produtos` e `loja-carrinho`.
- Mudança em `web/`: [`.github/workflows/frontend.yml`](.github/workflows/frontend.yml) usa Node 22, `npm ci` e `npm run build`. Na `main`, envia `web/dist` para o bucket do site.

A branch `develop` executa o mesmo empacotamento e o mesmo build. A publicação ocorre no push da `main`: o job assume a role por OIDC e lê o environment `production` (`AWS_REGION`, `S3_BUCKET`, `VITE_API_BASE`, `VITE_COGNITO_CLIENT_ID` e o secret `AWS_ROLE_ARN`).

## Material de estudo

1. Conceitos → [`docs/conceitos_aws_do_zero.md`](docs/conceitos_aws_do_zero.md)
2. Conta e Free Tier → [`docs/conta_aws_free_tier.md`](docs/conta_aws_free_tier.md)
3. Código Python em `lambdas/`
4. Deploy manual na console → [`exercicios/03_deploy_aws.md`](exercicios/03_deploy_aws.md)
5. Formato do `event` → [`exercicios/01_entender_evento.md`](exercicios/01_entender_evento.md)
6. Nova rota → [`exercicios/02_adicionar_rota.md`](exercicios/02_adicionar_rota.md)
7. PPT, documento e vídeo → `docs/roteiro_apresentacao.md`, `docs/esqueleto_documento_arquitetura.md`, `docs/roteiro_video.md`
8. DynamoDB, front e login → [`docs/progressao_front_e_persistencia.md`](docs/progressao_front_e_persistencia.md)

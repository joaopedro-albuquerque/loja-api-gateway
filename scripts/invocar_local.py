#!/usr/bin/env python3
"""Chama lambda_handler na máquina local, nas tabelas DynamoDB reais.

Usa as credenciais já configuradas na AWS CLI. Antes de importar o código,
define TABELA_PRODUTOS=loja-produtos e TABELA_CARRINHO=loja-carrinho.

Exemplos:
  python3 scripts/invocar_local.py produtos
  python3 scripts/invocar_local.py carrinho --sub usuario-local
  python3 scripts/invocar_local.py produtos --metodo POST --grupo admin \\
      --body '{"nome":"Caneta","preco":2.5}'
"""

import argparse
import importlib.util
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TABELAS = {
    "produtos": ("TABELA_PRODUTOS", "loja-produtos"),
    "carrinho": ("TABELA_CARRINHO", "loja-carrinho"),
}
CAMINHOS = {
    "produtos": "/produtos",
    "carrinho": "/carrinho",
}


def garantir_regiao():
    try:
        import boto3
    except ModuleNotFoundError:
        raise SystemExit(
            "boto3 não está instalado. Rode: python3 -m pip install boto3"
        )
    if os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION"):
        return
    if not boto3.Session().region_name:
        os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


def carregar(nome):
    chave, tabela = TABELAS[nome]
    os.environ[chave] = tabela
    origem = ROOT / "lambdas" / nome / "lambda_function.py"
    spec = importlib.util.spec_from_file_location(f"lambda_{nome}", origem)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Não foi possível carregar {origem}")
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo.lambda_handler


def evento(metodo, caminho, body, sub, grupo):
    pedido = {
        "version": "2.0",
        "routeKey": f"{metodo} {caminho}",
        "rawPath": caminho,
        "rawQueryString": "",
        "headers": {"content-type": "application/json"},
        "requestContext": {
            "http": {"method": metodo, "path": caminho},
        },
        "isBase64Encoded": False,
    }
    if body is not None:
        pedido["body"] = body
    claims = {}
    if sub:
        claims["sub"] = sub
    if grupo:
        claims["cognito:groups"] = grupo
    if claims:
        pedido["requestContext"]["authorizer"] = {"jwt": {"claims": claims}}
    return pedido


def main():
    parser = argparse.ArgumentParser(
        description="Invoca o handler localmente com um evento de HTTP API."
    )
    parser.add_argument("funcao", choices=("produtos", "carrinho"))
    parser.add_argument(
        "--metodo",
        default="GET",
        choices=("GET", "POST", "DELETE"),
        help="Método HTTP do evento (padrão: GET).",
    )
    parser.add_argument(
        "--body",
        help="Corpo JSON do evento, como string. Obrigatório no POST.",
    )
    parser.add_argument(
        "--sub",
        help="Claim sub do usuário. No carrinho, o padrão é usuario-local.",
    )
    parser.add_argument(
        "--grupo",
        help="Claim cognito:groups. Use admin para incluir produto.",
    )
    args = parser.parse_args()

    metodo = args.metodo.upper()
    sub = args.sub
    if args.funcao == "carrinho" and not sub:
        sub = "usuario-local"

    if metodo == "POST" and not args.body:
        parser.error("POST precisa de --body com o JSON")

    garantir_regiao()
    handler = carregar(args.funcao)
    caminho = CAMINHOS[args.funcao]
    pedido = evento(metodo, caminho, args.body, sub, args.grupo)

    print(f"{metodo} {caminho}")
    if sub:
        print(f"sub={sub}")
    resposta = handler(pedido, None)
    status = resposta.get("statusCode")
    print(f"HTTP {status}")
    corpo = resposta.get("body") or ""
    try:
        print(json.dumps(json.loads(corpo), ensure_ascii=False, indent=2))
    except json.JSONDecodeError:
        print(corpo)
    if status is None or int(status) >= 400:
        sys.exit(1)


if __name__ == "__main__":
    main()

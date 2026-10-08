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

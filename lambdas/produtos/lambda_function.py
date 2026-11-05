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
            # Produto gravado antes do controle de estoque conta como esgotado.
            "estoque": _numero(item.get("estoque", 0)),
        }
        for item in itens
    ]


def _corpo(event):
    bruto = event.get("body") or "{}"
    return json.loads(bruto) if isinstance(bruto, str) else bruto


def _estoque(valor):
    """Converte para inteiro >= 0 ou devolve None se o valor for inválido."""
    if isinstance(valor, bool):
        return None
    try:
        numero = Decimal(str(valor))
    except Exception:
        return None
    if numero % 1 != 0 or numero < 0:
        return None
    return int(numero)


def _atualizar_estoque(event):
    try:
        dados = _corpo(event)
    except json.JSONDecodeError:
        return _resposta(400, {"erro": "JSON inválido"})

    try:
        produto_id = int(str(dados.get("id")))
    except (TypeError, ValueError):
        return _resposta(400, {"erro": "Campo obrigatório: id numérico"})

    estoque = _estoque(dados.get("estoque"))
    if estoque is None:
        return _resposta(400, {"erro": "estoque tem que ser um inteiro maior ou igual a zero"})

    try:
        resultado = tabela.update_item(
            Key={"id": produto_id},
            UpdateExpression="SET #estoque = :estoque",
            ConditionExpression="attribute_exists(#id)",
            ExpressionAttributeNames={"#id": "id", "#estoque": "estoque"},
            ExpressionAttributeValues={":estoque": estoque},
            ReturnValues="ALL_NEW",
        )
    except tabela.meta.client.exceptions.ConditionalCheckFailedException:
        return _resposta(404, {"erro": f"Produto {produto_id} não existe"})

    item = resultado["Attributes"]
    return _resposta(
        200,
        {
            "id": _numero(item["id"]),
            "nome": item["nome"],
            "preco": _numero(item["preco"]),
            "estoque": _numero(item["estoque"]),
        },
    )


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

        try:
            dados = _corpo(event)
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
        estoque = _estoque(dados.get("estoque", 0))
        if estoque is None:
            return _resposta(400, {"erro": "estoque tem que ser um inteiro maior ou igual a zero"})

        produtos = _listar()
        novo_id = max((item["id"] for item in produtos), default=0) + 1
        tabela.put_item(
            Item={"id": novo_id, "nome": nome, "preco": preco, "estoque": estoque}
        )
        return _resposta(
            201,
            {"id": novo_id, "nome": nome, "preco": _numero(preco), "estoque": estoque},
        )

    if metodo == "PUT":
        if "admin" not in _grupos(event):
            return _resposta(403, {"erro": "Só o grupo admin ajusta estoque"})
        return _atualizar_estoque(event)

    return _resposta(405, {"erro": f"Método {metodo} não permitido em /produtos"})

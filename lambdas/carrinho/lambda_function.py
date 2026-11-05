import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

tabela = boto3.resource("dynamodb").Table(os.environ["TABELA_CARRINHO"])
# Leitura do catálogo só para conferir o estoque (permissão GetItem).
tabela_produtos = boto3.resource("dynamodb").Table(os.environ["TABELA_PRODUTOS"])


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
        try:
            chave_produto = int(str(produto_id))
        except ValueError:
            return _resposta(400, {"erro": "produtoId tem que ser numérico"})

        try:
            qtd = Decimal(str(dados.get("qtd", 1)))
        except Exception:
            return _resposta(400, {"erro": "qtd tem que ser numérica"})
        if qtd % 1 != 0 or qtd < 1:
            return _resposta(400, {"erro": "qtd tem que ser um inteiro maior que zero"})

        produto = tabela_produtos.get_item(Key={"id": chave_produto}).get("Item")
        if not produto:
            return _resposta(404, {"erro": f"Produto {produto_id} não existe"})
        disponivel = _numero(produto.get("estoque", 0))
        if disponivel <= 0:
            return _resposta(409, {"erro": f"{produto['nome']} está esgotado"})
        if qtd > disponivel:
            return _resposta(
                409,
                {"erro": f"Estoque insuficiente para {produto['nome']}: disponível {disponivel}"},
            )

        tabela.put_item(
            Item={
                "usuarioId": usuario,
                "produtoId": str(produto_id),
                "qtd": qtd,
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

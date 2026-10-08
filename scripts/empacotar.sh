#!/usr/bin/env bash
# Gera os ZIPs que você sobe na console da Lambda.
# Uso: ./scripts/empacotar.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist"
mkdir -p "$OUT"

empacotar_py() {
  local nome="$1"
  local pasta="$ROOT/lambdas/$nome"
  local zipfile="$OUT/loja-${nome}.zip"
  python3 - <<PY
import zipfile
from pathlib import Path
src = Path("$pasta") / "lambda_function.py"
dst = Path("$zipfile")
if not src.is_file():
    raise SystemExit(f"Arquivo não encontrado: {src}")
with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.write(src, arcname="lambda_function.py")
print(f"OK -> {dst}")
with zipfile.ZipFile(dst) as zf:
    zf.printdir()
PY
}

empacotar_py produtos
empacotar_py carrinho
echo
echo "Na console Lambda: Upload from -> .zip file -> escolha o arquivo em dist/"

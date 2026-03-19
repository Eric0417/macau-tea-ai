#!/usr/bin/env bash
set -e

echo "=== 安裝並建置前端 ==="
cd frontend
npm install
npm run build
cd ..

echo "=== 安裝 Python 依賴 ==="
pip install -r requirements.txt

echo "=== 建置完成 ==="
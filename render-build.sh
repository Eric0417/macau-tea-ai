#!/bin/bash
set -e

echo "===== 安裝前端依賴並打包 ====="
cd frontend
npm install
npm run build

echo "===== 複製到後端 static ====="
rm -rf ../backend/static
cp -r dist ../backend/static

echo "===== 安裝後端依賴 ====="
cd ../backend
pip install -r requirements.txt
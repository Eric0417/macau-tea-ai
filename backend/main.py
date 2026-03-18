# backend/main.py

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import uuid
import shutil
from datetime import datetime

# ===== 初始化 FastAPI =====
app = FastAPI(
    title="澳門茶飲 AI 辨識系統",
    description="上傳茶飲圖片，AI 自動辨識茶種並提供資訊",
    version="1.0.0",
)

# ===== CORS 設定 =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== 確保資料夾存在 =====
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ===== 茶飲資料庫 =====
TEA_DATABASE = {
    "普洱茶": {
        "name": "普洱茶",
        "origin": "雲南",
        "type": "黑茶（後發酵茶）",
        "description": "普洱茶是雲南特有的地理標誌產品，以大葉種曬青毛茶為原料，經過後發酵加工而成。在澳門茶樓文化中佔有重要地位，是飲茶時最常見的選擇之一。",
        "taste": "口感醇厚，回甘持久，帶有獨特的陳香",
        "brewing": "水溫100°C，先洗茶一次，每泡浸泡10-30秒",
        "benefits": "助消化、降血脂、暖胃",
        "macau_culture": "澳門人飲早茶時最常點的茶種，幾乎每間茶樓都有供應。",
        "confidence": 0.92,
    },
    "鐵觀音": {
        "name": "鐵觀音",
        "origin": "福建安溪",
        "type": "烏龍茶（半發酵茶）",
        "description": "鐵觀音是中國十大名茶之一，屬於烏龍茶類。在澳門的茶樓和茶莊中極為流行，是僅次於普洱的熱門選擇。",
        "taste": "蘭花香氣濃郁，滋味醇厚甘鮮，回甘悠長",
        "brewing": "水溫95-100°C，每泡浸泡15-45秒",
        "benefits": "抗氧化、提神醒腦、美容養顏",
        "macau_culture": "澳門茶樓中第二受歡迎的茶種，常見於中高檔茶莊。",
        "confidence": 0.89,
    },
    "龍井茶": {
        "name": "龍井茶",
        "origin": "浙江杭州",
        "type": "綠茶（不發酵茶）",
        "description": "龍井茶是中國綠茶的代表，以色綠、香鬱、味甘、形美著稱。扁平光滑的外形和獨特的豆香是其標誌。",
        "taste": "清香撲鼻，滋味鮮爽，帶有炒豆香",
        "brewing": "水溫80-85°C，不要蓋蓋子，每泡浸泡1-2分鐘",
        "benefits": "提神、抗氧化、清熱解毒",
        "macau_culture": "在澳門較高檔的茶莊和餐廳中供應，近年越來越受歡迎。",
        "confidence": 0.88,
    },
    "菊花茶": {
        "name": "菊花茶",
        "origin": "中國各地",
        "type": "花茶（非茶之茶）",
        "description": "菊花茶以菊花為原料沖泡而成，在澳門常與普洱茶混合飲用，稱為「菊普」，是茶樓中非常經典的搭配。",
        "taste": "清香甘甜，口感清爽",
        "brewing": "水溫90-95°C，浸泡3-5分鐘",
        "benefits": "清肝明目、清熱解毒、降火",
        "macau_culture": "「菊普」（菊花+普洱）是澳門茶樓的經典組合，幾乎人人都喝過。",
        "confidence": 0.91,
    },
    "香片": {
        "name": "香片（茉莉花茶）",
        "origin": "福建福州",
        "type": "花茶（再加工茶）",
        "description": "香片即茉莉花茶，以綠茶為基底，用茉莉花窨製而成。在澳門茶樓中非常普遍，是老一輩澳門人的最愛之一。",
        "taste": "茉莉花香濃郁，茶味鮮爽回甘",
        "brewing": "水溫90°C，浸泡2-3分鐘",
        "benefits": "理氣開鬱、安神、美容",
        "macau_culture": "澳門茶樓必備茶種，尤其受老一輩街坊喜愛，點茶時常說「一壺香片」。",
        "confidence": 0.90,
    },
    "壽眉": {
        "name": "壽眉",
        "origin": "福建福鼎",
        "type": "白茶（微發酵茶）",
        "description": "壽眉是白茶中產量最大的品種，葉片較大，帶有獨特的棗香和藥香。陳年壽眉在澳門茶客中頗受追捧。",
        "taste": "清甜醇和，陳年後帶有棗香和藥香",
        "brewing": "水溫95-100°C，浸泡15-30秒",
        "benefits": "清熱降火、解毒、抗氧化",
        "macau_culture": "近年在澳門茶葉市場越來越受歡迎，尤其是陳年老壽眉。",
        "confidence": 0.85,
    },
    "水仙": {
        "name": "水仙",
        "origin": "福建武夷山",
        "type": "烏龍茶（半發酵茶）",
        "description": "水仙是武夷岩茶的傳統品種之一，樹齡越老茶味越醇。澳門不少老茶客對水仙情有獨鍾。",
        "taste": "蘭花香與木質香交融，滋味醇厚",
        "brewing": "水溫100°C，先洗茶，每泡浸泡10-30秒",
        "benefits": "暖胃、助消化、降血壓",
        "macau_culture": "澳門部分傳統茶樓仍有供應，是老茶客的心頭好。",
        "confidence": 0.84,
    },
}

# ===== 辨識歷史紀錄（記憶體存儲）=====
recognition_history = []


# ====================================================
#                    API 路由
# ====================================================

@app.get("/api/health")
async def health_check():
    """健康檢查"""
    return {
        "status": "ok",
        "message": "澳門茶飲 AI 辨識系統正常運行中",
        "time": datetime.now().isoformat(),
    }


@app.get("/api/teas")
async def get_all_teas():
    """取得所有茶飲資料"""
    teas = []
    for key, tea in TEA_DATABASE.items():
        teas.append({
            "id": key,
            "name": tea["name"],
            "type": tea["type"],
            "origin": tea["origin"],
            "description": tea["description"],
        })
    return {"teas": teas, "total": len(teas)}


@app.get("/api/teas/{tea_id}")
async def get_tea_detail(tea_id: str):
    """取得單一茶飲的詳細資料"""
    if tea_id not in TEA_DATABASE:
        raise HTTPException(status_code=404, detail="找不到該茶飲資料")
    return {"tea": TEA_DATABASE[tea_id]}


@app.post("/api/recognize")
async def recognize_tea(file: UploadFile = File(...)):
    """
    上傳茶飲圖片進行 AI 辨識
    目前使用模擬辨識，未來可接入真正的 AI 模型
    """
    # 驗證檔案類型
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支援的檔案格式：{file.content_type}，請上傳 JPG、PNG 或 WebP 格式的圖片",
        )

    # 驗證檔案大小（最大 10MB）
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="圖片大小不能超過 10MB")

    # 儲存圖片
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_name = f"{uuid.uuid4().hex}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    # ===== 模擬 AI 辨識結果 =====
    # TODO: 將來替換為真正的 AI 模型推理
    import random

    tea_keys = list(TEA_DATABASE.keys())
    recognized_key = random.choice(tea_keys)
    recognized_tea = TEA_DATABASE[recognized_key]

    # 模擬前三名結果
    other_keys = [k for k in tea_keys if k != recognized_key]
    random.shuffle(other_keys)

    top_results = [
        {"name": recognized_tea["name"], "confidence": round(random.uniform(0.80, 0.98), 2)},
        {"name": TEA_DATABASE[other_keys[0]]["name"], "confidence": round(random.uniform(0.30, 0.60), 2)},
        {"name": TEA_DATABASE[other_keys[1]]["name"], "confidence": round(random.uniform(0.05, 0.25), 2)},
    ]

    # 記錄辨識歷史
    record = {
        "id": uuid.uuid4().hex,
        "file_name": file_name,
        "recognized_tea": recognized_tea["name"],
        "confidence": top_results[0]["confidence"],
        "time": datetime.now().isoformat(),
    }
    recognition_history.append(record)

    return {
        "success": True,
        "result": {
            "tea": recognized_tea,
            "top_results": top_results,
            "file_name": file_name,
        },
        "message": f"辨識完成！這最可能是「{recognized_tea['name']}」",
    }


@app.get("/api/history")
async def get_history():
    """取得辨識歷史紀錄"""
    return {
        "history": list(reversed(recognition_history)),
        "total": len(recognition_history),
    }


@app.delete("/api/history")
async def clear_history():
    """清除辨識歷史紀錄"""
    recognition_history.clear()
    return {"success": True, "message": "歷史紀錄已清除"}


@app.get("/api/stats")
async def get_stats():
    """取得系統統計資料"""
    tea_count = {}
    for record in recognition_history:
        tea_name = record["recognized_tea"]
        tea_count[tea_name] = tea_count.get(tea_name, 0) + 1

    return {
        "total_recognitions": len(recognition_history),
        "tea_types_available": len(TEA_DATABASE),
        "tea_distribution": tea_count,
    }


# ====================================================
#          前端靜態檔案（必須放在最後！）
# ====================================================

static_dir = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(static_dir):
    # 掛載 assets 資料夾（JS、CSS 等）
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # 所有非 /api 的路由都返回 index.html（SPA 前端路由）
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # 如果請求的是真實存在的檔案，直接返回
        file_path = os.path.join(static_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        # 否則返回 index.html，讓前端路由處理
        return FileResponse(os.path.join(static_dir, "index.html"))
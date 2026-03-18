# backend/main.py

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import uuid
import random
from datetime import datetime

app = FastAPI(title="澳門茶飲 AI 辨識系統", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ===== 茶飲資料庫 =====
TEA_DATABASE = {
    "普洱茶": {
        "name": "普洱茶",
        "origin": "雲南",
        "type": "黑茶（後發酵茶）",
        "description": "普洱茶是雲南特有的地理標誌產品，以大葉種曬青毛茶為原料，經過後發酵加工而成。在澳門茶樓文化中佔有重要地位。",
        "taste": "口感醇厚，回甘持久，帶有獨特的陳香",
        "brewing": "水溫100°C，先洗茶一次，每泡浸泡10-30秒",
        "benefits": "助消化、降血脂、暖胃",
        "macau_culture": "澳門人飲早茶時最常點的茶種，幾乎每間茶樓都有供應。",
    },
    "鐵觀音": {
        "name": "鐵觀音",
        "origin": "福建安溪",
        "type": "烏龍茶（半發酵茶）",
        "description": "鐵觀音是中國十大名茶之一，屬於烏龍茶類。在澳門的茶樓和茶莊中極為流行。",
        "taste": "蘭花香氣濃郁，滋味醇厚甘鮮，回甘悠長",
        "brewing": "水溫95-100°C，每泡浸泡15-45秒",
        "benefits": "抗氧化、提神醒腦、美容養顏",
        "macau_culture": "澳門茶樓中第二受歡迎的茶種，常見於中高檔茶莊。",
    },
    "龍井茶": {
        "name": "龍井茶",
        "origin": "浙江杭州",
        "type": "綠茶（不發酵茶）",
        "description": "龍井茶是中國綠茶的代表，以色綠、香鬱、味甘、形美著稱。",
        "taste": "清香撲鼻，滋味鮮爽，帶有炒豆香",
        "brewing": "水溫80-85°C，不要蓋蓋子，每泡浸泡1-2分鐘",
        "benefits": "提神、抗氧化、清熱解毒",
        "macau_culture": "在澳門較高檔的茶莊和餐廳中供應，近年越來越受歡迎。",
    },
    "菊花茶": {
        "name": "菊花茶",
        "origin": "中國各地",
        "type": "花茶（非茶之茶）",
        "description": "菊花茶以菊花為原料沖泡而成，在澳門常與普洱茶混合飲用，稱為「菊普」。",
        "taste": "清香甘甜，口感清爽",
        "brewing": "水溫90-95°C，浸泡3-5分鐘",
        "benefits": "清肝明目、清熱解毒、降火",
        "macau_culture": "「菊普」（菊花+普洱）是澳門茶樓的經典組合。",
    },
    "香片": {
        "name": "香片（茉莉花茶）",
        "origin": "福建福州",
        "type": "花茶（再加工茶）",
        "description": "香片即茉莉花茶，以綠茶為基底，用茉莉花窨製而成。在澳門茶樓中非常普遍。",
        "taste": "茉莉花香濃郁，茶味鮮爽回甘",
        "brewing": "水溫90°C，浸泡2-3分鐘",
        "benefits": "理氣開鬱、安神、美容",
        "macau_culture": "澳門茶樓必備茶種，尤其受老一輩街坊喜愛。",
    },
    "壽眉": {
        "name": "壽眉",
        "origin": "福建福鼎",
        "type": "白茶（微發酵茶）",
        "description": "壽眉是白茶中產量最大的品種，葉片較大，帶有獨特的棗香和藥香。",
        "taste": "清甜醇和，陳年後帶有棗香和藥香",
        "brewing": "水溫95-100°C，浸泡15-30秒",
        "benefits": "清熱降火、解毒、抗氧化",
        "macau_culture": "近年在澳門茶葉市場越來越受歡迎，尤其是陳年老壽眉。",
    },
    "水仙": {
        "name": "水仙",
        "origin": "福建武夷山",
        "type": "烏龍茶（半發酵茶）",
        "description": "水仙是武夷岩茶的傳統品種之一，樹齡越老茶味越醇。",
        "taste": "蘭花香與木質香交融，滋味醇厚",
        "brewing": "水溫100°C，先洗茶，每泡浸泡10-30秒",
        "benefits": "暖胃、助消化、降血壓",
        "macau_culture": "澳門部分傳統茶樓仍有供應，是老茶客的心頭好。",
    },
}

# ===== 舌苔診斷資料庫 =====
TONGUE_PATTERNS = [
    {
        "id": "pinghe",
        "constitution": "平和質",
        "tongue_body": {"color": "淡紅色", "shape": "大小適中，邊緣光滑", "texture": "柔軟靈活"},
        "coating": {"color": "白色", "thickness": "薄", "moisture": "潤澤適中", "distribution": "均勻薄白苔"},
        "health_score": 92,
        "analysis": "舌質淡紅潤澤，舌苔薄白均勻，為健康舌象。說明氣血充盈、陰陽調和、臟腑功能正常。這是理想的身體狀態。",
        "suggestions": [
            "保持目前良好的生活習慣",
            "均衡飲食，四時養生",
            "適量運動，每週至少運動3次",
            "保持心情舒暢，充足睡眠"
        ],
        "recommended_teas": ["龍井茶", "鐵觀音"],
        "tea_reason": "體質平和者適合飲用各類茶品。綠茶清新提神，烏龍茶香氣怡人，可根據季節交替飲用。",
        "risk_level": "低",
    },
    {
        "id": "qixu",
        "constitution": "氣虛質",
        "tongue_body": {"color": "淡白色", "shape": "舌體偏大，邊緣有齒痕", "texture": "軟嫩乏力"},
        "coating": {"color": "白色", "thickness": "薄", "moisture": "偏潤", "distribution": "薄白苔，中部略厚"},
        "health_score": 68,
        "analysis": "舌質淡白、舌體胖大有齒痕，提示氣虛體質。可能伴有疲倦乏力、氣短懶言、容易感冒等症狀。脾肺之氣不足，運化功能偏弱。",
        "suggestions": [
            "避免過度勞累，注意休息",
            "飲食宜溫和易消化，少食生冷",
            "適量進行柔和運動如太極、散步",
            "可適當食用山藥、紅棗、黃芪等補氣食材"
        ],
        "recommended_teas": ["普洱茶", "水仙"],
        "tea_reason": "氣虛者適合飲用溫性茶品。普洱熟茶性質溫和，有助暖胃補氣；水仙烏龍茶溫潤醇厚，不傷脾胃。",
        "risk_level": "中",
    },
    {
        "id": "shire",
        "constitution": "濕熱質",
        "tongue_body": {"color": "偏紅", "shape": "舌體正常偏大", "texture": "質地偏老"},
        "coating": {"color": "黃色", "thickness": "厚膩", "moisture": "偏膩", "distribution": "黃膩苔覆蓋中後部"},
        "health_score": 55,
        "analysis": "舌質偏紅、苔黃膩，為典型濕熱內蘊之象。可能伴有口苦口乾、身體困重、小便黃赤等症狀。常見於飲食油膩辛辣或潮濕環境久居者。澳門氣候潮濕，特別容易出現此體質。",
        "suggestions": [
            "飲食清淡，少吃油膩、辛辣、煎炸食物",
            "多吃清熱利濕食材如薏仁、冬瓜、綠豆",
            "保持居住環境通風乾燥",
            "適量運動促進排汗，幫助排除濕氣",
            "避免飲酒及過量飲用冷飲"
        ],
        "recommended_teas": ["菊花茶", "龍井茶"],
        "tea_reason": "濕熱體質適合飲用清熱解毒的茶品。菊花茶清肝明目、清熱降火；龍井綠茶性涼，有助清除體內濕熱。",
        "risk_level": "中高",
    },
    {
        "id": "yinxu",
        "constitution": "陰虛質",
        "tongue_body": {"color": "紅色", "shape": "舌體偏瘦", "texture": "乾燥少津"},
        "coating": {"color": "少苔或無苔", "thickness": "極薄或剝落", "moisture": "偏乾", "distribution": "花剝苔，部分區域無苔"},
        "health_score": 60,
        "analysis": "舌質紅、少苔或無苔，為陰虛體質的典型表現。可能伴有手足心熱、口乾咽燥、失眠多夢、盜汗等症狀。體內陰液不足，虛火偏旺。",
        "suggestions": [
            "早睡早起，避免熬夜（熬夜最傷陰液）",
            "多食滋陰食材如百合、銀耳、蓮子、枸杞",
            "避免辛辣燥熱食物和過量咖啡",
            "保持情緒平穩，練習深呼吸或冥想",
            "避免劇烈運動和大量出汗"
        ],
        "recommended_teas": ["壽眉", "菊花茶"],
        "tea_reason": "陰虛體質適合飲用性質平和或偏涼的茶品。白茶壽眉性涼潤，有助滋陰清熱；菊花茶清熱養陰、明目潤燥。",
        "risk_level": "中",
    },
    {
        "id": "tanshi",
        "constitution": "痰濕質",
        "tongue_body": {"color": "淡紅偏白", "shape": "舌體胖大，邊緣有齒痕", "texture": "黏膩"},
        "coating": {"color": "白色", "thickness": "厚膩", "moisture": "偏膩多津", "distribution": "白膩苔滿布"},
        "health_score": 58,
        "analysis": "舌體胖大有齒痕、苔白膩，為痰濕體質的典型表現。可能伴有身體肥胖、胸悶痰多、口中黏膩、身體困重等症狀。多因飲食不節、缺乏運動所致。",
        "suggestions": [
            "控制飲食量，減少甜食和油膩食物",
            "多吃健脾利濕食材如薏仁、陳皮、茯苓",
            "堅持每日運動，促進新陳代謝",
            "少喝冷飲和甜飲料",
            "可配合中醫調理，健脾化痰"
        ],
        "recommended_teas": ["普洱茶", "鐵觀音"],
        "tea_reason": "痰濕體質適合飲用有助消脂化濕的茶品。普洱茶助消化、降血脂，是化濕的好選擇；鐵觀音提升代謝，幫助排除體內痰濕。",
        "risk_level": "中高",
    },
    {
        "id": "xueyu",
        "constitution": "血瘀質",
        "tongue_body": {"color": "紫暗或有瘀斑", "shape": "舌體正常偏暗", "texture": "舌下脈絡偏粗紫"},
        "coating": {"color": "白色或灰色", "thickness": "薄", "moisture": "正常", "distribution": "薄白苔或薄灰苔"},
        "health_score": 52,
        "analysis": "舌質紫暗或有瘀斑，為血瘀體質的典型舌象。可能伴有面色晦暗、皮膚乾燥、容易健忘、肢體麻木或刺痛等症狀。血液運行不暢，需注意心腦血管健康。",
        "suggestions": [
            "保持適度運動，促進血液循環",
            "多吃活血食材如山楂、黑木耳、洋蔥",
            "避免久坐不動，每小時起身活動",
            "注意保暖，寒冷會加重血瘀",
            "保持心情舒暢，避免情緒鬱結",
            "建議定期檢查心腦血管健康"
        ],
        "recommended_teas": ["水仙", "香片"],
        "tea_reason": "血瘀體質適合飲用有助活血行氣的茶品。水仙烏龍茶溫潤活血；茉莉花茶（香片）理氣解鬱，有助改善血液循環。",
        "risk_level": "中高",
    },
]

# ===== 歷史紀錄 =====
recognition_history = []
tongue_history = []


# ===== 工具函數 =====
async def save_upload(file: UploadFile) -> tuple:
    allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail=f"不支援的檔案格式：{file.content_type}")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="圖片不能超過 10MB")
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    name = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_DIR, name)
    with open(path, "wb") as f:
        f.write(contents)
    return name, len(contents)


# ====================================================
#                    API 路由
# ====================================================

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "澳門茶飲 AI 辨識系統 v2.0 運行中", "time": datetime.now().isoformat()}


@app.get("/api/teas")
async def get_all_teas():
    teas = [{"id": k, "name": v["name"], "type": v["type"], "origin": v["origin"], "description": v["description"]} for k, v in TEA_DATABASE.items()]
    return {"teas": teas, "total": len(teas)}


@app.get("/api/teas/{tea_id}")
async def get_tea_detail(tea_id: str):
    if tea_id not in TEA_DATABASE:
        raise HTTPException(status_code=404, detail="找不到該茶飲資料")
    return {"tea": TEA_DATABASE[tea_id]}


@app.post("/api/recognize")
async def recognize_tea(file: UploadFile = File(...)):
    file_name, file_size = await save_upload(file)

    # 模擬 AI 辨識
    tea_keys = list(TEA_DATABASE.keys())
    # 用檔案大小作為種子，讓同一張圖片結果一致
    random.seed(file_size % 9999)
    recognized_key = random.choice(tea_keys)
    recognized_tea = TEA_DATABASE[recognized_key]

    other_keys = [k for k in tea_keys if k != recognized_key]
    random.shuffle(other_keys)

    top_results = [
        {"name": recognized_tea["name"], "confidence": round(random.uniform(0.82, 0.97), 2)},
        {"name": TEA_DATABASE[other_keys[0]]["name"], "confidence": round(random.uniform(0.30, 0.55), 2)},
        {"name": TEA_DATABASE[other_keys[1]]["name"], "confidence": round(random.uniform(0.05, 0.20), 2)},
    ]

    random.seed()  # 重置種子

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
        "result": {"tea": recognized_tea, "top_results": top_results, "file_name": file_name},
        "message": f"辨識完成！這最可能是「{recognized_tea['name']}」",
    }


@app.post("/api/tongue-diagnosis")
async def tongue_diagnosis(file: UploadFile = File(...)):
    """舌苔識別 AI 診斷"""
    file_name, file_size = await save_upload(file)

    # 用檔案大小選擇體質模式（模擬 AI）
    random.seed(file_size % 7777)
    pattern = random.choice(TONGUE_PATTERNS)
    confidence = round(random.uniform(0.78, 0.95), 2)
    random.seed()

    result = {
        "constitution": pattern["constitution"],
        "tongue_body": pattern["tongue_body"],
        "coating": pattern["coating"],
        "health_score": pattern["health_score"],
        "analysis": pattern["analysis"],
        "suggestions": pattern["suggestions"],
        "recommended_teas": pattern["recommended_teas"],
        "tea_reason": pattern["tea_reason"],
        "risk_level": pattern["risk_level"],
        "confidence": confidence,
        "file_name": file_name,
    }

    tongue_history.append({
        "id": uuid.uuid4().hex,
        "file_name": file_name,
        "constitution": pattern["constitution"],
        "health_score": pattern["health_score"],
        "time": datetime.now().isoformat(),
    })

    return {"success": True, "result": result, "message": f"舌苔分析完成！您的體質傾向為「{pattern['constitution']}」"}


@app.get("/api/history")
async def get_history():
    return {
        "tea_history": list(reversed(recognition_history)),
        "tongue_history": list(reversed(tongue_history)),
        "total": len(recognition_history) + len(tongue_history),
    }


@app.delete("/api/history")
async def clear_history():
    recognition_history.clear()
    tongue_history.clear()
    return {"success": True, "message": "歷史紀錄已清除"}


@app.get("/api/stats")
async def get_stats():
    tea_count = {}
    for r in recognition_history:
        tea_count[r["recognized_tea"]] = tea_count.get(r["recognized_tea"], 0) + 1
    constitution_count = {}
    for r in tongue_history:
        constitution_count[r["constitution"]] = constitution_count.get(r["constitution"], 0) + 1
    return {
        "total_tea_recognitions": len(recognition_history),
        "total_tongue_diagnoses": len(tongue_history),
        "tea_types_available": len(TEA_DATABASE),
        "tongue_patterns_available": len(TONGUE_PATTERNS),
        "tea_distribution": tea_count,
        "constitution_distribution": constitution_count,
    }


# ===== 前端靜態檔案 =====
static_dir = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(static_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
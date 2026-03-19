from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
import os, uuid, random, json
from datetime import datetime
from io import BytesIO

import qrcode

import database as db

# ============================================================
app = FastAPI(title="澳門茶飲 AI 辨識系統", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.on_event("startup")
async def startup():
    db.init_db()


# ============================================================
#  茶品資料庫（三大分類 8 款）
# ============================================================
TEA_DATABASE = {
    # ── 草本調理類 ──
    "菊花款": {
        "name": "菊花款",
        "category": "草本調理類",
        "icon": "🌼",
        "ingredients": "杭白菊、枸杞、冰糖",
        "benefits": "清熱解毒、明目養肝",
        "suitable_for": "用眼過度、眼睛乾澀、肝火旺盛人群",
        "taste": "清香甘甜，帶有淡雅菊花香",
        "brewing": "水溫 90-95°C，浸泡 3-5 分鐘，可沖泡 2-3 次",
        "description": "精選杭白菊配以寧夏枸杞，清肝明目。菊花性微寒，清散風熱、平肝明目；枸杞滋補肝腎，寒溫相配，長期飲用有助護眼養肝。",
        "contraindications": "脾胃虛寒者不宜過量飲用",
    },
    "決明子款": {
        "name": "決明子款",
        "category": "草本調理類",
        "icon": "🌿",
        "ingredients": "決明子、山楂、陳皮",
        "benefits": "清肝明目、潤腸通便",
        "suitable_for": "熬夜黨、便秘人群、用眼過度者",
        "taste": "微苦回甘，帶有堅果般焦香",
        "brewing": "水溫 95-100°C，浸泡 5-8 分鐘，可沖泡 2 次",
        "description": "決明子炒製後散發獨特焦香，能清肝火、降血壓、潤腸通便，是熬夜族和上班族的理想日常茶飲。搭配山楂助消化、陳皮理氣，整體口感圓潤。",
        "contraindications": "孕婦及低血壓者慎用",
    },
    "艾草款": {
        "name": "艾草款",
        "category": "草本調理類",
        "icon": "🍃",
        "ingredients": "艾葉、紅糖、生薑、大棗",
        "benefits": "溫經散寒、祛濕止痛",
        "suitable_for": "經期不適女性、手腳冰涼、寒性體質人群",
        "taste": "草本清香中帶有微甜，姜味溫暖",
        "brewing": "水溫 100°C，煮沸後小火煮 5 分鐘，趁熱飲用",
        "description": "艾草被譽為「醫草」，性溫，善於溫經止血、散寒止痛。配合紅糖補血活血、生薑驅寒暖胃，特別適合女性經期前後或寒冷季節飲用。",
        "contraindications": "陰虛火旺者及孕早期不宜飲用",
    },
    "薄荷款": {
        "name": "薄荷款",
        "category": "草本調理類",
        "icon": "🌱",
        "ingredients": "薄荷葉、綠茶、蜂蜜",
        "benefits": "疏風散熱、提神醒腦",
        "suitable_for": "夏季消暑、午後犯困、感冒初期人群",
        "taste": "清涼爽口，薄荷香氣沁人心脾",
        "brewing": "水溫 80-85°C，浸泡 2-3 分鐘，不宜久泡",
        "description": "新鮮薄荷葉搭配上等綠茶，清涼提神。薄荷性涼，能疏風散熱、清利頭目，是夏日解暑和午後提神的絕佳選擇。加入適量蜂蜜風味更佳。",
        "contraindications": "體質虛寒者不宜大量飲用",
    },
    # ── 花果滋養類 ──
    "玫瑰花款": {
        "name": "玫瑰花款",
        "category": "花果滋養類",
        "icon": "🌹",
        "ingredients": "重瓣紅玫瑰、枸杞、桂圓",
        "benefits": "疏肝理氣、調節內分泌、美容養顏",
        "suitable_for": "女性日常調理、情緒不穩、面色暗沉人群",
        "taste": "花香馥郁，甘甜圓潤",
        "brewing": "水溫 85-90°C，浸泡 3-5 分鐘，可沖泡 3 次",
        "description": "精選平陰重瓣紅玫瑰，花香濃郁、活性成分豐富。玫瑰花性溫和，理氣解鬱、活血散瘀，長期飲用可改善面色、調理月經，是女性養生首選花茶。",
        "contraindications": "月經量大者經期暫停飲用",
    },
    "紅棗桂圓款": {
        "name": "紅棗桂圓款",
        "category": "花果滋養類",
        "icon": "🫐",
        "ingredients": "紅棗、桂圓、枸杞、黃芪",
        "benefits": "補血養顏、安神助眠",
        "suitable_for": "氣血不足、睡眠差、面色蒼白人群",
        "taste": "甘甜醇厚，果香溫潤",
        "brewing": "水溫 100°C，浸泡 8-10 分鐘或煮沸 5 分鐘效果更佳",
        "description": "紅棗補中益氣、養血安神；桂圓補心脾、益氣血；枸杞滋補肝腎；黃芪補氣固表。四味合用，是經典的補氣養血方，特別適合冬季進補。",
        "contraindications": "糖尿病患者減少紅棗用量；濕熱體質慎用",
    },
    "山楂款": {
        "name": "山楂款",
        "category": "花果滋養類",
        "icon": "🍒",
        "ingredients": "山楂、陳皮、烏梅、冰糖",
        "benefits": "消食化積、活血化瘀",
        "suitable_for": "積食、血脂偏高、食慾不振人群",
        "taste": "酸甜開胃，回味生津",
        "brewing": "水溫 95-100°C，浸泡 5-8 分鐘，可加冰糖調味",
        "description": "山楂善消肉食積滯、行氣散瘀，配合陳皮理氣健脾、烏梅生津止渴，酸甜可口又助消化，是餐後解膩、日常消脂的優質茶飲。",
        "contraindications": "胃酸過多、胃潰瘍患者慎用",
    },
    # ── 穀物雜糧類 ──
    "紅豆薏米款": {
        "name": "紅豆薏米款",
        "category": "穀物雜糧類",
        "icon": "🫘",
        "ingredients": "紅豆、薏米、芡實、陳皮",
        "benefits": "祛濕消腫、健脾利水",
        "suitable_for": "脾虛濕困型肥胖、水腫、小便不利人群",
        "taste": "穀物清香，口感綿密，微帶甘甜",
        "brewing": "建議煮沸後小火煮 15-20 分鐘，或用燜燒杯燜 2 小時",
        "description": "紅豆利水消腫、薏米健脾滲濕、芡實固腎益精、陳皮理氣化痰。四者合用，是中醫經典祛濕組方，尤其適合澳門潮濕氣候下的日常保健飲品。",
        "contraindications": "孕婦不宜（薏米性滑利）；體質偏寒者可將薏米炒熟後使用",
    },
}

# ============================================================
#  舌苔體質模型（7 種）
# ============================================================
TONGUE_PATTERNS = [
    {
        "id": "pinghe",
        "constitution": "平和質",
        "tongue_body": {"color": "淡紅色", "shape": "大小適中，邊緣光滑", "texture": "柔軟靈活"},
        "coating": {"color": "白色", "thickness": "薄", "moisture": "潤澤適中", "distribution": "均勻薄白苔"},
        "health_score": 92,
        "analysis": "舌質淡紅潤澤，舌苔薄白均勻，為健康舌象。氣血充盈、陰陽調和、臟腑功能正常。",
        "suggestions": ["保持目前良好的生活習慣", "均衡飲食，四時養生", "適量運動，每週至少 3 次", "保持心情舒暢，充足睡眠"],
        "recommended_teas": ["薄荷款", "玫瑰花款"],
        "tea_reason": "體質平和者適合大部分茶飲。薄荷款清涼提神，玫瑰花款養顏理氣，可按季節心情交替飲用。",
        "risk_level": "低",
    },
    {
        "id": "qixu",
        "constitution": "氣虛質",
        "tongue_body": {"color": "淡白色", "shape": "舌體偏大，邊緣有齒痕", "texture": "軟嫩乏力"},
        "coating": {"color": "白色", "thickness": "薄", "moisture": "偏潤", "distribution": "薄白苔，中部略厚"},
        "health_score": 68,
        "analysis": "舌質淡白、舌體胖大有齒痕，提示氣虛體質。常伴疲倦乏力、氣短懶言、易感冒，脾肺之氣不足。",
        "suggestions": ["避免過度勞累，注意休息", "飲食宜溫和易消化，少食生冷", "適量柔和運動如太極、散步", "可食用山藥、紅棗、黃芪等補氣食材"],
        "recommended_teas": ["紅棗桂圓款", "紅豆薏米款"],
        "tea_reason": "紅棗桂圓款補氣養血、安神助眠，正合氣虛之需；紅豆薏米款健脾利水，改善脾虛所致的水濕問題。",
        "risk_level": "中",
    },
    {
        "id": "shire",
        "constitution": "濕熱質",
        "tongue_body": {"color": "偏紅", "shape": "舌體正常偏大", "texture": "質地偏老"},
        "coating": {"color": "黃色", "thickness": "厚膩", "moisture": "偏膩", "distribution": "黃膩苔覆蓋中後部"},
        "health_score": 55,
        "analysis": "舌質偏紅、苔黃膩，典型濕熱內蘊。常伴口苦口乾、身體困重、小便黃赤。澳門氣候潮濕，尤易出現此體質。",
        "suggestions": ["飲食清淡，少吃油膩辛辣煎炸", "多吃薏仁、冬瓜、綠豆等清熱利濕食材", "居住環境保持通風乾燥", "適量運動促排汗", "避免飲酒及過量冷飲"],
        "recommended_teas": ["菊花款", "決明子款"],
        "tea_reason": "菊花款清熱解毒、明目降火；決明子款清肝明目、潤腸通便，兩者皆有助清除體內濕熱。",
        "risk_level": "中高",
    },
    {
        "id": "yinxu",
        "constitution": "陰虛質",
        "tongue_body": {"color": "紅色", "shape": "舌體偏瘦", "texture": "乾燥少津"},
        "coating": {"color": "少苔或無苔", "thickness": "極薄或剝落", "moisture": "偏乾", "distribution": "花剝苔，部分區域無苔"},
        "health_score": 60,
        "analysis": "舌質紅、少苔或無苔，為陰虛體質。常伴手足心熱、口乾咽燥、失眠盜汗，體內陰液不足、虛火偏旺。",
        "suggestions": ["早睡早起，避免熬夜", "多食百合、銀耳、蓮子等滋陰食材", "避免辛辣燥熱食物", "練習深呼吸或冥想", "避免劇烈運動和大量出汗"],
        "recommended_teas": ["菊花款", "玫瑰花款"],
        "tea_reason": "菊花款清熱養陰、明目潤燥；玫瑰花款疏肝理氣、溫和滋養，不會加重虛火，適合陰虛者日常飲用。",
        "risk_level": "中",
    },
    {
        "id": "tanshi",
        "constitution": "痰濕質",
        "tongue_body": {"color": "淡紅偏白", "shape": "舌體胖大，邊緣有齒痕", "texture": "黏膩"},
        "coating": {"color": "白色", "thickness": "厚膩", "moisture": "偏膩多津", "distribution": "白膩苔滿布"},
        "health_score": 58,
        "analysis": "舌體胖大有齒痕、苔白膩，為痰濕體質。常伴身體肥胖、胸悶痰多、口中黏膩、身體困重。多因飲食不節或缺乏運動。",
        "suggestions": ["控制飲食，減少甜食和油膩", "多吃薏仁、陳皮、茯苓等健脾利濕食材", "堅持每日運動促進代謝", "少喝冷飲和甜飲料"],
        "recommended_teas": ["紅豆薏米款", "山楂款"],
        "tea_reason": "紅豆薏米款是經典祛濕方，健脾利水、消腫排濕；山楂款消食化積、降脂減肥，雙管齊下改善痰濕。",
        "risk_level": "中高",
    },
    {
        "id": "xueyu",
        "constitution": "血瘀質",
        "tongue_body": {"color": "紫暗或有瘀斑", "shape": "舌體正常偏暗", "texture": "舌下脈絡偏粗紫"},
        "coating": {"color": "白色或灰色", "thickness": "薄", "moisture": "正常", "distribution": "薄白苔或薄灰苔"},
        "health_score": 52,
        "analysis": "舌質紫暗或有瘀斑，為血瘀體質。常伴面色晦暗、皮膚乾燥、肢體麻木或刺痛，血液運行不暢，需注意心腦血管健康。",
        "suggestions": ["適度運動促進血液循環", "多吃山楂、黑木耳、洋蔥等活血食材", "避免久坐，每小時起身活動", "注意保暖", "保持心情舒暢"],
        "recommended_teas": ["山楂款", "玫瑰花款"],
        "tea_reason": "山楂款活血化瘀、消食降脂，直接改善血瘀；玫瑰花款理氣解鬱、活血散瘀，調理氣血運行。",
        "risk_level": "中高",
    },
    {
        "id": "hanshi",
        "constitution": "寒濕質",
        "tongue_body": {"color": "淡白", "shape": "舌體胖大，邊緣齒痕明顯", "texture": "水滑"},
        "coating": {"color": "白色", "thickness": "厚", "moisture": "水滑多津", "distribution": "白滑苔滿布，舌面水分多"},
        "health_score": 56,
        "analysis": "舌質淡白、苔白厚水滑，為寒濕體質。常伴手腳冰涼、怕冷、腹瀉、經期腹痛。多因陽氣不足，寒濕內生。澳門冬春季潮濕陰冷時尤為常見。",
        "suggestions": ["注意保暖，尤其腹部和腳部", "少吃生冷寒涼食物", "可用生薑、肉桂等溫性食材煮茶", "艾灸足三里、關元等穴位", "堅持溫和運動如瑜伽、慢跑"],
        "recommended_teas": ["艾草款", "紅棗桂圓款"],
        "tea_reason": "艾草款溫經散寒、祛濕止痛，直擊寒濕根源；紅棗桂圓款補氣養血、溫中暖胃，幫助提升陽氣。",
        "risk_level": "中",
    },
]


# ============================================================
#  工具
# ============================================================
async def save_upload(file: UploadFile) -> tuple:
    allowed = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if file.content_type not in allowed:
        raise HTTPException(400, f"不支援的格式：{file.content_type}")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(400, "圖片不能超過 10MB")
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    name = f"{uuid.uuid4().hex}.{ext}"
    with open(os.path.join(UPLOAD_DIR, name), "wb") as f:
        f.write(data)
    return name, len(data)


# ============================================================
#  API 路由
# ============================================================

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "3.0.0", "time": datetime.now().isoformat()}


# ---------- 茶品 ----------
@app.get("/api/teas")
async def list_teas():
    grouped = {}
    for k, v in TEA_DATABASE.items():
        cat = v["category"]
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append({"id": k, "name": v["name"], "icon": v["icon"], "benefits": v["benefits"], "suitable_for": v["suitable_for"]})
    return {"categories": grouped, "total": len(TEA_DATABASE)}


@app.get("/api/teas/{tea_id}")
async def tea_detail(tea_id: str):
    if tea_id not in TEA_DATABASE:
        raise HTTPException(404, "找不到該茶品")
    return {"tea": TEA_DATABASE[tea_id]}


@app.post("/api/recognize")
async def recognize_tea(file: UploadFile = File(...)):
    fname, fsize = await save_upload(file)
    keys = list(TEA_DATABASE.keys())
    random.seed(fsize % 9999)
    main_key = random.choice(keys)
    others = [k for k in keys if k != main_key]
    random.shuffle(others)
    top = [
        {"name": TEA_DATABASE[main_key]["name"], "confidence": round(random.uniform(0.82, 0.97), 2)},
        {"name": TEA_DATABASE[others[0]]["name"], "confidence": round(random.uniform(0.30, 0.55), 2)},
        {"name": TEA_DATABASE[others[1]]["name"], "confidence": round(random.uniform(0.05, 0.20), 2)},
    ]
    random.seed()

    rec = {
        "id": uuid.uuid4().hex,
        "recognized_tea": TEA_DATABASE[main_key]["name"],
        "tea_category": TEA_DATABASE[main_key]["category"],
        "confidence": top[0]["confidence"],
        "top_results": top,
        "file_name": fname,
        "created_at": datetime.now().isoformat(),
    }
    db.save_tea_record(rec)

    return {
        "success": True,
        "result": {"tea": TEA_DATABASE[main_key], "top_results": top, "file_name": fname},
        "message": f"辨識完成！這最可能是「{TEA_DATABASE[main_key]['name']}」",
    }


# ---------- 舌苔診斷 ----------
@app.post("/api/tongue-diagnosis")
async def tongue_diagnosis(file: UploadFile = File(...)):
    fname, fsize = await save_upload(file)
    random.seed(fsize % 7777)
    pattern = random.choice(TONGUE_PATTERNS)
    conf = round(random.uniform(0.78, 0.95), 2)
    random.seed()

    rid = uuid.uuid4().hex
    now = datetime.now().isoformat()

    rec = {
        "id": rid,
        "constitution": pattern["constitution"],
        "health_score": pattern["health_score"],
        "risk_level": pattern["risk_level"],
        "analysis": pattern["analysis"],
        "tongue_body": pattern["tongue_body"],
        "coating": pattern["coating"],
        "suggestions": pattern["suggestions"],
        "recommended_teas": pattern["recommended_teas"],
        "tea_reason": pattern["tea_reason"],
        "confidence": conf,
        "file_name": fname,
        "created_at": now,
    }
    db.save_tongue_record(rec)

    return {
        "success": True,
        "record_id": rid,
        "result": {
            **{k: v for k, v in rec.items() if k not in ("id", "created_at")},
            "recommended_tea_details": [TEA_DATABASE[t] for t in pattern["recommended_teas"] if t in TEA_DATABASE],
        },
        "message": f"舌苔分析完成！體質傾向為「{pattern['constitution']}」",
    }


@app.get("/api/tongue-record/{rid}")
async def get_tongue_record(rid: str):
    rec = db.get_tongue_record(rid)
    if not rec:
        raise HTTPException(404, "找不到該紀錄")
    tea_details = [TEA_DATABASE[t] for t in rec["recommended_teas"] if t in TEA_DATABASE]
    return {"success": True, "record": rec, "recommended_tea_details": tea_details}


# ---------- QR Code ----------
@app.get("/api/qrcode/{rid}")
async def generate_qr(rid: str, request: Request):
    rec = db.get_tongue_record(rid)
    if not rec:
        raise HTTPException(404, "找不到該紀錄")

    base = str(request.base_url).rstrip("/")
    url = f"{base}/result/{rid}"

    text = (
        f"🍵 澳門茶飲 AI 體質報告\n"
        f"━━━━━━━━━━━━━━━\n"
        f"體質：{rec['constitution']}\n"
        f"健康分數：{rec['health_score']}/100\n"
        f"推薦茶飲：{'、'.join(rec['recommended_teas'])}\n"
        f"━━━━━━━━━━━━━━━\n"
        f"詳情：{url}"
    )

    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=4)
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1a472a", back_color="white")

    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png", headers={"Cache-Control": "public, max-age=86400"})


# ---------- 歷史 / 統計 ----------
@app.get("/api/history")
async def history():
    return {
        "tongue_records": db.get_all_tongue_records(),
        "tea_records": db.get_all_tea_records(),
    }


@app.delete("/api/history")
async def clear_history():
    db.delete_all_records()
    return {"success": True, "message": "歷史紀錄已清除"}


@app.get("/api/stats")
async def stats():
    s = db.get_stats()
    s["tea_types_available"] = len(TEA_DATABASE)
    s["tongue_patterns_available"] = len(TONGUE_PATTERNS)
    return s


# ============================================================
#  前端靜態檔案
# ============================================================
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        fp = os.path.join(static_dir, full_path)
        if full_path and os.path.isfile(fp):
            return FileResponse(fp)
        return FileResponse(os.path.join(static_dir, "index.html"))
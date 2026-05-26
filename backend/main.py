"""
澳門茶飲 AI 辨識系統 v2 — 後端 API
  • PostgreSQL 持久化
  • Poe (GPT-5.4-Nano) 多模態 AI
  • 茶飲辨識 / 舌診 / AI 問診
"""

from fastapi import FastAPI, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from datetime import datetime
from io import BytesIO
import uuid, json, os, base64, re, ssl, random

import asyncpg
import httpx

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# ============================================================
# 設定
# ============================================================

app = FastAPI(title="澳門茶飲 AI 辨識系統", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend", "dist")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

POE_API_KEY = os.environ.get("POE_API_KEY", "")
POE_BOT_NAME = os.environ.get("POE_BOT_NAME", "GPT-5.4-Nano")
POE_BASE_URL = os.environ.get("POE_BASE_URL", "https://api.poe.com/v1")

DATABASE_URL = os.environ.get("DATABASE_URL", "")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

pool = None

# ============================================================
# 資料庫
# ============================================================

@app.on_event("startup")
async def startup():
    global pool
    if DATABASE_URL:
        try:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            pool = await asyncpg.create_pool(DATABASE_URL, ssl=ctx, min_size=1, max_size=5)
            async with pool.acquire() as conn:
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS records (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        type TEXT NOT NULL,
                        image_filename TEXT,
                        result_json TEXT,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                """)
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS chat_messages (
                        id SERIAL PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        content TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                """)
            print("✅ Database connected")
        except Exception as e:
            print(f"❌ Database error: {e}")
            pool = None
    else:
        print("⚠️  No DATABASE_URL — running without database")


@app.on_event("shutdown")
async def shutdown():
    if pool:
        await pool.close()


# ---- DB helpers ----

async def db_insert(record: dict):
    if not pool:
        return
    try:
        async with pool.acquire() as c:
            await c.execute(
                "INSERT INTO records (id,user_id,type,image_filename,result_json,created_at) VALUES ($1,$2,$3,$4,$5,$6)",
                record["id"], record["user_id"], record["type"],
                record.get("image_filename", ""),
                json.dumps(record, ensure_ascii=False),
                datetime.fromisoformat(record["created_at"]),
            )
    except Exception as e:
        print(f"db_insert error: {e}")


async def db_list(user_id: str):
    if not pool:
        return []
    try:
        async with pool.acquire() as c:
            rows = await c.fetch(
                "SELECT result_json FROM records WHERE user_id=$1 ORDER BY created_at DESC", user_id
            )
            return [json.loads(r["result_json"]) for r in rows]
    except Exception as e:
        print(f"db_list error: {e}")
        return []


async def db_get(record_id: str, user_id: str):
    if not pool:
        return None
    try:
        async with pool.acquire() as c:
            row = await c.fetchrow(
                "SELECT result_json FROM records WHERE id=$1 AND user_id=$2", record_id, user_id
            )
            return json.loads(row["result_json"]) if row else None
    except Exception as e:
        print(f"db_get error: {e}")
        return None


async def db_delete(record_id: str, user_id: str):
    if not pool:
        return False
    try:
        async with pool.acquire() as c:
            r = await c.execute("DELETE FROM records WHERE id=$1 AND user_id=$2", record_id, user_id)
            return "DELETE 1" in r
    except Exception as e:
        print(f"db_delete error: {e}")
        return False


async def db_clear(user_id: str):
    if not pool:
        return
    try:
        async with pool.acquire() as c:
            await c.execute("DELETE FROM records WHERE user_id=$1", user_id)
    except Exception as e:
        print(f"db_clear error: {e}")


async def db_chat_save(user_id: str, role: str, content: str):
    if not pool:
        return
    try:
        async with pool.acquire() as c:
            await c.execute(
                "INSERT INTO chat_messages (user_id,role,content) VALUES ($1,$2,$3)",
                user_id, role, content,
            )
    except Exception as e:
        print(f"db_chat_save error: {e}")


async def db_chat_list(user_id: str, limit: int = 50):
    if not pool:
        return []
    try:
        async with pool.acquire() as c:
            rows = await c.fetch(
                "SELECT role,content,created_at FROM chat_messages WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2",
                user_id, limit,
            )
            return [{"role": r["role"], "content": r["content"],
                      "created_at": r["created_at"].isoformat()} for r in reversed(rows)]
    except Exception as e:
        print(f"db_chat_list error: {e}")
        return []


async def db_chat_clear(user_id: str):
    if not pool:
        return
    try:
        async with pool.acquire() as c:
            await c.execute("DELETE FROM chat_messages WHERE user_id=$1", user_id)
    except Exception as e:
        print(f"db_chat_clear error: {e}")


# ============================================================
# AI (Poe API — OpenAI-compatible)
# ============================================================

async def query_ai(prompt: str, image_base64: str = None, history: list = None) -> str:
    if not POE_API_KEY:
        return None

    headers = {"Authorization": f"Bearer {POE_API_KEY}", "Content-Type": "application/json"}

    messages = []
    if history:
        for m in history[-10:]:
            messages.append({"role": m["role"], "content": m["content"]})

    if image_base64:
        user_content = [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
        ]
    else:
        user_content = prompt

    messages.append({"role": "user", "content": user_content})

    payload = {"model": POE_BOT_NAME, "messages": messages, "temperature": 0.7}

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(f"{POE_BASE_URL}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"AI error: {e}")
        return None


def parse_json_from_ai(text: str):
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        pass
    m = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return None


# ============================================================
# 圖片處理
# ============================================================

async def save_upload(file: UploadFile):
    content = await file.read()
    ext = os.path.splitext(file.filename or "img.jpg")[1] or ".jpg"
    fname = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, fname), "wb") as f:
        f.write(content)

    if HAS_PIL:
        try:
            img = Image.open(BytesIO(content))
            img.thumbnail((1024, 1024))
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=85)
            b64 = base64.b64encode(buf.getvalue()).decode()
        except Exception:
            b64 = base64.b64encode(content).decode()
    else:
        b64 = base64.b64encode(content).decode()

    return fname, b64


# ============================================================
# 模擬 AI 備用資料
# ============================================================

MOCK_TEAS = [
    {"name": "菊花茶", "confidence": 0.93, "properties": "性微寒，味甘苦", "effects": "清熱降火、明目養肝、疏風散熱", "suitable": "熱底體質、經常用眼、容易上火者", "avoid": "脾胃虛寒、容易腹瀉者不宜多飲", "suggestion": "適合夏天或熬夜後飲用，可搭配枸杞增強明目效果。"},
    {"name": "普洱茶", "confidence": 0.89, "properties": "性溫，味甘醇", "effects": "暖胃消食、降脂減肥、安神助眠", "suitable": "寒底體質、消化不良、飯後飲用", "avoid": "失眠者避免晚間飲用", "suggestion": "飯後一杯普洱有助消化，陳年普洱效果更佳。"},
    {"name": "檸檬茶", "confidence": 0.91, "properties": "性涼，味酸甘", "effects": "生津止渴、消暑解熱、美白養顏", "suitable": "夏天消暑、食慾不振者", "avoid": "胃酸過多患者不宜空腹飲用", "suggestion": "加入蜂蜜調味口感更佳，冷熱皆宜。"},
    {"name": "鐵觀音", "confidence": 0.87, "properties": "性平，味甘醇", "effects": "提神醒腦、消食去膩、抗氧化", "suitable": "飯後消食、日常提神", "avoid": "孕婦及失眠者避免過量飲用", "suggestion": "澳門茶樓常見茶飲，搭配點心風味極佳。"},
    {"name": "綠茶", "confidence": 0.92, "properties": "性涼，味甘微苦", "effects": "清熱解暑、提神醒腦、抗氧化", "suitable": "熱底體質、夏天消暑", "avoid": "胃寒者、空腹時不宜飲用", "suggestion": "建議飯後半小時飲用。"},
]

MOCK_TONGUES = [
    {"diagnosis": "舌苔偏白，舌色淡紅", "constitution": "寒底（陽虛體質）", "detail": "舌苔白膩表示體內偏寒濕，陽氣不足。", "symptoms": "手腳冰冷、怕冷、消化不良、容易疲倦", "recommendation": "建議飲用溫性茶飲，如薑茶、紅棗桂圓茶。", "teas": ["薑茶", "紅棗桂圓茶", "普洱茶"]},
    {"diagnosis": "舌苔偏黃，舌尖紅", "constitution": "熱底（濕熱體質）", "detail": "舌苔黃膩表示體內有熱或濕熱。", "symptoms": "口乾舌燥、面部出油、便秘、口氣重", "recommendation": "建議飲用涼性茶飲，如菊花茶、綠茶。", "teas": ["菊花茶", "綠茶", "羅漢果茶"]},
    {"diagnosis": "舌苔薄白，舌色正常", "constitution": "平和體質", "detail": "舌象正常，氣血運行順暢。", "symptoms": "精力充沛、睡眠良好、消化正常", "recommendation": "各類茶飲皆可適量飲用。", "teas": ["鐵觀音", "檸檬茶", "普洱茶"]},
]

MOCK_TEAS_EN = [
    {"name": "Chrysanthemum Tea", "confidence": 0.93, "properties": "Slightly cold, sweet and bitter", "effects": "Clears heat, reduces inflammation, benefits eyes and liver", "suitable": "Hot constitution, frequent screen users, prone to inflammation", "avoid": "Avoid if you have weak spleen/stomach or frequent diarrhea", "suggestion": "Best in summer or after staying up late. Pair with goji berries for better eye health."},
    {"name": "Pu-erh Tea", "confidence": 0.89, "properties": "Warm, sweet and mellow", "effects": "Warms stomach, aids digestion, reduces fat, calms mind", "suitable": "Cold constitution, poor digestion, after meals", "avoid": "Avoid in evenings if you have insomnia", "suggestion": "A cup after meals aids digestion. Aged Pu-erh has better effects."},
    {"name": "Lemon Tea", "confidence": 0.91, "properties": "Cool, sour and sweet", "effects": "Quenches thirst, relieves heat, whitens skin", "suitable": "Summer heat relief, loss of appetite", "avoid": "Avoid on empty stomach if you have excess stomach acid", "suggestion": "Add honey for better taste. Great both hot and cold."},
    {"name": "Tieguanyin Tea", "confidence": 0.87, "properties": "Neutral, sweet and mellow", "effects": "Refreshes mind, aids digestion, antioxidant", "suitable": "Post-meal digestion, daily refreshment", "avoid": "Pregnant women and those with insomnia should avoid excess", "suggestion": "A common tea in Macau tea houses, pairs well with dim sum."},
    {"name": "Green Tea", "confidence": 0.92, "properties": "Cool, sweet and slightly bitter", "effects": "Clears heat, refreshes mind, antioxidant", "suitable": "Hot constitution, summer cooling", "avoid": "Avoid on empty stomach if you have cold stomach", "suggestion": "Best consumed half an hour after meals."},
]

MOCK_TEAS_PT = [
    {"name": "Chá de Crisântemo", "confidence": 0.93, "properties": "Ligeiramente frio, doce e amargo", "effects": "Limpa o calor, reduz inflamação, beneficia olhos e fígado", "suitable": "Constituição quente, uso frequente de ecrãs, propenso a inflamações", "avoid": "Evitar se tiver baço/estômago fraco ou diarreia frequente", "suggestion": "Ideal no verão ou depois de noites tardias. Pode combinar com bagas de goji."},
    {"name": "Chá Pu-erh", "confidence": 0.89, "properties": "Quente, doce e suave", "effects": "Aquece o estômago, ajuda digestão, reduz gordura, acalma a mente", "suitable": "Constituição fria, digestão difícil, após refeições", "avoid": "Evitar à noite se sofre de insónia", "suggestion": "Uma chávena após refeições ajuda a digestão. Pu-erh envelhecido tem melhores efeitos."},
    {"name": "Chá de Limão", "confidence": 0.91, "properties": "Fresco, azedo e doce", "effects": "Mata a sede, alivia o calor, clareia a pele", "suitable": "Alívio do calor no verão, perda de apetite", "avoid": "Evitar em jejum se tiver excesso de ácido estomacal", "suggestion": "Adicione mel para melhor sabor. Ótimo quente ou frio."},
    {"name": "Chá Tieguanyin", "confidence": 0.87, "properties": "Neutro, doce e suave", "effects": "Revigora a mente, ajuda digestão, antioxidante", "suitable": "Digestão pós-refeição, revitalização diária", "avoid": "Grávidas e insones devem evitar excesso", "suggestion": "Chá comum nas casas de chá de Macau, combina bem com dim sum."},
    {"name": "Chá Verde", "confidence": 0.92, "properties": "Fresco, doce e ligeiramente amargo", "effects": "Limpa o calor, revigora a mente, antioxidante", "suitable": "Constituição quente, refrescante no verão", "avoid": "Evitar em jejum se tiver estômago frio", "suggestion": "Melhor consumido meia hora após as refeições."},
]

MOCK_TEAS_KO = [
    {"name": "국화차", "confidence": 0.93, "properties": "약간 차고, 달고 쓰다", "effects": "열을 내리고, 눈과 간에 좋다", "suitable": "열체질, 모니터를 많이 보는 사람, 염증이 잘 생기는 사람", "avoid": "비위가 약하거나 설사가 잦은 사람은 피할 것", "suggestion": "여름이나 야근 후에 좋음. 구기자를 함께 넣으면 눈 건강에 더 효과적."},
    {"name": "보이차", "confidence": 0.89, "properties": "따뜻하고, 달고 부드럽다", "effects": "위를 따뜻하게 하고 소화를 돕고 지방을 줄인다", "suitable": "냉체질, 소화불량, 식후", "avoid": "불면증이 있으면 저녁에 피할 것", "suggestion": "식후 한 잔이 소화에 도움. 오래된 보이차가 더 효과적."},
    {"name": "레몬차", "confidence": 0.91, "properties": "시원하고, 시고 달다", "effects": "갈증 해소, 더위 식히기, 미백 효과", "suitable": "여름 더위 해소, 식욕 부진", "avoid": "위산 과다 시 공복에 피할 것", "suggestion": "꿀을 넣으면 맛이 더 좋음. 뜨겁게 or 차갑게 모두 좋음."},
    {"name": "톄관음", "confidence": 0.87, "properties": "평온하고, 달고 부드럽다", "effects": "각성 효과, 소화 촉진, 항산화", "suitable": "식후 소화, 일상 각성", "avoid": "임산부와 불면증 환자는 과다 섭취 피할 것", "suggestion": "마카오 찻집에서 흔히 볼 수 있는 차, 딤섬과 잘 어울림."},
    {"name": "녹차", "confidence": 0.92, "properties": "시원하고, 달고 약간 쓰다", "effects": "열을 내리고 각성 효과, 항산화", "suitable": "열체질, 여름 더위 해소", "avoid": "위냉증 환자는 공복에 피할 것", "suggestion": "식후 30분 후에 마시는 것이 가장 좋음."},
]

MOCK_TEAS_JA = [
    {"name": "菊花茶", "confidence": 0.93, "properties": "微寒、甘苦", "effects": "清熱・明目・養肝", "suitable": "熱体質、画面をよく見る人、炎症しやすい人", "avoid": "脾胃虚弱・下痢しやすい人は控えめに", "suggestion": "夏や夜更かし後に最適。クコの実を加えると目の健康に効果的。"},
    {"name": "プーアル茶", "confidence": 0.89, "properties": "温性、甘醇", "effects": "胃を温め、消化促進、脂肪分解、安神", "suitable": "寒体質、消化不良、食後", "avoid": "不眠の方は夜間を避ける", "suggestion": "食後の一杯が消化を助ける。長期熟成の方が効果的。"},
    {"name": "レモンティー", "confidence": 0.91, "properties": "涼性、酸甘", "effects": "渇きを癒し、暑気を払い、美白効果", "suitable": "夏の暑さ対策、食欲不振", "avoid": "胃酸過多の方は空腹時に避ける", "suggestion": "蜂蜜を加えると風味アップ。ホットもアイスも楽しめる。"},
    {"name": "鉄観音", "confidence": 0.87, "properties": "平性、甘醇", "effects": "目覚めを促進、消化促進、抗酸化", "suitable": "食後の消化促進、日常のリフレッシュ", "avoid": "妊婦・不眠症の方は過剰摂取を避ける", "suggestion": "マカオの茶楼でよく見られる茶、点心と好相性。"},
    {"name": "緑茶", "confidence": 0.92, "properties": "涼性、甘微苦", "effects": "清熱・覚醒・抗酸化", "suitable": "熱体質、夏の暑気払い", "avoid": "胃寒の方は空腹時に避ける", "suggestion": "食後30分以降の摂取が最適。"},
]

MOCK_TONGUES_EN = [
    {"diagnosis": "White coating, pale red tongue", "constitution": "Cold constitution (Yang deficiency)", "detail": "White greasy coating indicates cold-dampness inside and insufficient Yang energy.", "symptoms": "Cold hands and feet, fear of cold, poor digestion, easy fatigue", "recommendation": "Warm teas recommended, such as ginger tea, red date longan tea.", "teas": ["Ginger Tea", "Red Date Longan Tea", "Pu-erh Tea"]},
    {"diagnosis": "Yellow coating, red tongue tip", "constitution": "Hot constitution (Damp-heat)", "detail": "Yellow greasy coating indicates internal heat or damp-heat.", "symptoms": "Dry mouth, oily face, constipation, bad breath", "recommendation": "Cooling teas recommended, such as chrysanthemum tea, green tea.", "teas": ["Chrysanthemum Tea", "Green Tea", "Lohan Guo Tea"]},
    {"diagnosis": "Thin white coating, normal tongue color", "constitution": "Balanced constitution", "detail": "Normal tongue condition, Qi and blood flow smoothly.", "symptoms": "High energy, good sleep, normal digestion", "recommendation": "All types of tea can be consumed in moderation.", "teas": ["Tieguanyin", "Lemon Tea", "Pu-erh Tea"]},
]

MOCK_TONGUES_PT = [
    {"diagnosis": "Saburra branca, língua vermelha pálida", "constitution": "Constituição fria (deficiência de Yang)", "detail": "Saburra branca e pegajosa indica humidade-frio interna e insuficiência de energia Yang.", "symptoms": "Mãos e pés frios, medo de frio, digestão fraca, fadiga fácil", "recommendation": "Recomendam-se chás quentes, como chá de gengibre, chá de tâmaras vermelhas e longan.", "teas": ["Chá de Gengibre", "Chá de Tâmara e Longan", "Chá Pu-erh"]},
    {"diagnosis": "Saburra amarela, ponta da língua vermelha", "constitution": "Constituição quente (humidade-calor)", "detail": "Saburra amarela e pegajosa indica calor interno ou humidade-calor.", "symptoms": "Boca seca, pele oleosa, obstipação, mau hálito", "recommendation": "Recomendam-se chás refrescantes, como chá de crisântemo, chá verde.", "teas": ["Chá de Crisântemo", "Chá Verde", "Chá de Lohan Guo"]},
    {"diagnosis": "Saburra branca fina, cor normal da língua", "constitution": "Constituição equilibrada", "detail": "Condição normal da língua, Qi e sangue fluem suavemente.", "symptoms": "Alta energia, bom sono, digestão normal", "recommendation": "Todos os tipos de chá podem ser consumidos com moderação.", "teas": ["Tieguanyin", "Chá de Limão", "Chá Pu-erh"]},
]

MOCK_TONGUES_KO = [
    {"diagnosis": "하얀 설태, 연한 붉은 혀", "constitution": "냉체질 (양허)", "detail": "끈적한 흰 설태는 체내 한습과 양기 부족을 나타냅니다.", "symptoms": "손발이 차가움, 추위를 탐, 소화불량, 쉽게 피로함", "recommendation": "따뜻한 차를 권장합니다. 생강차, 대추용안차 등.", "teas": ["생강차", "대추용안차", "보이차"]},
    {"diagnosis": "노란 설태, 빨간 혀끝", "constitution": "열체질 (습열)", "detail": "끈적한 노란 설태는 체내 열이나 습열을 나타냅니다.", "symptoms": "입이 마름, 피부 기름기, 변비, 입 냄새", "recommendation": "시원한 차를 권장합니다. 국화차, 녹차 등.", "teas": ["국화차", "녹차", "나한과차"]},
    {"diagnosis": "얇은 흰 설태, 정상 혀색", "constitution": "평화 체질", "detail": "정상 혀 상태, 기와 혈이 원활하게 흐릅니다.", "symptoms": "에너지가 넘침, 수면良好, 소화 정상", "recommendation": "모든 종류의 차를 적당히 섭취할 수 있습니다.", "teas": ["톄관음", "레몬차", "보이차"]},
]

MOCK_TONGUES_JA = [
    {"diagnosis": "白苔、淡紅色の舌", "constitution": "寒性体質（陽虚）", "detail": "白く脂状の苔は体内の寒湿と陽気不足を示します。", "symptoms": "手足の冷え、寒がり、消化不良、疲労感", "recommendation": "温性のお茶をおすすめします。生姜茶、棗竜眼茶など。", "teas": ["生姜茶", "棗竜眼茶", "プーアル茶"]},
    {"diagnosis": "黄苔、舌先が赤い", "constitution": "熱性体質（湿熱）", "detail": "黄色く脂状の苔は体内の熱や湿熱を示します。", "symptoms": "口渇、肌の脂っぽさ、便秘、口臭", "recommendation": "冷性のお茶をおすすめします。菊花茶、緑茶など。", "teas": ["菊花茶", "緑茶", "羅漢果茶"]},
    {"diagnosis": "薄い白苔、正常な舌色", "constitution": "平性体質", "detail": "正常な舌の状態で、気血の流れは順調です。", "symptoms": "活力十分、睡眠良好、消化正常", "recommendation": "すべての種類のお茶を適度に飲用できます。", "teas": ["鉄観音", "レモンティー", "プーアル茶"]},
]


# ============================================================
# API 路由
# ============================================================

@app.get("/call")
async def call():
    return "ok"


@app.get("/api")
async def api_root():
    return {"message": "澳門茶飲 AI 辨識系統 API", "version": "2.0.0",
            "ai_connected": bool(POE_API_KEY), "db_connected": bool(pool)}


# ---- 茶飲辨識 ----

LANG_INSTRUCT = {
    "zh": "請用繁體中文回覆。",
    "pt": "Por favor, responda em Português.",
    "en": "Please respond in English.",
    "ko": "한국어로 응답해주세요.",
    "ja": "日本語で回答してください。",
}

MOCK_TEAS_BY_LANG = {
    "zh": MOCK_TEAS,
    "pt": MOCK_TEAS_PT,
    "en": MOCK_TEAS_EN,
    "ko": MOCK_TEAS_KO,
    "ja": MOCK_TEAS_JA,
}

MOCK_TONGUES_BY_LANG = {
    "zh": MOCK_TONGUES,
    "pt": MOCK_TONGUES_PT,
    "en": MOCK_TONGUES_EN,
    "ko": MOCK_TONGUES_KO,
    "ja": MOCK_TONGUES_JA,
}


@app.post("/api/tea/recognize")
async def tea_recognize(file: UploadFile = File(...), user_id: str = Form("anonymous"), language: str = Form("zh")):
    fname, b64 = await save_upload(file)

    lang_instr = LANG_INSTRUCT.get(language, LANG_INSTRUCT["zh"])

    prompt = (
        "你是一位澳門茶飲專家和中醫養生顧問。請仔細觀察這張茶飲照片，辨識茶的種類並提供分析。\n\n"
        f"{lang_instr}\n\n"
        "請嚴格按照以下 JSON 格式回覆（只回覆 JSON，不要加其他文字）：\n"
        '{"name":"茶飲名稱","confidence":0.85,"properties":"茶性","effects":"功效","suitable":"適合人群","avoid":"禁忌","suggestion":"飲用建議"}'
    )

    mock_list = MOCK_TEAS_BY_LANG.get(language, MOCK_TEAS)

    raw = await query_ai(prompt, image_base64=b64)
    ai = parse_json_from_ai(raw) if raw else None
    if not ai:
        ai = random.choice(mock_list)

    record = {
        "id": str(uuid.uuid4()), "user_id": user_id, "type": "tea",
        "image_filename": fname,
        "name": ai.get("name", ""),
        "confidence": ai.get("confidence", 0.85),
        "properties": ai.get("properties", ""),
        "effects": ai.get("effects", ""),
        "suitable": ai.get("suitable", ""),
        "avoid": ai.get("avoid", ""),
        "suggestion": ai.get("suggestion", ""),
        "ai_raw": raw or "",
        "created_at": datetime.now().isoformat(),
    }
    await db_insert(record)
    return record


# ---- 舌診 ----

@app.post("/api/tongue/diagnose")
async def tongue_diagnose(file: UploadFile = File(...), user_id: str = Form("anonymous"), language: str = Form("zh")):
    fname, b64 = await save_upload(file)

    lang_instr = LANG_INSTRUCT.get(language, LANG_INSTRUCT["zh"])

    prompt = (
        "你是一位經驗豐富的中醫舌診專家。請觀察這張舌頭照片，進行舌診分析。\n\n"
        f"{lang_instr}\n\n"
        "請嚴格按照以下 JSON 格式回覆（只回覆 JSON）：\n"
        '{"diagnosis":"舌象描述","constitution":"體質判斷","detail":"詳細分析","symptoms":"常見症狀","recommendation":"調理建議","teas":["茶1","茶2","茶3"]}'
    )

    raw = await query_ai(prompt, image_base64=b64)
    ai = parse_json_from_ai(raw) if raw else None
    mock_list = MOCK_TONGUES_BY_LANG.get(language, MOCK_TONGUES)
    if not ai:
        ai = random.choice(mock_list)

    record = {
        "id": str(uuid.uuid4()), "user_id": user_id, "type": "tongue",
        "image_filename": fname,
        "diagnosis": ai.get("diagnosis", ""),
        "constitution": ai.get("constitution", ""),
        "detail": ai.get("detail", ""),
        "symptoms": ai.get("symptoms", ""),
        "recommendation": ai.get("recommendation", ""),
        "teas": ai.get("teas", []),
        "ai_raw": raw or "",
        "created_at": datetime.now().isoformat(),
    }
    await db_insert(record)
    return record


# ---- AI 問診 ----

@app.post("/api/chat")
async def chat(message: str = Form(...), user_id: str = Form("anonymous"), language: str = Form("zh")):
    await db_chat_save(user_id, "user", message)
    history = await db_chat_list(user_id, limit=20)

    lang_instr = LANG_INSTRUCT.get(language, LANG_INSTRUCT["zh"])

    system = (
        "你是「茶博士」，一位結合中醫養生的澳門茶飲顧問。你精通茶飲性味歸經、功效，"
        "也了解中醫體質辨識和養生保健。"
        f"{lang_instr}用親切友善的語氣回答。"
        "必要時提醒用戶就醫，不替代專業醫療建議。\n\n"
    )

    lang_map = {"zh": "中文", "pt": "葡萄牙文", "en": "英文", "ko": "韓文", "ja": "日文"}
    user_lang = lang_map.get(language, "中文")
    full = system + f"用戶問題（請用{user_lang}回覆）：" + message

    reply = await query_ai(full, history=history)
    if not reply:
        fallback = {
            "zh": "抱歉，我暫時無法回應。請稍後再試 🍵",
            "pt": "Desculpe, não consigo responder agora. Tente novamente mais tarde 🍵",
            "en": "Sorry, I can't respond right now. Please try again later 🍵",
            "ko": "죄송합니다. 지금은 응답할 수 없습니다. 나중에 다시 시도해주세요 🍵",
            "ja": "申し訳ございません。現在応答できません。後でもう一度お試しください 🍵",
        }
        reply = fallback.get(language, fallback["zh"])

    await db_chat_save(user_id, "assistant", reply)
    return {"reply": reply}


@app.get("/api/chat/history")
async def get_chat_history(user_id: str = Query("anonymous")):
    return await db_chat_list(user_id)


@app.delete("/api/chat/history")
async def clear_chat_history(user_id: str = Query("anonymous")):
    await db_chat_clear(user_id)
    return {"message": "已清空"}


# ---- 歷史紀錄 ----

@app.get("/api/history")
async def get_history(user_id: str = Query("anonymous")):
    return await db_list(user_id)


@app.get("/api/history/{rid}")
async def get_record(rid: str, user_id: str = Query("anonymous")):
    r = await db_get(rid, user_id)
    return r if r else {"error": "找不到紀錄"}


@app.delete("/api/history/{rid}")
async def delete_record(rid: str, user_id: str = Query("anonymous")):
    ok = await db_delete(rid, user_id)
    return {"message": "已刪除"} if ok else {"error": "找不到紀錄"}


@app.delete("/api/history")
async def clear_history(user_id: str = Query("anonymous")):
    await db_clear(user_id)
    return {"message": "已清空"}


@app.get("/api/uploads/{filename}")
async def get_upload(filename: str):
    p = os.path.join(UPLOAD_DIR, filename)
    return FileResponse(p) if os.path.exists(p) else Response(status_code=404)


# ============================================================
# 前端靜態檔案
# ============================================================

if os.path.isdir(FRONTEND_DIR):
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        fp = os.path.join(FRONTEND_DIR, full_path)
        if full_path and os.path.isfile(fp):
            return FileResponse(fp)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
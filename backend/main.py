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


# ============================================================
# API 路由
# ============================================================

@app.get("/api")
async def api_root():
    return {"message": "澳門茶飲 AI 辨識系統 API", "version": "2.0.0",
            "ai_connected": bool(POE_API_KEY), "db_connected": bool(pool)}


# ---- 茶飲辨識 ----

@app.post("/api/tea/recognize")
async def tea_recognize(file: UploadFile = File(...), user_id: str = Form("anonymous")):
    fname, b64 = await save_upload(file)

    prompt = (
        "你是一位澳門茶飲專家和中醫養生顧問。請仔細觀察這張茶飲照片，辨識茶的種類並提供分析。\n\n"
        "請嚴格按照以下 JSON 格式回覆（只回覆 JSON，不要加其他文字）：\n"
        '{"name":"茶飲名稱","confidence":0.85,"properties":"茶性","effects":"功效","suitable":"適合人群","avoid":"禁忌","suggestion":"飲用建議"}'
    )

    raw = await query_ai(prompt, image_base64=b64)
    ai = parse_json_from_ai(raw) if raw else None
    if not ai:
        ai = random.choice(MOCK_TEAS)

    record = {
        "id": str(uuid.uuid4()), "user_id": user_id, "type": "tea",
        "image_filename": fname,
        "name": ai.get("name", "未知茶飲"),
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
async def tongue_diagnose(file: UploadFile = File(...), user_id: str = Form("anonymous")):
    fname, b64 = await save_upload(file)

    prompt = (
        "你是一位經驗豐富的中醫舌診專家。請觀察這張舌頭照片，進行舌診分析。\n\n"
        "請嚴格按照以下 JSON 格式回覆（只回覆 JSON）：\n"
        '{"diagnosis":"舌象描述","constitution":"體質判斷","detail":"詳細分析","symptoms":"常見症狀","recommendation":"調理建議","teas":["茶1","茶2","茶3"]}'
    )

    raw = await query_ai(prompt, image_base64=b64)
    ai = parse_json_from_ai(raw) if raw else None
    if not ai:
        ai = random.choice(MOCK_TONGUES)

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
async def chat(message: str = Form(...), user_id: str = Form("anonymous")):
    await db_chat_save(user_id, "user", message)
    history = await db_chat_list(user_id, limit=20)

    system = (
        "你是「茶博士」，一位結合中醫養生的澳門茶飲顧問。你精通茶飲性味歸經、功效，"
        "也了解中醫體質辨識和養生保健。用繁體中文、親切友善的語氣回答。"
        "必要時提醒用戶就醫，不替代專業醫療建議。\n\n"
    )
    full = system + "用戶問題：" + message

    reply = await query_ai(full, history=history)
    if not reply:
        reply = "抱歉，我暫時無法回應。請稍後再試 🍵"

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
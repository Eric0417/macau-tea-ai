import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "tea_system.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS tongue_records (
            id TEXT PRIMARY KEY,
            constitution TEXT NOT NULL,
            health_score INTEGER,
            risk_level TEXT,
            analysis TEXT,
            tongue_body TEXT,
            coating TEXT,
            suggestions TEXT,
            recommended_teas TEXT,
            tea_reason TEXT,
            confidence REAL,
            file_name TEXT,
            created_at TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS tea_records (
            id TEXT PRIMARY KEY,
            recognized_tea TEXT NOT NULL,
            tea_category TEXT,
            confidence REAL,
            top_results TEXT,
            file_name TEXT,
            created_at TEXT
        )
    """)
    conn.commit()
    conn.close()


# ---------- 舌苔紀錄 ----------

def save_tongue_record(rec: dict):
    conn = get_conn()
    conn.execute(
        """INSERT INTO tongue_records
           (id,constitution,health_score,risk_level,analysis,tongue_body,coating,
            suggestions,recommended_teas,tea_reason,confidence,file_name,created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            rec["id"], rec["constitution"], rec["health_score"], rec["risk_level"],
            rec["analysis"],
            json.dumps(rec["tongue_body"], ensure_ascii=False),
            json.dumps(rec["coating"], ensure_ascii=False),
            json.dumps(rec["suggestions"], ensure_ascii=False),
            json.dumps(rec["recommended_teas"], ensure_ascii=False),
            rec["tea_reason"], rec["confidence"], rec["file_name"], rec["created_at"],
        ),
    )
    conn.commit()
    conn.close()


def get_tongue_record(rid: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM tongue_records WHERE id=?", (rid,)).fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "constitution": row["constitution"],
        "health_score": row["health_score"],
        "risk_level": row["risk_level"],
        "analysis": row["analysis"],
        "tongue_body": json.loads(row["tongue_body"]),
        "coating": json.loads(row["coating"]),
        "suggestions": json.loads(row["suggestions"]),
        "recommended_teas": json.loads(row["recommended_teas"]),
        "tea_reason": row["tea_reason"],
        "confidence": row["confidence"],
        "file_name": row["file_name"],
        "created_at": row["created_at"],
    }


def get_all_tongue_records():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM tongue_records ORDER BY created_at DESC").fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "constitution": r["constitution"],
            "health_score": r["health_score"],
            "risk_level": r["risk_level"],
            "confidence": r["confidence"],
            "file_name": r["file_name"],
            "created_at": r["created_at"],
            "recommended_teas": json.loads(r["recommended_teas"]),
        }
        for r in rows
    ]


# ---------- 茶飲紀錄 ----------

def save_tea_record(rec: dict):
    conn = get_conn()
    conn.execute(
        """INSERT INTO tea_records
           (id,recognized_tea,tea_category,confidence,top_results,file_name,created_at)
           VALUES (?,?,?,?,?,?,?)""",
        (
            rec["id"], rec["recognized_tea"], rec.get("tea_category", ""),
            rec["confidence"],
            json.dumps(rec["top_results"], ensure_ascii=False),
            rec["file_name"], rec["created_at"],
        ),
    )
    conn.commit()
    conn.close()


def get_all_tea_records():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM tea_records ORDER BY created_at DESC").fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "recognized_tea": r["recognized_tea"],
            "tea_category": r["tea_category"],
            "confidence": r["confidence"],
            "file_name": r["file_name"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]


# ---------- 統計 / 清除 ----------

def delete_all_records():
    conn = get_conn()
    conn.execute("DELETE FROM tongue_records")
    conn.execute("DELETE FROM tea_records")
    conn.commit()
    conn.close()


def get_stats():
    conn = get_conn()
    tc = conn.execute("SELECT COUNT(*) c FROM tongue_records").fetchone()["c"]
    rc = conn.execute("SELECT COUNT(*) c FROM tea_records").fetchone()["c"]
    cd = {
        r["constitution"]: r["c"]
        for r in conn.execute(
            "SELECT constitution, COUNT(*) c FROM tongue_records GROUP BY constitution"
        ).fetchall()
    }
    td = {
        r["recognized_tea"]: r["c"]
        for r in conn.execute(
            "SELECT recognized_tea, COUNT(*) c FROM tea_records GROUP BY recognized_tea"
        ).fetchall()
    }
    conn.close()
    return {
        "total_tongue": tc,
        "total_tea": rc,
        "constitution_distribution": cd,
        "tea_distribution": td,
    }
import sqlite3
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "tarot.db"


def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            session_token TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            spread_id TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            spread_type TEXT NOT NULL,
            position_theme TEXT,
            question TEXT,
            cards_json TEXT NOT NULL,
            interpretation TEXT NOT NULL,
            is_mock INTEGER DEFAULT 0,
            is_favorite INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            user_id TEXT PRIMARY KEY,
            default_spread_type TEXT DEFAULT 'three_card',
            default_position_theme TEXT DEFAULT 'past_present_future',
            preferred_theme TEXT DEFAULT 'light',
            updated_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


init_db()


class DatabaseManager:
    @staticmethod
    def get_or_create_user(session_token: Optional[str] = None) -> dict:
        conn = get_db()
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()

        if session_token:
            cursor.execute("SELECT * FROM users WHERE session_token = ?", (session_token,))
            row = cursor.fetchone()
            if row:
                conn.close()
                return dict(row)
            # Create specified user
            new_user_id = "user_" + uuid.uuid4().hex[:12]
            cursor.execute(
                "INSERT INTO users (user_id, session_token, created_at) VALUES (?, ?, ?)",
                (new_user_id, session_token, now)
            )
            conn.commit()
            conn.close()
            return {"user_id": new_user_id, "session_token": session_token, "created_at": now}
        else:
            # Default anonymous user for requests without session header
            cursor.execute("SELECT * FROM users WHERE session_token = 'default_session'")
            row = cursor.fetchone()
            if row:
                conn.close()
                return dict(row)

            new_user_id = "user_default"
            new_token = "default_session"
            cursor.execute(
                "INSERT INTO users (user_id, session_token, created_at) VALUES (?, ?, ?)",
                (new_user_id, new_token, now)
            )
            conn.commit()
            conn.close()
            return {"user_id": new_user_id, "session_token": new_token, "created_at": now}

    @staticmethod
    def save_reading(reading_data: dict, user_id: str) -> dict:
        conn = get_db()
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()

        cards_json = json.dumps([c.model_dump() if hasattr(c, "model_dump") else c for c in reading_data.get("cards", [])])

        cursor.execute("""
            INSERT OR REPLACE INTO readings (
                spread_id, user_id, spread_type, position_theme, question,
                cards_json, interpretation, is_mock, is_favorite, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            reading_data["spread_id"],
            user_id,
            reading_data.get("spread_type", "three_card"),
            reading_data.get("position_theme", "past_present_future"),
            reading_data.get("question", ""),
            cards_json,
            reading_data["interpretation"],
            1 if reading_data.get("is_mock") else 0,
            1 if reading_data.get("is_favorite") else 0,
            reading_data.get("created_at", now)
        ))
        conn.commit()

        cursor.execute("SELECT * FROM readings WHERE spread_id = ?", (reading_data["spread_id"],))
        row = dict(cursor.fetchone())
        row["cards"] = json.loads(row["cards_json"])
        row["is_mock"] = bool(row["is_mock"])
        row["is_favorite"] = bool(row["is_favorite"])
        conn.close()
        return row

    @staticmethod
    def get_readings(
        user_id: str,
        spread_type: Optional[str] = None,
        is_favorite: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[dict]:
        conn = get_db()
        cursor = conn.cursor()

        query = "SELECT * FROM readings WHERE (user_id = ? OR user_id = 'user_default')"
        params = [user_id]

        if spread_type:
            query += " AND spread_type = ?"
            params.append(spread_type)

        if is_favorite is not None:
            query += " AND is_favorite = ?"
            params.append(1 if is_favorite else 0)

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            item = dict(r)
            item["cards"] = json.loads(item["cards_json"])
            item["is_mock"] = bool(item["is_mock"])
            item["is_favorite"] = bool(item["is_favorite"])
            result.append(item)
        conn.close()
        return result

    @staticmethod
    def get_reading(spread_id: str) -> Optional[dict]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM readings WHERE spread_id = ?", (spread_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None
        item = dict(row)
        item["cards"] = json.loads(item["cards_json"])
        item["is_mock"] = bool(item["is_mock"])
        item["is_favorite"] = bool(item["is_favorite"])
        conn.close()
        return item

    @staticmethod
    def delete_reading(spread_id: str, user_id: str) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM readings WHERE spread_id = ?", (spread_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    @staticmethod
    def clear_readings(user_id: str) -> int:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM readings WHERE user_id = ? OR user_id = 'user_default'", (user_id,))
        count = cursor.rowcount
        conn.commit()
        conn.close()
        return count

    @staticmethod
    def toggle_favorite(spread_id: str, user_id: str, is_favorite: Optional[bool] = None) -> bool:
        conn = get_db()
        cursor = conn.cursor()

        if is_favorite is None:
            cursor.execute("SELECT is_favorite FROM readings WHERE spread_id = ?", (spread_id,))
            row = cursor.fetchone()
            if not row:
                conn.close()
                return False
            new_val = 0 if row["is_favorite"] else 1
        else:
            new_val = 1 if is_favorite else 0

        cursor.execute("UPDATE readings SET is_favorite = ? WHERE spread_id = ?", (new_val, spread_id))
        conn.commit()
        conn.close()
        return bool(new_val)

    @staticmethod
    def get_settings(user_id: str) -> dict:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM settings WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return {
                "default_spread_type": "three_card",
                "default_position_theme": "past_present_future",
                "preferred_theme": "light"
            }
        item = dict(row)
        conn.close()
        return item

    @staticmethod
    def update_settings(user_id: str, settings_dict: dict) -> dict:
        conn = get_db()
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
            INSERT OR REPLACE INTO settings (
                user_id, default_spread_type, default_position_theme, preferred_theme, updated_at
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            user_id,
            settings_dict.get("default_spread_type", "three_card"),
            settings_dict.get("default_position_theme", "past_present_future"),
            settings_dict.get("preferred_theme", "light"),
            now
        ))
        conn.commit()
        conn.close()
        return settings_dict


db = DatabaseManager()

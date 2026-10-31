"""
Smart Citizen Complaint Management Portal - Python Flask Service
Separate syllabus demonstration microservice for B.Tech CSE DevOps Lab.
Primary application backend is Spring Boot (Java 21).
"""

import os
import base64
import hashlib
import hmac
import json
import re
import sqlite3
import random
import time
from datetime import datetime
from functools import wraps
from pathlib import Path
from urllib.parse import unquote, urlsplit
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
DATABASE = os.getenv("FLASK_DB_PATH", "complaints_flask.db")
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DATABASE_MIGRATION_URL = os.getenv("DATABASE_MIGRATION_URL", "").strip()
DATABASE_SCHEMA = os.getenv("DATABASE_SCHEMA", "flask_app")
IS_PRODUCTION = os.getenv("APP_ENV") == "production"
if IS_PRODUCTION and not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required in production")
if IS_PRODUCTION and not DATABASE_MIGRATION_URL:
    raise RuntimeError("DATABASE_MIGRATION_URL is required in production")
if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", DATABASE_SCHEMA):
    raise RuntimeError("DATABASE_SCHEMA must be a valid PostgreSQL schema identifier")
if IS_PRODUCTION and DATABASE_SCHEMA != "flask_app":
    raise RuntimeError("DATABASE_SCHEMA must be flask_app in production")
if IS_PRODUCTION:
    runtime_role = urlsplit(DATABASE_URL).username
    migration_role = urlsplit(DATABASE_MIGRATION_URL).username
    if (
        not runtime_role
        or not migration_role
        or unquote(runtime_role) == unquote(migration_role)
    ):
        raise RuntimeError("Production runtime and migration URLs must use separate database roles")
if IS_PRODUCTION and len(os.getenv("JWT_SECRET", "").encode("utf-8")) < 32:
    raise RuntimeError("JWT_SECRET must contain at least 32 bytes in production")

frontend_origin = os.getenv("FRONTEND_ORIGIN")
if IS_PRODUCTION and (not frontend_origin or not frontend_origin.strip()):
    raise RuntimeError("FRONTEND_ORIGIN is required in production")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in (
        frontend_origin or "http://localhost:5173,http://localhost:3000"
    ).split(",")
    if origin.strip()
]
CORS(
    app,
    resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
    allow_headers=["Authorization", "Content-Type"],
    methods=["GET", "POST", "PUT", "OPTIONS"],
    supports_credentials=False,
)


def execute(cursor, sql, params=()):
    if DATABASE_URL:
        sql = sql.replace("?", "%s")
    return cursor.execute(sql, params)

def get_db_connection(database_url=None):
    database_url = DATABASE_URL if database_url is None else database_url
    if database_url:
        import psycopg
        from psycopg.rows import dict_row

        conn = psycopg.connect(database_url, row_factory=dict_row)
        conn.execute(f'SET search_path TO "{DATABASE_SCHEMA}"')
        return conn

    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    if DATABASE_URL:
        migration_conn = get_db_connection(
            DATABASE_MIGRATION_URL or DATABASE_URL
        )
        try:
            cursor = migration_conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version TEXT PRIMARY KEY,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
            migration_dir = Path(__file__).parent / "migrations"
            for migration in sorted(migration_dir.glob("V*__*.sql")):
                version = migration.name.split("__", maxsplit=1)[0]
                execute(cursor, "SELECT version FROM schema_migrations WHERE version = ?", (version,))
                if cursor.fetchone() is not None:
                    continue
                for statement in migration.read_text(encoding="utf-8").split(";"):
                    if statement.strip():
                        cursor.execute(statement)
                execute(cursor, "INSERT INTO schema_migrations (version) VALUES (?)", (version,))
            migration_conn.commit()
        finally:
            migration_conn.close()
        return

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT NOT NULL,
            citizen_name TEXT,
            citizen_email TEXT,
            citizen_phone TEXT,
            status TEXT NOT NULL DEFAULT 'SUBMITTED',
            admin_remark TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    conn.commit()

    # Seed demo data if table is empty
    cursor.execute("SELECT COUNT(*) FROM complaints")
    count = cursor.fetchone()[0]
    if count == 0:
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO complaints (
                complaint_id, title, category, description, location,
                citizen_name, citizen_email, citizen_phone, status, admin_remark, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "CMP-FLASK-101",
            "Broken Water Pipe Line",
            "WATER_SUPPLY",
            "Clean drinking water leaking on 2nd cross road near community center.",
            "2nd Cross Road, Ward 7",
            "Rohan Verma",
            "rohan.v@example.com",
            "9876500001",
            "IN_PROGRESS",
            "Maintenance team on site.",
            now,
            now
        ))
        cursor.execute("""
            INSERT INTO complaints (
                complaint_id, title, category, description, location,
                citizen_name, citizen_email, citizen_phone, status, admin_remark, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "CMP-FLASK-102",
            "Streetlight Failure",
            "STREETLIGHTS",
            "Dark junction causing unsafe road crossing at night.",
            "MG Road Junction",
            "Meera Nair",
            "meera.n@example.com",
            "9876500002",
            "SUBMITTED",
            None,
            now,
            now
        ))
        conn.commit()
    conn.close()

# Initialize DB on startup
init_db()


def _decode_jwt_segment(segment):
    return base64.urlsafe_b64decode(segment + "=" * (-len(segment) % 4))


def get_current_principal():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, "Authentication is required"

    secret = os.getenv("JWT_SECRET", "")
    if len(secret.encode("utf-8")) < 32:
        return None, "Authentication is not configured"

    token = auth_header[7:].strip()
    parts = token.split(".")
    if len(parts) != 3:
        return None, "Invalid authentication token"

    try:
        header = json.loads(_decode_jwt_segment(parts[0]))
        claims = json.loads(_decode_jwt_segment(parts[1]))
        if not isinstance(header, dict) or not isinstance(claims, dict):
            return None, "Invalid authentication token"
        if header.get("alg") != "HS256" or header.get("typ") != "JWT":
            return None, "Invalid authentication token"

        signed_content = f"{parts[0]}.{parts[1]}".encode("ascii")
        expected = base64.urlsafe_b64encode(
            hmac.new(secret.encode("utf-8"), signed_content, hashlib.sha256).digest()
        ).rstrip(b"=").decode("ascii")
        if not hmac.compare_digest(expected, parts[2]):
            return None, "Invalid authentication token"
        if int(claims.get("exp", 0)) <= int(time.time()):
            return None, "Authentication token has expired"
        if not claims.get("sub") or claims.get("role") not in {
            "ROLE_CITIZEN", "ROLE_OFFICER", "ROLE_ADMIN"
        }:
            return None, "Invalid authentication token"
        return claims, None
    except (ValueError, TypeError, UnicodeDecodeError, json.JSONDecodeError):
        return None, "Invalid authentication token"


def require_roles(*roles):
    def decorator(handler):
        @wraps(handler)
        def wrapped(*args, **kwargs):
            principal, error = get_current_principal()
            if error:
                status = 503 if error == "Authentication is not configured" else 401
                return jsonify({"error": error}), status
            if principal["role"] not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return handler(*args, **kwargs)

        return wrapped

    return decorator


def serialize_complaint(row, include_contact=False):
    result = {
        "id": row["id"],
        "complaintId": row["complaint_id"],
        "title": row["title"],
        "category": row["category"],
        "description": row["description"],
        "location": row["location"],
        "status": row["status"],
        "adminRemark": row["admin_remark"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }
    if include_contact:
        result.update({
            "citizenName": row["citizen_name"],
            "citizenEmail": row["citizen_email"],
            "citizenPhone": row["citizen_phone"],
        })
    return result


@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health():
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1")
        conn.close()
    except Exception:
        app.logger.exception("Flask health check failed")
        return jsonify({"status": "DOWN", "service": "flask-citizen-complaint-api"}), 503

    return jsonify({
        "status": "UP",
        "service": "flask-citizen-complaint-api",
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route("/api/complaints", methods=["GET"])
@require_roles("ROLE_OFFICER", "ROLE_ADMIN")
def get_complaints():
    category = request.args.get("category")
    status = request.args.get("status")

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM complaints WHERE 1=1"
    params = []

    if category:
        query += " AND category = ?"
        params.append(category)
    if status:
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY id DESC"
    execute(cursor, query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        results.append(serialize_complaint(row, include_contact=True))
    return jsonify(results), 200

@app.route("/api/complaints/<string:identifier>", methods=["GET"])
def get_complaint_by_id(identifier):
    principal, error = get_current_principal()
    if error:
        status = 503 if error == "Authentication is not configured" else 401
        return jsonify({"error": error}), status

    conn = get_db_connection()
    cursor = conn.cursor()

    if identifier.isdigit():
        execute(cursor, "SELECT * FROM complaints WHERE id = ? OR complaint_id = ?", (int(identifier), identifier))
    else:
        execute(cursor, "SELECT * FROM complaints WHERE complaint_id = ?", (identifier,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Not Found", "message": f"Complaint not found with identifier: {identifier}"}), 404

    is_staff = principal["role"] in {"ROLE_OFFICER", "ROLE_ADMIN"}
    is_owner = (
        principal["role"] == "ROLE_CITIZEN"
        and row["citizen_email"]
        and row["citizen_email"].lower() == principal["sub"].lower()
    )
    if not is_staff and not is_owner:
        return jsonify({"error": "Insufficient permissions"}), 403

    return jsonify(serialize_complaint(row, include_contact=True)), 200


@app.route("/api/complaints/track", methods=["POST"])
def track_complaint():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON object is required"}), 400
    complaint_id = data.get("complaintId")
    verification = data.get("verification")
    if not isinstance(complaint_id, str) or not isinstance(verification, str):
        return jsonify({"error": "Complaint reference and verification are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    execute(cursor, "SELECT * FROM complaints WHERE complaint_id = ?", (complaint_id.strip(),))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Complaint not found"}), 404

    verification = verification.strip()
    matches_email = (
        row["citizen_email"]
        and row["citizen_email"].strip().lower() == verification.lower()
    )
    matches_phone = row["citizen_phone"] and row["citizen_phone"].strip() == verification
    if not matches_email and not matches_phone:
        return jsonify({"error": "Complaint reference and verification do not match"}), 403

    return jsonify(serialize_complaint(row)), 200

@app.route("/api/complaints", methods=["POST"])
def create_complaint():
    principal, error = get_current_principal()
    if error:
        status = 503 if error == "Authentication is not configured" else 401
        return jsonify({"error": error}), status
    if principal["role"] != "ROLE_CITIZEN":
        return jsonify({"error": "Insufficient permissions"}), 403

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Bad Request", "message": "JSON body is required"}), 400

    def clean_string(field):
        value = data.get(field, "")
        return value.strip() if isinstance(value, str) else ""

    title = clean_string("title")
    category = clean_string("category")
    description = clean_string("description")
    location = clean_string("location")

    errors = {}
    if not title or len(title) < 5:
        errors["title"] = "Title is required and must be at least 5 characters"
    if not category:
        errors["category"] = "Category is required"
    if not description or len(description) < 10:
        errors["description"] = "Description is required and must be at least 10 characters"
    if not location:
        errors["location"] = "Location is required"

    if errors:
        return jsonify({"error": "Validation Failed", "validationErrors": errors}), 400

    now = datetime.now().isoformat()
    random_num = random.randint(1000, 9999)
    complaint_id = f"CMP-FLASK-{datetime.now().year}-{random_num}"

    conn = get_db_connection()
    cursor = conn.cursor()
    sql = """
        INSERT INTO complaints (
            complaint_id, title, category, description, location,
            citizen_name, citizen_email, citizen_phone, status, admin_remark, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    if DATABASE_URL:
        sql += " RETURNING id"
    execute(cursor, sql, (
        complaint_id,
        title,
        category,
        description,
        location,
        clean_string("citizenName") or None,
        principal["sub"],
        clean_string("citizenPhone") or None,
        "SUBMITTED",
        None,
        now,
        now
    ))
    new_id = cursor.fetchone()["id"] if DATABASE_URL else cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        "id": new_id,
        "complaintId": complaint_id,
        "title": title,
        "category": category,
        "description": description,
        "location": location,
        "status": "SUBMITTED",
        "adminRemark": None,
        "createdAt": now,
        "updatedAt": now
    }), 201

@app.route("/api/complaints/<string:identifier>/status", methods=["PUT"])
@require_roles("ROLE_OFFICER", "ROLE_ADMIN")
def update_complaint_status(identifier):
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not data.get("status"):
        return jsonify({"error": "Bad Request", "message": "Field 'status' is required"}), 400

    new_status = data["status"]
    if not isinstance(new_status, str) or new_status not in {
        "PENDING", "SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "REJECTED"
    }:
        return jsonify({"error": "Invalid complaint status"}), 400
    admin_remark = data.get("adminRemark")
    now = datetime.now().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()

    if identifier.isdigit():
        execute(cursor, "SELECT * FROM complaints WHERE id = ? OR complaint_id = ?", (int(identifier), identifier))
    else:
        execute(cursor, "SELECT * FROM complaints WHERE complaint_id = ?", (identifier,))

    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Not Found", "message": f"Complaint not found with identifier: {identifier}"}), 404

    target_id = row["id"]
    execute(cursor, """
        UPDATE complaints
        SET status = ?, admin_remark = COALESCE(?, admin_remark), updated_at = ?
        WHERE id = ?
    """, (new_status, admin_remark, now, target_id))
    conn.commit()

    execute(cursor, "SELECT * FROM complaints WHERE id = ?", (target_id,))
    updated_row = cursor.fetchone()
    conn.close()

    return jsonify({
        "id": updated_row["id"],
        "complaintId": updated_row["complaint_id"],
        "title": updated_row["title"],
        "status": updated_row["status"],
        "adminRemark": updated_row["admin_remark"],
        "updatedAt": updated_row["updated_at"]
    }), 200

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

"""
Smart Citizen Complaint Management Portal - Python Flask Service
Separate syllabus demonstration microservice for B.Tech CSE DevOps Lab.
Primary application backend is Spring Boot (Java 21).
"""

import os
import sqlite3
import random
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE = os.getenv("FLASK_DB_PATH", "complaints_flask.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
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

@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "UP",
        "service": "flask-citizen-complaint-api",
        "timestamp": datetime.now().isoformat(),
        "database": "sqlite3"
    }), 200

@app.route("/api/complaints", methods=["GET"])
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
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "complaintId": row["complaint_id"],
            "title": row["title"],
            "category": row["category"],
            "description": row["description"],
            "location": row["location"],
            "citizenName": row["citizen_name"],
            "citizenEmail": row["citizen_email"],
            "citizenPhone": row["citizen_phone"],
            "status": row["status"],
            "adminRemark": row["admin_remark"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"]
        })
    return jsonify(results), 200

@app.route("/api/complaints/<string:identifier>", methods=["GET"])
def get_complaint_by_id(identifier):
    conn = get_db_connection()
    cursor = conn.cursor()

    if identifier.isdigit():
        cursor.execute("SELECT * FROM complaints WHERE id = ? OR complaint_id = ?", (int(identifier), identifier))
    else:
        cursor.execute("SELECT * FROM complaints WHERE complaint_id = ?", (identifier,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Not Found", "message": f"Complaint not found with identifier: {identifier}"}), 404

    return jsonify({
        "id": row["id"],
        "complaintId": row["complaint_id"],
        "title": row["title"],
        "category": row["category"],
        "description": row["description"],
        "location": row["location"],
        "citizenName": row["citizen_name"],
        "citizenEmail": row["citizen_email"],
        "citizenPhone": row["citizen_phone"],
        "status": row["status"],
        "adminRemark": row["admin_remark"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"]
    }), 200

@app.route("/api/complaints", methods=["POST"])
def create_complaint():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required"}), 400

    title = data.get("title", "").strip()
    category = data.get("category", "").strip()
    description = data.get("description", "").strip()
    location = data.get("location", "").strip()

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
    cursor.execute("""
        INSERT INTO complaints (
            complaint_id, title, category, description, location,
            citizen_name, citizen_email, citizen_phone, status, admin_remark, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        complaint_id,
        title,
        category,
        description,
        location,
        data.get("citizenName", "").strip() or None,
        data.get("citizenEmail", "").strip() or None,
        data.get("citizenPhone", "").strip() or None,
        "SUBMITTED",
        None,
        now,
        now
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        "id": new_id,
        "complaintId": complaint_id,
        "title": title,
        "category": category,
        "description": description,
        "location": location,
        "citizenName": data.get("citizenName"),
        "citizenEmail": data.get("citizenEmail"),
        "citizenPhone": data.get("citizenPhone"),
        "status": "SUBMITTED",
        "adminRemark": None,
        "createdAt": now,
        "updatedAt": now
    }), 201

@app.route("/api/complaints/<string:identifier>/status", methods=["PUT"])
def update_complaint_status(identifier):
    data = request.get_json()
    if not data or not data.get("status"):
        return jsonify({"error": "Bad Request", "message": "Field 'status' is required"}), 400

    new_status = data["status"]
    admin_remark = data.get("adminRemark")
    now = datetime.now().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()

    if identifier.isdigit():
        cursor.execute("SELECT * FROM complaints WHERE id = ? OR complaint_id = ?", (int(identifier), identifier))
    else:
        cursor.execute("SELECT * FROM complaints WHERE complaint_id = ?", (identifier,))

    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Not Found", "message": f"Complaint not found with identifier: {identifier}"}), 404

    target_id = row["id"]
    cursor.execute("""
        UPDATE complaints
        SET status = ?, admin_remark = COALESCE(?, admin_remark), updated_at = ?
        WHERE id = ?
    """, (new_status, admin_remark, now, target_id))
    conn.commit()

    cursor.execute("SELECT * FROM complaints WHERE id = ?", (target_id,))
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

import base64
import hashlib
import hmac
import json
import os
import tempfile
import time

import pytest

TEST_DB_DIR = tempfile.TemporaryDirectory(prefix="citizen-portal-tests-")
os.environ["FLASK_DB_PATH"] = os.path.join(TEST_DB_DIR.name, "complaints.db")
os.environ["JWT_SECRET"] = "test-only-jwt-secret-with-at-least-32-bytes"

from app import app, init_db


def create_token(role, email="citizen@example.com"):
    secret = os.environ["JWT_SECRET"].encode("utf-8")
    encode = lambda value: base64.urlsafe_b64encode(
        json.dumps(value, separators=(",", ":")).encode("utf-8")
    ).rstrip(b"=").decode("ascii")
    header = encode({"alg": "HS256", "typ": "JWT"})
    payload = encode({
        "sub": email,
        "userId": 1,
        "name": "Test User",
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + 600,
    })
    content = f"{header}.{payload}"
    signature = base64.urlsafe_b64encode(
        hmac.new(secret, content.encode("ascii"), hashlib.sha256).digest()
    ).rstrip(b"=").decode("ascii")
    return f"{content}.{signature}"


def auth_headers(role, email="citizen@example.com"):
    return {"Authorization": f"Bearer {create_token(role, email)}"}


@pytest.fixture
def client():
    app.config["TESTING"] = True
    init_db()
    with app.test_client() as test_client:
        yield test_client


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "UP"
    assert data["service"] == "flask-citizen-complaint-api"
    assert "database" not in data


def test_complaint_list_requires_officer_or_admin(client):
    assert client.get("/api/complaints").status_code == 401
    assert client.get(
        "/api/complaints", headers=auth_headers("ROLE_CITIZEN")
    ).status_code == 403

    response = client.get(
        "/api/complaints", headers=auth_headers("ROLE_OFFICER")
    )
    assert response.status_code == 200
    assert response.get_json()[0]["citizenEmail"]


def test_create_complaint_success(client):
    payload = {
        "title": "Road Pothole Near Gate",
        "category": "ROADS_AND_POTHOLES",
        "description": "Massive pothole collecting rain water.",
        "location": "North Gate Sector 2",
        "citizenName": "Test Citizen",
        "citizenEmail": "test@example.com",
        "citizenPhone": "9999900000",
    }
    assert client.post("/api/complaints", json=payload).status_code == 401
    response = client.post(
        "/api/complaints", json=payload, headers=auth_headers("ROLE_CITIZEN")
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["complaintId"].startswith("CMP-FLASK-")
    assert data["status"] == "SUBMITTED"
    assert "citizenEmail" not in data
    assert "citizenPhone" not in data
    stored = client.get(
        "/api/complaints", headers=auth_headers("ROLE_OFFICER")
    ).get_json()
    created = next(item for item in stored if item["complaintId"] == data["complaintId"])
    assert created["citizenEmail"] == "citizen@example.com"


def test_only_citizens_can_create_complaints(client):
    response = client.post(
        "/api/complaints",
        json={"title": "Road Pothole Near Gate"},
        headers=auth_headers("ROLE_OFFICER"),
    )
    assert response.status_code == 403


def test_create_complaint_validation_failure(client):
    response = client.post(
        "/api/complaints",
        json={"title": "Bad", "category": "", "description": "Too short", "location": ""},
        headers=auth_headers("ROLE_CITIZEN"),
    )
    assert response.status_code == 400
    assert response.get_json()["error"] == "Validation Failed"


def test_public_tracking_verifies_contact_and_redacts_contact_details(client):
    response = client.post(
        "/api/complaints/track",
        json={"complaintId": "CMP-FLASK-101", "verification": "rohan.v@example.com"},
    )
    assert response.status_code == 200
    assert response.get_json()["complaintId"] == "CMP-FLASK-101"
    assert "citizenEmail" not in response.get_json()
    assert "citizenPhone" not in response.get_json()

    mismatch = client.post(
        "/api/complaints/track",
        json={"complaintId": "CMP-FLASK-101", "verification": "wrong@example.com"},
    )
    assert mismatch.status_code == 403


def test_complaint_details_require_owner_or_municipal_role(client):
    assert client.get("/api/complaints/CMP-FLASK-101").status_code == 401
    citizen = client.get(
        "/api/complaints/CMP-FLASK-101",
        headers=auth_headers("ROLE_CITIZEN", "rohan.v@example.com"),
    )
    assert citizen.status_code == 200
    assert citizen.get_json()["citizenEmail"] == "rohan.v@example.com"

    other_citizen = client.get(
        "/api/complaints/CMP-FLASK-101",
        headers=auth_headers("ROLE_CITIZEN", "other@example.com"),
    )
    assert other_citizen.status_code == 403


def test_status_update_requires_municipal_role(client):
    payload = {"status": "RESOLVED", "adminRemark": "Issue fixed by municipal team"}
    assert client.put(
        "/api/complaints/CMP-FLASK-101/status", json=payload
    ).status_code == 401
    assert client.put(
        "/api/complaints/CMP-FLASK-101/status",
        json=payload,
        headers=auth_headers("ROLE_CITIZEN"),
    ).status_code == 403

    response = client.put(
        "/api/complaints/CMP-FLASK-101/status",
        json=payload,
        headers=auth_headers("ROLE_OFFICER"),
    )
    assert response.status_code == 200
    assert response.get_json()["status"] == "RESOLVED"


def test_status_update_rejects_unknown_status(client):
    response = client.put(
        "/api/complaints/CMP-FLASK-101/status",
        json={"status": "MADE_UP"},
        headers=auth_headers("ROLE_ADMIN"),
    )
    assert response.status_code == 400


def test_cors_allows_local_frontend_but_not_arbitrary_origins(client):
    allowed = client.options(
        "/api/complaints",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert allowed.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"

    denied = client.options(
        "/api/complaints",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert denied.headers.get("Access-Control-Allow-Origin") is None

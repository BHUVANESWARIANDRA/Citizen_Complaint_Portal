import os
import json
import pytest

# Use a separate test database for pytest
os.environ["FLASK_DB_PATH"] = "test_complaints_flask.db"

from app import app, init_db

@pytest.fixture
def client():
    app.config["TESTING"] = True
    init_db()
    with app.test_client() as client:
        yield client
    if os.path.exists("test_complaints_flask.db"):
        try:
            os.remove("test_complaints_flask.db")
        except:
            pass

def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "UP"
    assert data["service"] == "flask-citizen-complaint-api"

def test_get_complaints(client):
    response = client.get("/api/complaints")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 1

def test_create_complaint_success(client):
    payload = {
        "title": "Road Pothole Near Gate",
        "category": "ROADS_AND_POTHOLES",
        "description": "Massive pothole collecting rain water.",
        "location": "North Gate Sector 2",
        "citizenName": "Test Citizen",
        "citizenEmail": "test@example.com",
        "citizenPhone": "9999900000"
    }
    response = client.post("/api/complaints", json=payload)
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "complaintId" in data
    assert data["complaintId"].startswith("CMP-FLASK-")
    assert data["status"] == "SUBMITTED"

def test_create_complaint_validation_failure(client):
    invalid_payload = {
        "title": "Bad",
        "category": "",
        "description": "Too short",
        "location": ""
    }
    response = client.post("/api/complaints", json=invalid_payload)
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data["error"] == "Validation Failed"

def test_update_complaint_status(client):
    response = client.get("/api/complaints")
    first_item = json.loads(response.data)[0]
    identifier = first_item["complaintId"]

    update_payload = {
        "status": "RESOLVED",
        "adminRemark": "Issue fixed by municipal team"
    }
    update_resp = client.put(f"/api/complaints/{identifier}/status", json=update_payload)
    assert update_resp.status_code == 200
    data = json.loads(update_resp.data)
    assert data["status"] == "RESOLVED"
    assert data["adminRemark"] == "Issue fixed by municipal team"

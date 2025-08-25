import os
from fastapi.testclient import TestClient
from app.main import app


def test_turn_mock_text():
    os.environ["MOCK_MODE"] = "true"
    client = TestClient(app)
    payload = {
        "session_id": "s1",
        "content": "I feel sad",
        "output_mode": "text",
    }
    resp = client.post("/turn", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["turn_id"]
    assert data["llm_output"]["text"]



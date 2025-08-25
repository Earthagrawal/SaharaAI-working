from fastapi.testclient import TestClient
from app.main import app


def test_todo_lifecycle():
    client = TestClient(app)
    # create
    resp = client.post("/todo", json={"title": "Task 1"})
    assert resp.status_code == 200
    item = resp.json()
    assert item["done"] is False
    assert item["created_at"] == item["updated_at"]

    tid = item["id"]
    # list
    resp = client.get("/todo")
    assert any(x["id"] == tid for x in resp.json())

    # update
    resp = client.patch(f"/todo/{tid}", json={"done": True})
    assert resp.status_code == 200
    upd = resp.json()
    assert upd["done"] is True
    assert upd["updated_at"] != upd["created_at"]

    # delete
    resp = client.delete(f"/todo/{tid}")
    assert resp.status_code == 200
    # verify gone
    resp = client.get("/todo")
    assert all(x["id"] != tid for x in resp.json())


